"""
Telegram-чат со специалистами.
Webhook от Telegram + API для AdminTgChat в браузере.
"""
import json
import os
from urllib.request import urlopen, Request as UReq

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Authorization",
}


def get_conn():
    import psycopg2
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg}, ensure_ascii=False)}


def send_tg(chat_id: int, text: str, reply_to: int = None) -> int | None:
    """Отправить сообщение в Telegram. Возвращает message_id."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token or not chat_id:
        return None
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_to:
        payload["reply_to_message_id"] = reply_to
    data = json.dumps(payload).encode()
    req = UReq(url, data=data, headers={"Content-Type": "application/json"})
    try:
        resp = urlopen(req, timeout=8)
        result = json.loads(resp.read())
        return result.get("result", {}).get("message_id")
    except Exception:
        return None


def verify_manager(event, conn):
    """Возвращает (manager_id, role, name) или None."""
    headers = event.get("headers") or {}
    auth = headers.get("Authorization") or headers.get("authorization") or ""
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"""SELECT ms.manager_id, m.role, COALESCE(m.name, m.full_name)
            FROM {SC}.manager_sessions ms
            JOIN {SC}.managers m ON m.id = ms.manager_id
            WHERE ms.token = %s AND ms.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row  # (id, role, name) or None


def handler(event: dict, context) -> dict:
    """Telegram-чат со специалистами: webhook + admin API."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body_raw = event.get("body") or "{}"

    # ── WEBHOOK от Telegram (без авторизации, по секрету в URL) ───────────────
    if action == "webhook":
        body = json.loads(body_raw)
        message = body.get("message", {})
        if not message:
            return ok({"ok": True})

        chat_id = message.get("chat", {}).get("id")
        text = (message.get("text") or "").strip()
        tg_msg_id = message.get("message_id")
        from_user = message.get("from", {})
        tg_user_id = from_user.get("id")
        first_name = from_user.get("first_name", "")
        username = from_user.get("username", "")

        conn = get_conn()
        cur = conn.cursor()

        # Команда /start — привязка специалиста
        if text.startswith("/start"):
            parts = text.split(" ", 1)
            token_param = parts[1].strip() if len(parts) > 1 else ""
            if token_param:
                # Ищем незавершённую сессию специалиста по токену
                cur.execute(
                    f"""SELECT ts.technician_id, t.name
                        FROM {SC}.technician_sessions ts
                        JOIN {SC}.technicians t ON t.id = ts.technician_id
                        WHERE ts.token = %s AND ts.expires_at > NOW()
                        ORDER BY ts.created_at DESC LIMIT 1""",
                    (token_param,)
                )
                row = cur.fetchone()
                if row:
                    tech_id, tech_name = row
                    cur.execute(
                        f"UPDATE {SC}.technicians SET tg_chat_id=%s, tg_username=%s WHERE id=%s",
                        (tg_user_id, username, tech_id)
                    )
                    conn.commit()
                    send_tg(chat_id,
                        f"✅ <b>Telegram привязан к аккаунту ProFiX!</b>\n\n"
                        f"Привет, {tech_name}!\n"
                        f"Теперь менеджер сможет написать вам прямо сюда, а вы — отвечать."
                    )
                else:
                    send_tg(chat_id,
                        "⚠️ Ссылка устарела или недействительна.\n"
                        "Войдите в портал специалиста и нажмите «Привязать Telegram» снова."
                    )
            else:
                send_tg(chat_id,
                    f"👋 Привет{', ' + first_name if first_name else ''}!\n\n"
                    "Я бот ProFiX для специалистов. "
                    "Войдите в портал специалиста и нажмите «Привязать Telegram»."
                )
            cur.close(); conn.close()
            return ok({"ok": True})

        # Обычное сообщение от специалиста → сохраняем в БД
        cur.execute(
            f"SELECT id, name FROM {SC}.technicians WHERE tg_chat_id = %s",
            (tg_user_id,)
        )
        tech = cur.fetchone()
        if tech:
            tech_id, tech_name = tech
            cur.execute(
                f"""INSERT INTO {SC}.tg_staff_messages
                    (tech_id, tg_chat_id, from_role, text, tg_message_id)
                    VALUES (%s, %s, 'tech', %s, %s)""",
                (tech_id, chat_id, text, tg_msg_id)
            )
            conn.commit()
        cur.close(); conn.close()
        return ok({"ok": True})

    # ── ADMIN API (требует авторизации менеджера) ─────────────────────────────
    conn = get_conn()
    mgr = verify_manager(event, conn)
    if not mgr:
        conn.close()
        return err("Необходима авторизация менеджера", 401)
    mgr_id, mgr_role, mgr_name = mgr

    cur = conn.cursor()
    body = json.loads(body_raw)

    # GET list — список специалистов с их Telegram и последним сообщением
    if method == "GET" and action == "list":
        cur.execute(f"""
            SELECT t.id, t.name, t.phone, t.tg_chat_id, t.tg_username, t.is_active,
                   (SELECT text FROM {SC}.tg_staff_messages m
                    WHERE m.tech_id = t.id ORDER BY m.created_at DESC LIMIT 1) as last_text,
                   (SELECT created_at FROM {SC}.tg_staff_messages m
                    WHERE m.tech_id = t.id ORDER BY m.created_at DESC LIMIT 1) as last_at,
                   (SELECT COUNT(*) FROM {SC}.tg_staff_messages m
                    WHERE m.tech_id = t.id AND m.from_role = 'tech' AND m.read_at IS NULL) as unread
            FROM {SC}.technicians t
            ORDER BY t.name
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"techs": rows})

    # GET history — история переписки с конкретным спецом
    if method == "GET" and action == "history":
        tech_id = int(params.get("tech_id", 0))
        after_id = int(params.get("after_id", 0))
        if not tech_id:
            cur.close(); conn.close()
            return err("Нужен tech_id")

        cur.execute(f"""
            SELECT id, from_role, text, tg_message_id, read_at, created_at
            FROM {SC}.tg_staff_messages
            WHERE tech_id = %s AND id > %s
            ORDER BY created_at ASC LIMIT 100
        """, (tech_id, after_id))
        msgs = [{"id": r[0], "from_role": r[1], "text": r[2],
                 "tg_message_id": r[3], "read": r[4] is not None,
                 "created_at": r[5].isoformat()} for r in cur.fetchall()]

        # Помечаем как прочитанные
        cur.execute(f"""
            UPDATE {SC}.tg_staff_messages
            SET read_at = NOW()
            WHERE tech_id = %s AND from_role = 'tech' AND read_at IS NULL
        """, (tech_id,))
        conn.commit()
        cur.close(); conn.close()
        return ok({"messages": msgs})

    # POST send — менеджер отправляет сообщение специалисту
    if method == "POST" and action == "send":
        tech_id = int(body.get("tech_id", 0))
        text = body.get("text", "").strip()
        if not tech_id or not text:
            cur.close(); conn.close()
            return err("Нужен tech_id и text")

        cur.execute(
            f"SELECT tg_chat_id, name FROM {SC}.technicians WHERE id = %s",
            (tech_id,)
        )
        tech = cur.fetchone()
        if not tech or not tech[0]:
            cur.close(); conn.close()
            return err("Специалист не привязал Telegram")

        tg_chat_id, tech_name = tech
        full_text = f"💬 <b>ProFiX</b>: {text}"
        tg_msg_id = send_tg(tg_chat_id, full_text)

        cur.execute(f"""
            INSERT INTO {SC}.tg_staff_messages
            (tech_id, tg_chat_id, from_role, text, tg_message_id, read_at)
            VALUES (%s, %s, 'manager', %s, %s, NOW())
        """, (tech_id, tg_chat_id, text, tg_msg_id))
        conn.commit()
        cur.close(); conn.close()
        return ok({"sent": True, "tg_msg_id": tg_msg_id})

    # GET unread_count — количество непрочитанных сообщений от всех спецов
    if action == "unread_count":
        cur.execute(f"""
            SELECT COUNT(*) FROM {SC}.tg_staff_messages
            WHERE from_role = 'tech' AND read_at IS NULL
        """)
        count = cur.fetchone()[0]
        cur.close(); conn.close()
        return ok({"unread": count})

    # POST link_tech — менеджер запрашивает ссылку привязки для специалиста
    if method == "POST" and action == "get_link":
        tech_id = int(body.get("tech_id", 0))
        if not tech_id:
            cur.close(); conn.close()
            return err("Нужен tech_id")
        # Берём последний активный токен специалиста
        cur.execute(f"""
            SELECT token FROM {SC}.technician_sessions
            WHERE technician_id = %s AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1
        """, (tech_id,))
        row = cur.fetchone()
        cur.close(); conn.close()
        if not row:
            return err("У специалиста нет активной сессии. Пусть войдёт в портал.")
        token = row[0]
        bot_name = os.environ.get("TELEGRAM_BOT_NAME", "ProFixBot")
        link = f"https://t.me/{bot_name}?start={token}"
        return ok({"link": link})

    cur.close(); conn.close()
    return err(f"Неизвестный action: {action}", 404)