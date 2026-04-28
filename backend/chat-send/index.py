import json
import os
import psycopg2
from urllib.request import urlopen, Request


def handler(event: dict, context) -> dict:
    """Принимает сообщение из чата сайта, сохраняет в БД и отправляет в Telegram."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    session_id = body.get("session_id", "").strip()
    text = body.get("text", "").strip()

    if not session_id or not text:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Нет session_id или текста"}, ensure_ascii=False),
        }

    _sc = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    cur.execute(f"SELECT session_id FROM {_sc}.chat_sessions WHERE session_id = %s", (session_id,))
    if not cur.fetchone():
        cur.execute(f"INSERT INTO {_sc}.chat_sessions (session_id) VALUES (%s)", (session_id,))

    cur.execute(
        f"INSERT INTO {_sc}.chat_messages (session_id, from_role, text) VALUES (%s, 'user', %s)",
        (session_id, text),
    )
    conn.commit()

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")

    if token and chat_id:
        tg_text = (
            f"💬 <b>Вопрос из чата сайта ProFiX</b>\n"
            f"🔑 Сессия: <code>{session_id[:8]}</code>\n\n"
            f"{text}\n\n"
            f"<i>Чтобы ответить — просто ответьте на это сообщение в Telegram</i>"
        )
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({
            "chat_id": chat_id,
            "text": tg_text,
            "parse_mode": "HTML",
        }).encode()
        req = Request(url, data=data, headers={"Content-Type": "application/json"})
        resp = urlopen(req, timeout=5)
        tg_resp = json.loads(resp.read())
        tg_message_id = tg_resp.get("result", {}).get("message_id")

        if tg_message_id:
            cur.execute(
                f"UPDATE {_sc}.chat_sessions SET tg_message_id = %s, updated_at = NOW() WHERE session_id = %s",
                (tg_message_id, session_id),
            )
            conn.commit()

    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"ok": True}, ensure_ascii=False),
    }