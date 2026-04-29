"""
Управление контентом сайта: тексты, слайды карусели, услуги, контакты.
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg}, ensure_ascii=False)}


def upload_image(b64: str, content_type: str = "image/jpeg") -> str:
    s3 = boto3.client("s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    key = f"content/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket="files", Key=key, Body=base64.b64decode(b64), ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor()

    def check_auth():
        token = (event.get("headers") or {}).get("X-Authorization", "")
        if not token:
            return False
        cur.execute(f"SELECT id FROM {SC}.manager_sessions WHERE token = %s AND expires_at > NOW()", (token,))
        return cur.fetchone() is not None

    try:
        # GET — отдаём весь контент как словарь {key: value}
        if method == "GET":
            cur.execute(f"SELECT key, value FROM {SC}.site_content ORDER BY key")
            return ok({"content": {row[0]: row[1] for row in cur.fetchall()}})

        # POST — сохраняем пачку изменений {key: value, ...}
        if method == "POST":
            if not check_auth():
                return err("Unauthorized", 401)

            # Загрузка картинки
            if body.get("action") == "upload_image":
                url = upload_image(body["image_b64"], body.get("image_type", "image/jpeg"))
                return ok({"ok": True, "url": url})

            # Сохранение контента
            updates = body.get("updates", {})
            if not updates:
                return err("Нет данных для сохранения")

            for key, value in updates.items():
                val = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)
                cur.execute(
                    f"INSERT INTO {SC}.site_content (key, value, updated_at) VALUES (%s, %s, NOW()) "
                    f"ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()",
                    (key, val)
                )
            conn.commit()
            return ok({"ok": True, "saved": len(updates)})

        return err("Method not allowed", 405)

    finally:
        cur.close()
        conn.close()
