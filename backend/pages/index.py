"""
Конструктор страниц: создание, редактирование, публикация кастомных страниц сайта.
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
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    key = f"pages/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket="files", Key=key, Body=base64.b64decode(b64), ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def row_to_page(row, cols):
    page = dict(zip(cols, row))
    if isinstance(page.get("blocks"), str):
        try:
            page["blocks"] = json.loads(page["blocks"])
        except Exception:
            page["blocks"] = []
    return page


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
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
        # ── Загрузка картинки ─────────────────────────────────────────────────
        if body.get("action") == "upload_image":
            if not check_auth():
                return err("Unauthorized", 401)
            url = upload_image(body["image_b64"], body.get("image_type", "image/jpeg"))
            return ok({"ok": True, "url": url})

        # ── GET — список или одна страница ────────────────────────────────────
        if method == "GET":
            slug = params.get("slug")
            admin = params.get("admin") == "1"

            if slug:
                where = f"WHERE slug = %s" + ("" if admin else " AND is_published = TRUE")
                cur.execute(f"SELECT * FROM {SC}.custom_pages {where}", (slug,))
                row = cur.fetchone()
                if not row:
                    return err("Страница не найдена", 404)
                cols = [d[0] for d in cur.description]
                return ok({"page": row_to_page(row, cols)})

            # Список
            where = "" if admin else "WHERE is_published = TRUE"
            cur.execute(f"SELECT id, slug, title, meta_desc, accent_color, is_published, show_in_nav, nav_label, created_at, updated_at FROM {SC}.custom_pages {where} ORDER BY created_at DESC")
            cols = [d[0] for d in cur.description]
            return ok({"pages": [dict(zip(cols, r)) for r in cur.fetchall()]})

        # ── POST — создать страницу ───────────────────────────────────────────
        if method == "POST":
            if not check_auth():
                return err("Unauthorized", 401)
            title = body.get("title", "").strip()
            slug = body.get("slug", "").strip().lower().replace(" ", "-")
            if not title or not slug:
                return err("Укажите заголовок и slug")
            # Проверка уникальности
            cur.execute(f"SELECT id FROM {SC}.custom_pages WHERE slug = %s", (slug,))
            if cur.fetchone():
                return err(f"Slug '{slug}' уже занят")
            blocks = body.get("blocks", [])
            cur.execute(f"""
                INSERT INTO {SC}.custom_pages (slug, title, meta_desc, accent_color, blocks, is_published, show_in_nav, nav_label)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
            """, (
                slug, title,
                body.get("meta_desc", ""),
                body.get("accent_color", "#3ca615"),
                json.dumps(blocks, ensure_ascii=False),
                body.get("is_published", False),
                body.get("show_in_nav", False),
                body.get("nav_label", title),
            ))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "id": new_id, "slug": slug})

        # ── PUT — обновить страницу ───────────────────────────────────────────
        if method == "PUT":
            if not check_auth():
                return err("Unauthorized", 401)
            pid = body.get("id")
            if not pid:
                return err("Нет id")
            blocks = body.get("blocks", [])
            cur.execute(f"""
                UPDATE {SC}.custom_pages SET
                    title=%s, meta_desc=%s, accent_color=%s, blocks=%s,
                    is_published=%s, show_in_nav=%s, nav_label=%s, updated_at=NOW()
                WHERE id=%s
            """, (
                body.get("title"),
                body.get("meta_desc", ""),
                body.get("accent_color", "#3ca615"),
                json.dumps(blocks, ensure_ascii=False),
                body.get("is_published", False),
                body.get("show_in_nav", False),
                body.get("nav_label", body.get("title")),
                pid,
            ))
            conn.commit()
            return ok({"ok": True})

        # ── DELETE — удалить страницу ─────────────────────────────────────────
        if method == "DELETE":
            if not check_auth():
                return err("Unauthorized", 401)
            pid = body.get("id") or params.get("id")
            cur.execute(f"DELETE FROM {SC}.custom_pages WHERE id = %s", (pid,))
            conn.commit()
            return ok({"ok": True})

        return err("Not found", 404)

    finally:
        cur.close()
        conn.close()
