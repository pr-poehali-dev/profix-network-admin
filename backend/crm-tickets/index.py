"""
CRM заявки: создание, просмотр, смена статуса, комментарии, тех специалисты, планирование.
"""
import json
import os
import psycopg2
from datetime import datetime
from urllib.request import urlopen, Request as URequest


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
}

STATUS_LABELS = {
    "new": "Новая", "in_progress": "В работе", "waiting": "Ожидание",
    "done": "Выполнена", "cancelled": "Отменена",
}
PRIORITY_LABELS = {
    "low": "Низкий", "normal": "Обычный", "high": "Высокий", "urgent": "Срочный",
}
STATUS_EMOJI = {
    "new": "🆕", "in_progress": "🔧", "waiting": "⏳", "done": "✅", "cancelled": "❌",
}

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def send_tg(chat_id: int, text: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token or not chat_id:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
    req = URequest(url, data=data, headers={"Content-Type": "application/json"})
    try:
        urlopen(req, timeout=5)
    except Exception:
        pass


def notify_client_status(conn, ticket_id: int, new_status: str) -> None:
    cur = conn.cursor()
    cur.execute(
        f"""SELECT c.telegram_id, c.name, t.title
           FROM {SC}.tickets t
           LEFT JOIN {SC}.clients c ON c.id = t.client_id
           WHERE t.id = %s""",
        (ticket_id,)
    )
    row = cur.fetchone()
    cur.close()
    if not row or not row[0]:
        return
    tg_id, client_name, title = row
    emoji = STATUS_EMOJI.get(new_status, "📋")
    status_label = STATUS_LABELS.get(new_status, new_status)
    greeting = f"Здравствуйте{', ' + client_name if client_name else ''}!"
    text = (
        f"{greeting}\n\n"
        f"{emoji} <b>Статус вашей заявки изменён</b>\n\n"
        f"📌 <b>Заявка:</b> {title}\n"
        f"📊 <b>Новый статус:</b> {status_label}\n\n"
    )
    if new_status == "in_progress":
        text += "Наш специалист приступил к работе. Если есть вопросы — пишите в ответ."
    elif new_status == "waiting":
        text += "Работа временно приостановлена. Мы свяжемся с вами в ближайшее время."
    elif new_status == "done":
        text += "Заявка выполнена! Спасибо, что обратились в ProFiX. 🙏"
    elif new_status == "cancelled":
        text += "Заявка отменена. Если у вас остались вопросы — звоните: +7 (914) 272-71-87."
    send_tg(tg_id, text)


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_session(event, conn):
    headers = event.get("headers") or {}
    auth = headers.get("X-Authorization", "") or headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT client_id FROM {SC}.client_sessions WHERE token=%s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    if row:
        cur.close()
        return ("client", row[0], None)
    cur.execute(
        f"""SELECT ms.manager_id, m.role FROM {SC}.manager_sessions ms
           JOIN {SC}.managers m ON m.id = ms.manager_id
           WHERE ms.token=%s AND ms.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if row:
        return ("manager", row[0], row[1])
    cur2 = conn.cursor()
    cur2.execute(
        f"SELECT technician_id FROM {SC}.technician_sessions WHERE token=%s AND expires_at > NOW()",
        (token,)
    )
    row = cur2.fetchone()
    cur2.close()
    if row:
        return ("technician", row[0], None)
    return None


def handler(event: dict, context) -> dict:
    """API заявок CRM ProFiX с поддержкой тех специалистов и планирования."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}
    action = body.get("action") or params.get("action", "")

    conn = get_conn()
    session = get_session(event, conn)

    if not session:
        conn.close()
        return err("Необходима авторизация", 401)

    role, user_id, mgr_role = session
    cur = conn.cursor()

    # ── СПИСОК ЗАЯВОК ───────────────────────────────────────────────────────
    if method == "GET" and action == "list":
        if role == "client":
            cur.execute(
                f"""SELECT t.id, t.title, t.status, t.priority, t.amount, t.paid,
                          t.created_at, t.updated_at,
                          COALESCE(m.name, m.full_name) as manager_name,
                          tech.name as technician_name,
                          t.scheduled_date, t.scheduled_hour
                   FROM {SC}.tickets t
                   LEFT JOIN {SC}.managers m ON m.id = t.manager_id
                   LEFT JOIN {SC}.technicians tech ON tech.id = t.technician_id
                   WHERE t.client_id = %s
                   ORDER BY t.created_at DESC""",
                (user_id,)
            )
        elif role == "technician":
            cur.execute(
                f"""SELECT t.id, t.title, t.status, t.priority, t.amount, t.paid,
                          t.created_at, t.updated_at,
                          COALESCE(m.name, m.full_name) as manager_name,
                          c.name as client_name, c.phone,
                          t.scheduled_date, t.scheduled_hour
                   FROM {SC}.tickets t
                   LEFT JOIN {SC}.managers m ON m.id = t.manager_id
                   LEFT JOIN {SC}.clients c ON c.id = t.client_id
                   WHERE t.technician_id = %s
                   ORDER BY t.scheduled_date ASC NULLS LAST, t.created_at DESC""",
                (user_id,)
            )
        else:
            status_filter = params.get("status", "")
            tech_filter = params.get("technician_id", "")
            date_filter = params.get("date", "")
            where_parts = []
            where_vals = []
            if status_filter:
                where_parts.append("t.status = %s")
                where_vals.append(status_filter)
            if tech_filter:
                where_parts.append("t.technician_id = %s")
                where_vals.append(int(tech_filter))
            if date_filter:
                where_parts.append("t.scheduled_date = %s")
                where_vals.append(date_filter)
            where_sql = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
            cur.execute(
                f"""SELECT t.id, t.title, t.status, t.priority, t.amount, t.paid,
                          t.created_at, t.updated_at,
                          c.name as client_name, c.phone,
                          COALESCE(m.name, m.full_name) as manager_name,
                          tech.name as technician_name,
                          t.scheduled_date, t.scheduled_hour
                   FROM {SC}.tickets t
                   LEFT JOIN {SC}.clients c ON c.id = t.client_id
                   LEFT JOIN {SC}.managers m ON m.id = t.manager_id
                   LEFT JOIN {SC}.technicians tech ON tech.id = t.technician_id
                   {where_sql}
                   ORDER BY t.scheduled_date ASC NULLS LAST, t.created_at DESC""",
                where_vals
            )

        rows = cur.fetchall()
        tickets = []
        for r in rows:
            if role == "client":
                t = {"id": r[0], "title": r[1], "status": r[2], "status_label": STATUS_LABELS.get(r[2], r[2]),
                     "priority": r[3], "priority_label": PRIORITY_LABELS.get(r[3], r[3]),
                     "amount": float(r[4]) if r[4] else None, "paid": r[5],
                     "created_at": r[6].isoformat() if r[6] else None,
                     "updated_at": r[7].isoformat() if r[7] else None,
                     "manager_name": r[8], "technician_name": r[9],
                     "scheduled_date": str(r[10]) if r[10] else None, "scheduled_hour": r[11]}
            elif role == "technician":
                t = {"id": r[0], "title": r[1], "status": r[2], "status_label": STATUS_LABELS.get(r[2], r[2]),
                     "priority": r[3], "priority_label": PRIORITY_LABELS.get(r[3], r[3]),
                     "amount": float(r[4]) if r[4] else None, "paid": r[5],
                     "created_at": r[6].isoformat() if r[6] else None,
                     "updated_at": r[7].isoformat() if r[7] else None,
                     "manager_name": r[8], "client_name": r[9], "client_phone": r[10],
                     "scheduled_date": str(r[11]) if r[11] else None, "scheduled_hour": r[12]}
            else:
                t = {"id": r[0], "title": r[1], "status": r[2], "status_label": STATUS_LABELS.get(r[2], r[2]),
                     "priority": r[3], "priority_label": PRIORITY_LABELS.get(r[3], r[3]),
                     "amount": float(r[4]) if r[4] else None, "paid": r[5],
                     "created_at": r[6].isoformat() if r[6] else None,
                     "updated_at": r[7].isoformat() if r[7] else None,
                     "client_name": r[8], "client_phone": r[9],
                     "manager_name": r[10], "technician_name": r[11],
                     "scheduled_date": str(r[12]) if r[12] else None, "scheduled_hour": r[13]}
            tickets.append(t)

        cur.close()
        conn.close()
        return ok({"tickets": tickets})

    # ── ОДНА ЗАЯВКА ─────────────────────────────────────────────────────────
    if method == "GET" and action == "get":
        ticket_id = int(params.get("id", 0))
        cur.execute(
            f"""SELECT t.id, t.title, t.description, t.status, t.priority,
                      t.amount, t.paid, t.source, t.created_at, t.updated_at,
                      c.name, c.phone, c.email,
                      COALESCE(m.name, m.full_name) as manager_name,
                      t.client_id, t.manager_id,
                      tech.id, tech.name, tech.phone,
                      t.scheduled_date, t.scheduled_hour, t.tech_notes
               FROM {SC}.tickets t
               LEFT JOIN {SC}.clients c ON c.id = t.client_id
               LEFT JOIN {SC}.managers m ON m.id = t.manager_id
               LEFT JOIN {SC}.technicians tech ON tech.id = t.technician_id
               WHERE t.id = %s""",
            (ticket_id,)
        )
        r = cur.fetchone()
        if not r:
            cur.close(); conn.close()
            return err("Заявка не найдена", 404)

        if role == "client" and r[14] != user_id:
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)

        if role == "technician":
            cur.execute(f"SELECT technician_id FROM {SC}.tickets WHERE id=%s", (ticket_id,))
            tr = cur.fetchone()
            if not tr or tr[0] != user_id:
                cur.close(); conn.close()
                return err("Доступ запрещён", 403)

        ticket = {
            "id": r[0], "title": r[1], "description": r[2],
            "status": r[3], "status_label": STATUS_LABELS.get(r[3], r[3]),
            "priority": r[4], "priority_label": PRIORITY_LABELS.get(r[4], r[4]),
            "amount": float(r[5]) if r[5] else None, "paid": r[6], "source": r[7],
            "created_at": r[8].isoformat() if r[8] else None,
            "updated_at": r[9].isoformat() if r[9] else None,
            "client": {"name": r[10], "phone": r[11], "email": r[12]},
            "manager_name": r[13],
            "technician": {"id": r[16], "name": r[17], "phone": r[18]} if r[16] else None,
            "scheduled_date": str(r[19]) if r[19] else None,
            "scheduled_hour": r[20],
            "tech_notes": r[21],
        }

        cur.execute(
            f"""SELECT tc.id, tc.author_type, tc.text, tc.created_at,
                      CASE WHEN tc.author_type='client' THEN cl.name
                           WHEN tc.author_type='technician' THEN tech.name
                           ELSE COALESCE(m.name, m.full_name) END as author_name
               FROM {SC}.ticket_comments tc
               LEFT JOIN {SC}.clients cl ON tc.author_type='client' AND cl.id=tc.author_id
               LEFT JOIN {SC}.managers m ON tc.author_type='manager' AND m.id=tc.author_id
               LEFT JOIN {SC}.technicians tech ON tc.author_type='technician' AND tech.id=tc.author_id
               WHERE tc.ticket_id = %s ORDER BY tc.created_at ASC""",
            (ticket_id,)
        )
        ticket["comments"] = [
            {"id": c[0], "author_role": c[1], "text": c[2],
             "created_at": c[3].isoformat() if c[3] else None, "author_name": c[4]}
            for c in cur.fetchall()
        ]

        cur.close(); conn.close()
        return ok({"ticket": ticket})

    # ── СОЗДАТЬ ЗАЯВКУ ──────────────────────────────────────────────────────
    if method == "POST" and action == "create":
        title = body.get("title", "").strip()
        description = body.get("description", "").strip()
        priority = body.get("priority", "normal")
        amount = body.get("amount")
        client_id_param = body.get("client_id")
        technician_id = body.get("technician_id")
        scheduled_date = body.get("scheduled_date")
        scheduled_hour = body.get("scheduled_hour")
        tech_notes = body.get("tech_notes", "")

        if not title:
            cur.close(); conn.close()
            return err("Укажите тему заявки")

        if role == "client":
            c_id, source, m_id = user_id, "cabinet", None
        else:
            c_id, source, m_id = client_id_param, "manual", user_id

        cur.execute(
            f"""INSERT INTO {SC}.tickets (client_id, manager_id, title, description, priority, amount,
                                   source, technician_id, scheduled_date, scheduled_hour, tech_notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (c_id, m_id, title, description, priority, amount,
             source, technician_id or None, scheduled_date or None, scheduled_hour, tech_notes or None)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return ok({"id": new_id, "created": True})

    # ── ОБНОВИТЬ ЗАЯВКУ ─────────────────────────────────────────────────────
    if method == "PUT" and action == "update":
        if role not in ("manager", "technician"):
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)

        ticket_id = body.get("id")
        sets, vals = ["updated_at = NOW()"], []

        if role == "manager":
            for field, col in [("status", "status"), ("priority", "priority"),
                                ("amount", "amount"), ("manager_id", "manager_id"),
                                ("paid", "paid"), ("tech_notes", "tech_notes"),
                                ("scheduled_date", "scheduled_date"),
                                ("scheduled_hour", "scheduled_hour")]:
                if body.get(field) is not None:
                    sets.append(f"{col} = %s"); vals.append(body[field])
            if "technician_id" in body:
                sets.append("technician_id = %s"); vals.append(body["technician_id"])
        else:
            if body.get("status"):
                sets.append("status = %s"); vals.append(body["status"])
            if body.get("tech_notes") is not None:
                sets.append("tech_notes = %s"); vals.append(body["tech_notes"])

        vals.append(ticket_id)
        cur.execute(f"UPDATE {SC}.tickets SET {', '.join(sets)} WHERE id = %s", vals)
        conn.commit()

        new_status = body.get("status")
        if new_status:
            notify_client_status(conn, ticket_id, new_status)

        cur.close(); conn.close()
        return ok({"updated": True})

    # ── КОММЕНТАРИЙ ──────────────────────────────────────────────────────────
    if method == "POST" and action == "comment":
        ticket_id = body.get("ticket_id")
        text = body.get("text", "").strip()
        if not text:
            cur.close(); conn.close()
            return err("Текст пустой")

        if role == "client":
            cur.execute(f"SELECT id FROM {SC}.tickets WHERE id=%s AND client_id=%s", (ticket_id, user_id))
            if not cur.fetchone():
                cur.close(); conn.close()
                return err("Заявка не найдена", 404)

        if role == "technician":
            cur.execute(f"SELECT id FROM {SC}.tickets WHERE id=%s AND technician_id=%s", (ticket_id, user_id))
            if not cur.fetchone():
                cur.close(); conn.close()
                return err("Заявка не найдена", 404)

        cur.execute(
            f"INSERT INTO {SC}.ticket_comments (ticket_id, author_type, author_id, text) VALUES (%s,%s,%s,%s) RETURNING id",
            (ticket_id, role, user_id, text)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return ok({"id": new_id, "created": True})

    # ── СТАТИСТИКА ───────────────────────────────────────────────────────────
    if method == "GET" and action == "stats":
        if role != "manager":
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)
        cur.execute(f"SELECT COUNT(*) FROM {SC}.tickets")
        total = cur.fetchone()[0]
        cur.execute(f"SELECT status, COUNT(*) FROM {SC}.tickets GROUP BY status")
        by_status = {r[0]: r[1] for r in cur.fetchall()}
        cur.execute(f"SELECT COUNT(*) FROM {SC}.clients")
        clients_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM {SC}.tickets WHERE paid=TRUE")
        paid_count = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM {SC}.tickets WHERE paid=TRUE")
        revenue = float(cur.fetchone()[0])
        cur.close(); conn.close()
        return ok({"total": total, "by_status": by_status, "clients": clients_count,
                   "paid": paid_count, "revenue": revenue})

    # ── КЛИЕНТЫ ──────────────────────────────────────────────────────────────
    if method == "GET" and action == "clients":
        if role != "manager":
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)
        cur.execute(
            f"""SELECT c.id, c.name, c.phone, c.email, c.created_at, COUNT(t.id) as tc
               FROM {SC}.clients c LEFT JOIN {SC}.tickets t ON t.client_id = c.id
               GROUP BY c.id ORDER BY c.created_at DESC"""
        )
        clients = [
            {"id": r[0], "name": r[1], "phone": r[2], "email": r[3],
             "created_at": r[4].isoformat() if r[4] else None, "tickets_count": r[5]}
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return ok({"clients": clients})

    # ── МЕНЕДЖЕРЫ ────────────────────────────────────────────────────────────
    if method == "GET" and action == "managers":
        if role != "manager":
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)
        cur.execute(f"SELECT id, login, COALESCE(name, full_name), role, created_at FROM {SC}.managers ORDER BY id")
        managers = [{"id": r[0], "login": r[1], "name": r[2], "role": r[3],
                     "created_at": r[4].isoformat() if r[4] else None}
                    for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"managers": managers})

    # ── ТЕХ СПЕЦИАЛИСТЫ ──────────────────────────────────────────────────────
    if method == "GET" and action == "technicians":
        cur.execute(
            f"""SELECT t.id, t.name, t.phone, t.email, t.specialization, t.is_active,
                      COUNT(tk.id) FILTER (WHERE tk.status NOT IN ('done','cancelled')) as active_tickets
               FROM {SC}.technicians t
               LEFT JOIN {SC}.tickets tk ON tk.technician_id = t.id
               WHERE t.is_active = TRUE
               GROUP BY t.id ORDER BY t.name"""
        )
        technicians = [
            {"id": r[0], "name": r[1], "phone": r[2], "email": r[3],
             "specialization": r[4], "is_active": r[5], "active_tickets": r[6]}
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return ok({"technicians": technicians})

    if method == "POST" and action == "technician_create":
        if role != "manager":
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)
        name = body.get("name", "").strip()
        phone = body.get("phone", "").strip()
        email = body.get("email", "").strip()
        spec = body.get("specialization", "").strip()
        if not name:
            cur.close(); conn.close()
            return err("Укажите имя специалиста")
        cur.execute(
            f"INSERT INTO {SC}.technicians (name, phone, email, specialization) VALUES (%s,%s,%s,%s) RETURNING id",
            (name, phone or None, email or None, spec or None)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return ok({"id": new_id, "created": True})

    # ── РАСПИСАНИЕ ТЕХНИКА ───────────────────────────────────────────────────
    if method == "GET" and action == "schedule":
        tech_id = params.get("technician_id")
        date = params.get("date")
        if not tech_id:
            cur.close(); conn.close()
            return err("Укажите technician_id")
        q = f"""SELECT t.id, t.title, t.status, t.scheduled_date, t.scheduled_hour,
                      c.name as client_name, c.phone as client_phone
               FROM {SC}.tickets t LEFT JOIN {SC}.clients c ON c.id = t.client_id
               WHERE t.technician_id = %s AND t.status NOT IN ('done','cancelled')"""
        vals = [int(tech_id)]
        if date:
            q += " AND t.scheduled_date = %s"
            vals.append(date)
        q += " ORDER BY t.scheduled_date ASC, t.scheduled_hour ASC"
        cur.execute(q, vals)
        schedule = [
            {"id": r[0], "title": r[1], "status": r[2],
             "scheduled_date": str(r[3]) if r[3] else None,
             "scheduled_hour": r[4], "client_name": r[5], "client_phone": r[6]}
            for r in cur.fetchall()
        ]
        cur.close(); conn.close()
        return ok({"schedule": schedule})

    cur.close(); conn.close()
    return err("Неизвестное действие")