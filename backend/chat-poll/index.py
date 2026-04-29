import json
import os
import psycopg2
# redeploy


def handler(event: dict, context) -> dict:
    """Возвращает новые сообщения оператора для чата по session_id."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    params = event.get("queryStringParameters") or {}
    session_id = params.get("session_id", "").strip()
    after_id = int(params.get("after_id", 0))

    if not session_id:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Нет session_id"}, ensure_ascii=False),
        }

    _sc = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    cur.execute(
        f"SELECT id, from_role, text, created_at FROM {_sc}.chat_messages WHERE session_id = %s AND id > %s AND from_role = 'operator' ORDER BY created_at ASC",
        (session_id, after_id),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    messages = [
        {
            "id": r[0],
            "from": r[1],
            "text": r[2],
            "time": r[3].strftime("%H:%M"),
        }
        for r in rows
    ]

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"messages": messages}, ensure_ascii=False),
    }