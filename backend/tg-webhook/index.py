import json
import os
import psycopg2
from urllib.request import urlopen, Request as URequest


def send_tg(chat_id: int, text: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
    req = URequest(url, data=data, headers={"Content-Type": "application/json"})
    try:
        urlopen(req, timeout=5)
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Получает сообщения из Telegram: ответы оператора + команда /id для клиентов."""

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

    chat_id = message.get("chat", {}).get("id")
    text = message.get("text", "").strip()

    # Команда /id — клиент узнаёт свой Telegram ID для кабинета
    if text in ("/id", "/start"):
        user = message.get("from", {})
        first_name = user.get("first_name", "")
        tg_id = user.get("id", chat_id)
        reply = (
            f"👋 Привет{', ' + first_name if first_name else ''}!\n\n"
            f"🆔 Ваш Telegram ID: <code>{tg_id}</code>\n\n"
            f"Скопируйте этот номер и вставьте в личный кабинет на сайте ProFiX "
            f"в поле «Telegram ID» — и вы будете получать уведомления об изменении статуса заявок."
        )
        send_tg(chat_id, reply)
        return {"statusCode": 200, "headers": cors_headers, "body": "ok"}

    # Ответ оператора на сообщение из чата сайта
    reply_to = message.get("reply_to_message", {})
    if not reply_to or not text:
        return {"statusCode": 200, "headers": cors_headers, "body": "ok"}

    replied_message_id = reply_to.get("message_id")

    _sc = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    cur.execute(
        f"SELECT session_id FROM {_sc}.chat_sessions WHERE tg_message_id = %s",
        (replied_message_id,),
    )
    row = cur.fetchone()

    if row:
        session_id = row[0]
        cur.execute(
            f"INSERT INTO {_sc}.chat_messages (session_id, from_role, text) VALUES (%s, 'operator', %s)",
            (session_id, text),
        )
        cur.execute(
            f"UPDATE {_sc}.chat_sessions SET updated_at = NOW() WHERE session_id = %s",
            (session_id,),
        )
        conn.commit()

    cur.close()
    conn.close()

    return {"statusCode": 200, "headers": cors_headers, "body": "ok"}