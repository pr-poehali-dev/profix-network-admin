import json
import os
import time
import psycopg2
from urllib.request import urlopen, Request

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"


def notify_by_email(session_id: str, text: str) -> None:
    """Запасной канал: если Telegram недоступен — шлём вопрос из чата на почту."""
    import smtplib
    from email.mime.text import MIMEText

    host = os.environ.get("SMTP_HOST", "")
    user = os.environ.get("SMTP_USER", "")
    password = os.environ.get("SMTP_PASSWORD", "")
    port = int(os.environ.get("SMTP_PORT", "465") or 465)
    if not host or not user or not password:
        print("[MAIL SKIP] не настроены параметры почты")
        return

    msg = MIMEText(
        f"Новый вопрос из чата на сайте ProFiX\n\n"
        f"Сессия: {session_id}\n\n"
        f"Сообщение:\n{text}\n\n"
        f"Ответить можно в админке сайта: раздел «Чаты с клиентами».",
        "plain", "utf-8",
    )
    msg["Subject"] = "Вопрос из чата сайта ProFiX"
    msg["From"] = user
    msg["To"] = user

    try:
        if port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=8)
        else:
            server = smtplib.SMTP(host, port, timeout=8)
            server.starttls()
        try:
            server.login(user, password)
            server.sendmail(user, user, msg.as_string())
            print("[MAIL OK] вопрос из чата отправлен на почту")
        finally:
            try:
                server.quit()
            except Exception:
                pass
    except Exception as e:
        print(f"[MAIL ERROR] {type(e).__name__}: {e}")


def handle_send(body, conn):
    """POST — отправить сообщение из чата сайта."""
    session_id = body.get("session_id", "").strip()
    text = body.get("text", "").strip()
    if not session_id or not text:
        return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет session_id или текста"}, ensure_ascii=False)}

    cur = conn.cursor()
    cur.execute(f"SELECT session_id FROM {SC}.chat_sessions WHERE session_id = %s", (session_id,))
    if not cur.fetchone():
        cur.execute(f"INSERT INTO {SC}.chat_sessions (session_id) VALUES (%s)", (session_id,))
    cur.execute(f"INSERT INTO {SC}.chat_messages (session_id, from_role, text) VALUES (%s, 'user', %s)", (session_id, text))
    conn.commit()

    delivered = False
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        print(f"[TG SKIP] token_set={bool(token)} chat_id_set={bool(chat_id)}")
    if token and chat_id:
        try:
            tg_text = (
                f"💬 <b>Вопрос из чата сайта ProFiX</b>\n"
                f"🔑 Сессия: <code>{session_id[:8]}</code>\n\n{text}\n\n"
                f"<i>Чтобы ответить — ответьте на это сообщение в Telegram</i>"
            )
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            data = json.dumps({"chat_id": chat_id, "text": tg_text, "parse_mode": "HTML"}).encode()
            req = Request(url, data=data, headers={"Content-Type": "application/json"})
            _t0 = time.time()
            resp = urlopen(req, timeout=2)
            tg_resp = json.loads(resp.read())
            print(f"[TG OK] за {round(time.time() - _t0, 2)}с")
            tg_message_id = tg_resp.get("result", {}).get("message_id")
            if tg_message_id:
                cur.execute(f"UPDATE {SC}.chat_sessions SET tg_message_id = %s, updated_at = NOW() WHERE session_id = %s", (tg_message_id, session_id))
                conn.commit()
                delivered = True
            else:
                print(f"[TG FAIL] ответ Telegram без message_id: {tg_resp}")
        except Exception as e:
            detail = ""
            try:
                detail = e.read().decode()[:300]
            except Exception:
                detail = repr(e)
            print(f"[TG ERROR] {type(e).__name__}: {detail}")

    if not delivered:
        notify_by_email(session_id, text)

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
        f"SELECT id, from_role, text, created_at FROM {SC}.chat_messages WHERE session_id = %s AND id > %s AND from_role = 'operator' ORDER BY created_at ASC",
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


    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        if event.get("httpMethod") == "POST":
            body = json.loads(event.get("body") or "{}")
            return handle_send(body, conn)
        else:
            params = event.get("queryStringParameters") or {}
            return handle_poll(params, conn)
    finally:
        conn.close()