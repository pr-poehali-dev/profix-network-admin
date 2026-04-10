import json
import os
from urllib.request import urlopen, Request


def handler(event: dict, context) -> dict:
    """Отправляет вопрос из чата поддержки сайта ProFiX в Telegram."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    question = body.get("question", "").strip()

    if not question:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Пустой вопрос"}, ensure_ascii=False),
        }

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")

    if token and chat_id:
        text = f"💬 <b>Вопрос из чата сайта ProFiX</b>\n\n{question}"
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
        req = Request(url, data=data, headers={"Content-Type": "application/json"})
        urlopen(req, timeout=5)

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"ok": True}, ensure_ascii=False),
    }
