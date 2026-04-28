import json
import os
import psycopg2
from urllib.request import urlopen, Request as URequest

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"


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
    """Telegram webhook: привязка chat_id по телефону, ответы оператора."""

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
    user = message.get("from", {})
    first_name = user.get("first_name", "")
    tg_id = user.get("id", chat_id)

    # /start с параметром телефона — привязка аккаунта
    if text.startswith("/start"):
        parts = text.split(" ", 1)
        phone_param = parts[1].strip() if len(parts) > 1 else ""

        if phone_param:
            # Ищем клиента по телефону и сохраняем chat_id
            conn = psycopg2.connect(os.environ["DATABASE_URL"])
            cur = conn.cursor()
            # телефон передаётся в формате +79001234567, в БД может быть разный формат
            cur.execute(
                f"SELECT id, name FROM {SC}.clients WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(%s, '[^0-9]', '', 'g')",
                (phone_param,)
            )
            row = cur.fetchone()
            if row:
                cur.execute(
                    f"UPDATE {SC}.clients SET telegram_id = %s WHERE id = %s",
                    (tg_id, row[0])
                )
                conn.commit()
                name = row[1] or first_name or "клиент"
                send_tg(chat_id, (
                    f"✅ <b>Telegram успешно привязан!</b>\n\n"
                    f"Здравствуйте, {name}!\n"
                    f"Теперь вы будете получать коды входа и уведомления о заявках в этот чат."
                ))
            else:
                send_tg(chat_id, (
                    f"⚠️ Аккаунт с таким номером не найден.\n\n"
                    f"Сначала зарегистрируйтесь на сайте pfx.su/cabinet"
                ))
            cur.close()
            conn.close()
        else:
            send_tg(chat_id, (
                f"👋 Привет{', ' + first_name if first_name else ''}!\n\n"
                f"Я бот ProFiX. Чтобы привязать Telegram к личному кабинету, "
                f"перейдите на сайт pfx.su/cabinet и нажмите «Привязать Telegram»."
            ))
        return {"statusCode": 200, "headers": cors_headers, "body": "ok"}

    # Ответ оператора на сообщение из чата сайта
    reply_to = message.get("reply_to_message", {})
    if not reply_to or not text:
        return {"statusCode": 200, "headers": cors_headers, "body": "ok"}

    replied_message_id = reply_to.get("message_id")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    cur.execute(
        f"SELECT session_id FROM {SC}.chat_sessions WHERE tg_message_id = %s",
        (replied_message_id,),
    )
    row = cur.fetchone()

    if row:
        session_id = row[0]
        cur.execute(
            f"INSERT INTO {SC}.chat_messages (session_id, from_role, text) VALUES (%s, 'operator', %s)",
            (session_id, text),
        )
        cur.execute(
            f"UPDATE {SC}.chat_sessions SET updated_at = NOW() WHERE session_id = %s",
            (session_id,),
        )
        conn.commit()

    cur.close()
    conn.close()
    return {"statusCode": 200, "headers": cors_headers, "body": "ok"}
