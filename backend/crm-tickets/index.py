"""
CRM заявки: создание, просмотр, смена статуса, комментарии.
Клиенты видят только свои заявки, менеджеры — все.
"""
import json
import os
import psycopg2
from datetime import datetime


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

STATUS_LABELS = {
    "new": "Новая",
    "in_progress": "В работе",
    "waiting": "Ожидание",
    "done": "Выполнена",
    "cancelled": "Отменена",
}

PRIORITY_LABELS = {
    "low": "Низкий",
    "normal": "Обычный",
    "high": "Высокий",
    "urgent": "Срочный",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])



def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg}, ensure_ascii=False)}


def get_session(event, conn):
    """Возвращает (role, user_id, manager_role) или None."""
    auth = (event.get("headers") or {}).get("X-Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur = conn.cursor()

    cur.execute(
        f"SELECT client_id FROM client_sessions WHERE token=%s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    if row:
        cur.close()
        return ("client", row[0], None)

    cur.execute(
        f"""SELECT ms.manager_id, m.role FROM manager_sessions ms
           JOIN managers m ON m.id = ms.manager_id
           WHERE ms.token=%s AND ms.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if row:
        return ("manager", row[0], row[1])
    return None


def handler(event: dict, context) -> dict:
    """API заявок CRM ProFiX."""
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
                          m.name as manager_name
                   FROM tickets t
                   LEFT JOIN managers m ON m.id = t.manager_id
                   WHERE t.client_id = %s
                   ORDER BY t.created_at DESC""",
                (user_id,)
            )
        else:
            status_filter = params.get("status", "")
            if status_filter:
                cur.execute(
                    f"""SELECT t.id, t.title, t.status, t.priority, t.amount, t.paid,
                              t.created_at, t.updated_at,
                              c.name as client_name, c.phone,
                              m.name as manager_name
                       FROM tickets t
                       LEFT JOIN clients c ON c.id = t.client_id
                       LEFT JOIN managers m ON m.id = t.manager_id
                       WHERE t.status = %s
                       ORDER BY t.created_at DESC""",
                    (status_filter,)
                )
            else:
                cur.execute(
                    f"""SELECT t.id, t.title, t.status, t.priority, t.amount, t.paid,
                              t.created_at, t.updated_at,
                              c.name as client_name, c.phone,
                              m.name as manager_name
                       FROM tickets t
                       LEFT JOIN clients c ON c.id = t.client_id
                       LEFT JOIN managers m ON m.id = t.manager_id
                       ORDER BY t.created_at DESC"""
                )

        rows = cur.fetchall()
        tickets = []
        for r in rows:
            t = {
                "id": r[0], "title": r[1],
                "status": r[2], "status_label": STATUS_LABELS.get(r[2], r[2]),
                "priority": r[3], "priority_label": PRIORITY_LABELS.get(r[3], r[3]),
                "amount": float(r[4]) if r[4] else None,
                "paid": r[5],
                "created_at": r[6].isoformat() if r[6] else None,
                "updated_at": r[7].isoformat() if r[7] else None,
            }
            if role == "client":
                t["manager_name"] = r[8]
            else:
                t["client_name"] = r[8]
                t["client_phone"] = r[9]
                t["manager_name"] = r[10]
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
                      m.name as manager_name, t.client_id, t.manager_id
               FROM tickets t
               LEFT JOIN clients c ON c.id = t.client_id
               LEFT JOIN managers m ON m.id = t.manager_id
               WHERE t.id = %s""",
            (ticket_id,)
        )
        r = cur.fetchone()
        if not r:
            cur.close()
            conn.close()
            return err("Заявка не найдена", 404)

        if role == "client" and r[14] != user_id:
            cur.close()
            conn.close()
            return err("Доступ запрещён", 403)

        ticket = {
            "id": r[0], "title": r[1], "description": r[2],
            "status": r[3], "status_label": STATUS_LABELS.get(r[3], r[3]),
            "priority": r[4], "priority_label": PRIORITY_LABELS.get(r[4], r[4]),
            "amount": float(r[5]) if r[5] else None,
            "paid": r[6], "source": r[7],
            "created_at": r[8].isoformat() if r[8] else None,
            "updated_at": r[9].isoformat() if r[9] else None,
            "client": {"name": r[10], "phone": r[11], "email": r[12]},
            "manager_name": r[13],
        }

        cur.execute(
            f"""SELECT tc.id, tc.author_role, tc.text, tc.created_at,
                      CASE WHEN tc.author_role='client' THEN c.name
                           ELSE m.name END as author_name
               FROM ticket_comments tc
               LEFT JOIN clients c ON tc.author_role='client' AND c.id=tc.author_id
               LEFT JOIN managers m ON tc.author_role='manager' AND m.id=tc.author_id
               WHERE tc.ticket_id = %s ORDER BY tc.created_at ASC""",
            (ticket_id,)
        )
        comments = [
            {"id": c[0], "author_role": c[1], "text": c[2],
             "created_at": c[3].isoformat() if c[3] else None, "author_name": c[4]}
            for c in cur.fetchall()
        ]
        ticket["comments"] = comments

        cur.close()
        conn.close()
        return ok({"ticket": ticket})

    # ── СОЗДАТЬ ЗАЯВКУ ──────────────────────────────────────────────────────
    if method == "POST" and action == "create":
        title = body.get("title", "").strip()
        description = body.get("description", "").strip()
        priority = body.get("priority", "normal")
        amount = body.get("amount")
        client_id_param = body.get("client_id")

        if not title:
            cur.close()
            conn.close()
            return err("Укажите тему заявки")

        if role == "client":
            c_id = user_id
            source = "cabinet"
            m_id = None
        else:
            c_id = client_id_param
            source = "manual"
            m_id = user_id

        cur.execute(
            f"""INSERT INTO tickets (client_id, manager_id, title, description,
                                   priority, amount, source)
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
            (c_id, m_id, title, description, priority, amount, source)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return ok({"id": new_id, "created": True})

    # ── ОБНОВИТЬ ЗАЯВКУ (только менеджер) ───────────────────────────────────
    if method == "PUT" and action == "update":
        if role != "manager":
            cur.close()
            conn.close()
            return err("Доступ запрещён", 403)

        ticket_id = body.get("id")
        status = body.get("status")
        priority = body.get("priority")
        amount = body.get("amount")
        manager_id = body.get("manager_id")
        paid = body.get("paid")

        sets = ["updated_at = NOW()"]
        vals = []
        if status:
            sets.append("status = %s"); vals.append(status)
        if priority:
            sets.append("priority = %s"); vals.append(priority)
        if amount is not None:
            sets.append("amount = %s"); vals.append(amount)
        if manager_id is not None:
            sets.append("manager_id = %s"); vals.append(manager_id)
        if paid is not None:
            sets.append("paid = %s"); vals.append(paid)

        vals.append(ticket_id)
        cur.execute(f"UPDATE tickets SET {', '.join(sets)} WHERE id = %s", vals)
        conn.commit()
        cur.close()
        conn.close()
        return ok({"updated": True})

    # ── ДОБАВИТЬ КОММЕНТАРИЙ ─────────────────────────────────────────────────
    if method == "POST" and action == "comment":
        ticket_id = body.get("ticket_id")
        text = body.get("text", "").strip()

        if not text:
            cur.close()
            conn.close()
            return err("Текст комментария пустой")

        if role == "client":
            cur.execute(f"SELECT id FROM tickets WHERE id=%s AND client_id=%s", (ticket_id, user_id))
            if not cur.fetchone():
                cur.close()
                conn.close()
                return err("Заявка не найдена", 404)

        cur.execute(
            f"INSERT INTO ticket_comments (ticket_id, author_role, author_id, text) VALUES (%s,%s,%s,%s) RETURNING id",
            (ticket_id, role, user_id, text)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return ok({"id": new_id, "created": True})

    # ── СТАТИСТИКА (менеджер) ────────────────────────────────────────────────
    if method == "GET" and action == "stats":
        if role != "manager":
            cur.close()
            conn.close()
            return err("Доступ запрещён", 403)

        cur.execute(f"SELECT COUNT(*) FROM tickets")
        total = cur.fetchone()[0]
        cur.execute(f"SELECT status, COUNT(*) FROM tickets GROUP BY status")
        by_status = {r[0]: r[1] for r in cur.fetchall()}
        cur.execute(f"SELECT COUNT(*) FROM clients")
        clients_count = cur.fetchone()[0]
        cur.execute(f"SELECT COUNT(*) FROM tickets WHERE paid=TRUE")
        paid_count = cur.fetchone()[0]
        cur.execute(f"SELECT COALESCE(SUM(amount),0) FROM tickets WHERE paid=TRUE")
        revenue = float(cur.fetchone()[0])

        cur.close()
        conn.close()
        return ok({
            "total": total,
            "by_status": by_status,
            "clients": clients_count,
            "paid": paid_count,
            "revenue": revenue,
        })

    # ── СПИСОК КЛИЕНТОВ (менеджер) ───────────────────────────────────────────
    if method == "GET" and action == "clients":
        if role != "manager":
            cur.close()
            conn.close()
            return err("Доступ запрещён", 403)

        cur.execute(
            f"""SELECT c.id, c.name, c.phone, c.email, c.created_at,
                      COUNT(t.id) as tickets_count
               FROM clients c
               LEFT JOIN tickets t ON t.client_id = c.id
               GROUP BY c.id ORDER BY c.created_at DESC"""
        )
        clients = [
            {"id": r[0], "name": r[1], "phone": r[2], "email": r[3],
             "created_at": r[4].isoformat() if r[4] else None, "tickets_count": r[5]}
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return ok({"clients": clients})

    # ── СПИСОК МЕНЕДЖЕРОВ (admin) ────────────────────────────────────────────
    if method == "GET" and action == "managers":
        if role != "manager" or mgr_role != "admin":
            cur.close()
            conn.close()
            return err("Доступ запрещён", 403)

        cur.execute(f"SELECT id, login, name, role, created_at FROM managers ORDER BY created_at")
        managers = [
            {"id": r[0], "login": r[1], "name": r[2], "role": r[3],
             "created_at": r[4].isoformat() if r[4] else None}
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return ok({"managers": managers})

    cur.close()
    conn.close()
    return err("Неизвестное действие")