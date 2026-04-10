import json
import os
import psycopg2


def handler(event: dict, context) -> dict:
    """Получает ответы от оператора из Telegram и сохраняет в БД."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body") or "{}")

    message = body.get("message", {})
    if not message:
        return {"statusCode": 200, "headers": cors_headers, "body": "ok"}

    reply_to = message.get("reply_to_message", {})
    text = message.get("text", "").strip()

    if not reply_to or not text:
        return {"statusCode": 200, "headers": cors_headers, "body": "ok"}

    replied_message_id = reply_to.get("message_id")

    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    cur.execute(
        "SELECT session_id FROM chat_sessions WHERE tg_message_id = %s",
        (replied_message_id,),
    )
    row = cur.fetchone()

    if row:
        session_id = row[0]
        cur.execute(
            "INSERT INTO chat_messages (session_id, from_role, text) VALUES (%s, 'operator', %s)",
            (session_id, text),
        )
        cur.execute(
            "UPDATE chat_sessions SET updated_at = NOW() WHERE session_id = %s",
            (session_id,),
        )
        conn.commit()

    cur.close()
    conn.close()

    return {"statusCode": 200, "headers": cors_headers, "body": "ok"}
