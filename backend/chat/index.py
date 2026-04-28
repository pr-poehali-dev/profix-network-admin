import json
import os
import psycopg2
from urllib.request import urlopen, Request

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def handle_send(body, conn):
    """POST — отправить сообщение из чата сайта."""
    session_id = body.get("session_id", "").strip()
    text = body.get("text", "").strip()
    if not session_id or not text:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет session_id или текста"}, ensure_ascii=False)}

    cur = conn.cursor()
    cur.execute("SELECT session_id FROM chat_sessions WHERE session_id = %s", (session_id,))
    if not cur.fetchone():
        cur.execute("INSERT INTO chat_sessions (session_id) VALUES (%s)", (session_id,))
    cur.execute("INSERT INTO chat_messages (session_id, from_role, text) VALUES (%s, 'user', %s)", (session_id, text))
    conn.commit()

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if token and chat_id:
        tg_text = (
            f"💬 <b>Вопрос из чата сайта ProFiX</b>\n"
            f"🔑 Сессия: <code>{session_id[:8]}</code>\n\n{text}\n\n"
            f"<i>Чтобы ответить — ответьте на это сообщение в Telegram</i>"
        )
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": tg_text, "parse_mode": "HTML"}).encode()
        req = Request(url, data=data, headers={"Content-Type": "application/json"})
        resp = urlopen(req, timeout=5)
        tg_resp = json.loads(resp.read())
        tg_message_id = tg_resp.get("result", {}).get("message_id")
        if tg_message_id:
            cur.execute("UPDATE chat_sessions SET tg_message_id = %s, updated_at = NOW() WHERE session_id = %s", (tg_message_id, session_id))
            conn.commit()
    cur.close()
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True}, ensure_ascii=False)}


def handle_poll(params, conn):
    """GET — получить новые сообщения от оператора."""
    session_id = params.get("session_id", "").strip()
    after_id = int(params.get("after_id", 0))
    if not session_id:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет session_id"}, ensure_ascii=False)}

    cur = conn.cursor()
    cur.execute(
        "SELECT id, from_role, text, created_at FROM chat_messages WHERE session_id = %s AND id > %s AND from_role = 'operator' ORDER BY created_at ASC",
        (session_id, after_id),
    )
    rows = cur.fetchall()
    cur.close()
    messages = [{"id": r[0], "from": r[1], "text": r[2], "time": r[3].strftime("%H:%M")} for r in rows]
    return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Чат сайта: POST — отправить сообщение, GET — получить новые ответы оператора."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    _schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    _dsn = os.environ["DATABASE_URL"]
    _sep = "&" if "?" in _dsn else "?"
    conn = psycopg2.connect(_dsn + _sep + "options=-c%20search_path%3D" + _schema)
    try:
        if event.get("httpMethod") == "POST":
            body = json.loads(event.get("body") or "{}")
            return handle_send(body, conn)
        else:
            params = event.get("queryStringParameters") or {}
            return handle_poll(params, conn)
    finally:
        conn.close()