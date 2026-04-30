"""
Внутренний чат: менеджер ↔ техспециалист + уведомления (колокольчик).
Также: список диалогов с клиентами и ответы клиентам из chat_messages.
"""
import json
import os
import psycopg2
from datetime import datetime

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
}

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


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
        f"""SELECT ms.manager_id, m.role, m.name FROM {SC}.manager_sessions ms
           JOIN {SC}.managers m ON m.id = ms.manager_id
           WHERE ms.token=%s AND ms.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    if row:
        cur.close()
        return ("manager", row[0], row[1], row[2])
    cur.execute(
        f"""SELECT ts.technician_id, t.name FROM {SC}.technician_sessions ts
           JOIN {SC}.technicians t ON t.id = ts.technician_id
           WHERE ts.token=%s AND ts.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    if row:
        return ("technician", row[0], None, row[1])
    return None


def handler(event: dict, context) -> dict:
    """Внутренний чат и уведомления для менеджеров и тех.специалистов."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")
    action = body.get("action") or params.get("action", "")

    conn = get_conn()
    session = get_session(event, conn)
    if not session:
        conn.close()
        return err("Необходима авторизация", 401)

    role, user_id, mgr_role, user_name = session
    cur = conn.cursor()

    # ── УВЕДОМЛЕНИЯ: количество непрочитанных ───────────────────────────────
    if action == "notify_count":
        # Непрочитанные внутренние сообщения
        cur.execute(
            f"""SELECT COUNT(*) FROM {SC}.internal_messages
               WHERE to_role=%s AND to_id=%s AND read_at IS NULL""",
            (role, user_id)
        )
        unread_internal = cur.fetchone()[0]

        # Менеджеру: непрочитанные сообщения из клиентского чата
        unread_client = 0
        new_reviews = 0
        if role == "manager":
            cur.execute(
                f"""SELECT COUNT(*) FROM {SC}.chat_messages cm
                   JOIN {SC}.chat_sessions cs ON cs.session_id = cm.session_id
                   WHERE cm.from_role = 'user'
                   AND cm.id > COALESCE((
                     SELECT CAST(value AS INTEGER) FROM {SC}.site_content
                     WHERE key = 'manager.chat_last_seen.' || %s::text
                   ), 0)""",
                (user_id,)
            )
            row = cur.fetchone()
            unread_client = row[0] if row else 0

            cur.execute(f"SELECT COUNT(*) FROM {SC}.reviews WHERE published = FALSE")
            row = cur.fetchone()
            new_reviews = row[0] if row else 0

        cur.close()
        conn.close()
        return ok({
            "unread_internal": unread_internal,
            "unread_client": unread_client,
            "new_reviews": new_reviews,
            "total": unread_internal + unread_client
        })

    # ── ВНУТРЕННИЙ ЧАТ: список контактов ────────────────────────────────────
    if action == "contacts":
        if role == "manager":
            cur.execute(
                f"""SELECT t.id, t.name, t.phone,
                          (SELECT COUNT(*) FROM {SC}.internal_messages im
                           WHERE im.to_role='manager' AND im.to_id=%s
                           AND im.from_role='technician' AND im.from_id=t.id
                           AND im.read_at IS NULL) as unread
                   FROM {SC}.technicians t WHERE t.is_active=TRUE ORDER BY t.name""",
                (user_id,)
            )
            contacts = [{"id": r[0], "name": r[1], "phone": r[2], "role": "technician", "unread": r[3]}
                        for r in cur.fetchall()]
        else:
            cur.execute(
                f"""SELECT m.id, COALESCE(m.name, m.full_name) as name,
                          (SELECT COUNT(*) FROM {SC}.internal_messages im
                           WHERE im.to_role='technician' AND im.to_id=%s
                           AND im.from_role='manager' AND im.from_id=m.id
                           AND im.read_at IS NULL) as unread
                   FROM {SC}.managers m ORDER BY m.id""",
                (user_id,)
            )
            contacts = [{"id": r[0], "name": r[1], "role": "manager", "unread": r[2]}
                        for r in cur.fetchall()]
        cur.close()
        conn.close()
        return ok({"contacts": contacts})

    # ── ВНУТРЕННИЙ ЧАТ: история ─────────────────────────────────────────────
    if action == "history":
        peer_role = params.get("peer_role") or body.get("peer_role")
        peer_id = int(params.get("peer_id") or body.get("peer_id", 0))
        after_id = int(params.get("after_id", 0))

        cur.execute(
            f"""SELECT id, from_role, from_id, text, created_at, read_at
               FROM {SC}.internal_messages
               WHERE id > %s AND (
                 (from_role=%s AND from_id=%s AND to_role=%s AND to_id=%s) OR
                 (from_role=%s AND from_id=%s AND to_role=%s AND to_id=%s)
               )
               ORDER BY created_at ASC LIMIT 100""",
            (after_id, role, user_id, peer_role, peer_id, peer_role, peer_id, role, user_id)
        )
        messages = [{"id": r[0], "from_role": r[1], "from_id": r[2], "text": r[3],
                     "created_at": r[4].isoformat() if r[4] else None,
                     "read": r[5] is not None} for r in cur.fetchall()]

        # Помечаем прочитанными
        cur.execute(
            f"""UPDATE {SC}.internal_messages SET read_at=NOW()
               WHERE to_role=%s AND to_id=%s AND from_role=%s AND from_id=%s AND read_at IS NULL""",
            (role, user_id, peer_role, peer_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return ok({"messages": messages})

    # ── ВНУТРЕННИЙ ЧАТ: отправить ───────────────────────────────────────────
    if method == "POST" and action == "send_internal":
        to_role = body.get("to_role")
        to_id = int(body.get("to_id", 0))
        text = body.get("text", "").strip()
        if not text or not to_role or not to_id:
            cur.close(); conn.close()
            return err("Нет получателя или текста")
        cur.execute(
            f"INSERT INTO {SC}.internal_messages (from_role, from_id, to_role, to_id, text) VALUES (%s,%s,%s,%s,%s) RETURNING id",
            (role, user_id, to_role, to_id, text)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return ok({"id": new_id, "sent": True})

    # ── КЛИЕНТСКИЙ ЧАТ: список сессий (только менеджер) ─────────────────────
    if action == "client_sessions":
        if role != "manager":
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)
        cur.execute(
            f"""SELECT cs.session_id, cs.created_at, cs.updated_at,
                      (SELECT text FROM {SC}.chat_messages WHERE session_id=cs.session_id ORDER BY created_at DESC LIMIT 1) as last_msg,
                      (SELECT COUNT(*) FROM {SC}.chat_messages WHERE session_id=cs.session_id AND from_role='user') as msg_count,
                      (SELECT COUNT(*) FROM {SC}.chat_messages cm2
                       WHERE cm2.session_id=cs.session_id AND cm2.from_role='user'
                       AND cm2.id > COALESCE((
                         SELECT CAST(value AS INTEGER) FROM {SC}.site_content
                         WHERE key = 'manager.chat_last_seen.' || %s::text
                       ), 0)) as unread
               FROM {SC}.chat_sessions cs
               ORDER BY cs.updated_at DESC LIMIT 50""",
            (user_id,)
        )
        sessions = [{"session_id": r[0],
                     "created_at": r[1].isoformat() if r[1] else None,
                     "updated_at": r[2].isoformat() if r[2] else None,
                     "last_msg": r[3], "msg_count": r[4], "unread": r[5]}
                    for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"sessions": sessions})

    # ── КЛИЕНТСКИЙ ЧАТ: история сессии ──────────────────────────────────────
    if action == "client_history":
        if role != "manager":
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)
        session_id = params.get("session_id") or body.get("session_id", "")
        after_id = int(params.get("after_id", 0))
        cur.execute(
            f"""SELECT id, from_role, text, created_at FROM {SC}.chat_messages
               WHERE session_id=%s AND id > %s ORDER BY created_at ASC""",
            (session_id, after_id)
        )
        messages = [{"id": r[0], "from": r[1], "text": r[2],
                     "time": r[3].strftime("%H:%M") if r[3] else ""} for r in cur.fetchall()]

        # Обновить last_seen
        if messages:
            last_id = max(m["id"] for m in messages)
            key = f"manager.chat_last_seen.{user_id}"
            cur.execute(
                f"INSERT INTO {SC}.site_content (key, value) VALUES (%s, %s) ON CONFLICT (key) DO UPDATE SET value=%s, updated_at=NOW()",
                (key, str(last_id), str(last_id))
            )
            conn.commit()
        cur.close(); conn.close()
        return ok({"messages": messages})

    # ── КЛИЕНТСКИЙ ЧАТ: ответить клиенту ────────────────────────────────────
    if method == "POST" and action == "reply_client":
        if role != "manager":
            cur.close(); conn.close()
            return err("Доступ запрещён", 403)
        session_id = body.get("session_id", "")
        text = body.get("text", "").strip()
        if not text or not session_id:
            cur.close(); conn.close()
            return err("Нет текста или session_id")
        cur.execute(
            f"INSERT INTO {SC}.chat_messages (session_id, from_role, text) VALUES (%s, 'operator', %s) RETURNING id",
            (session_id, text)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close(); conn.close()
        return ok({"id": new_id, "sent": True})

    cur.close()
    conn.close()
    return err("Неизвестный action")
