"""
Интернет-магазин ProFiX: товары, категории, загрузка фото, импорт Excel, оформление заказа.
"""
import json
import os
import base64
import csv
import io
import psycopg2
import boto3
import uuid
from datetime import datetime

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


def ensure_tables(conn):
    cur = conn.cursor()
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SC}.shop_categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            slug VARCHAR(200) NOT NULL UNIQUE,
            description TEXT,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SC}.shop_products (
            id SERIAL PRIMARY KEY,
            category_id INT REFERENCES {SC}.shop_categories(id) ON DELETE SET NULL,
            name VARCHAR(500) NOT NULL,
            description TEXT,
            price NUMERIC(12,2),
            price_old NUMERIC(12,2),
            sku VARCHAR(200),
            in_stock BOOLEAN DEFAULT TRUE,
            is_active BOOLEAN DEFAULT TRUE,
            image_url TEXT,
            sort_order INT DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)
    conn.commit()
    cur.close()


def upload_image(b64data: str, content_type: str = "image/jpeg") -> str:
    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    key = f"shop/{uuid.uuid4()}.{ext}"
    data = base64.b64decode(b64data)
    s3.put_object(Bucket="files", Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def slugify(text: str) -> str:
    tr = str.maketrans("абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
                       "abvgdeyozhziyklmnoprstufhcchshschyeyuyaabvgdeyozhziyklmnoprstufhcchshschyeyuya")
    s = text.lower().translate(tr)
    result = ""
    for c in s:
        if c.isalnum():
            result += c
        elif result and result[-1] != "-":
            result += "-"
    return result.strip("-") or "category"


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            pass

    # Роутинг через query ?type= или path
    resource = params.get("type", "")
    if not resource:
        if "/categories" in path:
            resource = "categories"
        elif "/order" in path:
            resource = "order"
        elif "/images" in path:
            resource = "images"
        elif "/reviews" in path:
            resource = "reviews"
        else:
            resource = "products"

    conn = get_conn()
    ensure_tables(conn)
    cur = conn.cursor()

    # ── Авторизация для защищённых методов ───────────────────────────────────
    def check_auth():
        token = (event.get("headers") or {}).get("X-Authorization", "")
        if not token:
            return False
        cur.execute(f"SELECT id FROM {SC}.manager_sessions WHERE token = %s AND expires_at > NOW()", (token,))
        return cur.fetchone() is not None

    try:
        # ══════════════════════════════════════════════════════════════════════
        # КАТЕГОРИИ
        # ══════════════════════════════════════════════════════════════════════
        if resource == "categories":

            if method == "GET":
                cur.execute(f"""
                    SELECT c.id, c.name, c.slug, c.description, c.sort_order,
                           COUNT(p.id) FILTER (WHERE p.is_active) as product_count
                    FROM {SC}.shop_categories c
                    LEFT JOIN {SC}.shop_products p ON p.category_id = c.id
                    GROUP BY c.id ORDER BY c.sort_order, c.name
                """)
                cols = [d[0] for d in cur.description]
                return ok({"categories": [dict(zip(cols, r)) for r in cur.fetchall()]})

            if method == "POST":
                if not check_auth():
                    return err("Unauthorized", 401)
                name = body.get("name", "").strip()
                if not name:
                    return err("Укажите название")
                slug = body.get("slug") or slugify(name)
                # Проверка уникальности slug
                cur.execute(f"SELECT id FROM {SC}.shop_categories WHERE slug = %s", (slug,))
                if cur.fetchone():
                    slug = f"{slug}-{uuid.uuid4().hex[:4]}"
                cur.execute(
                    f"INSERT INTO {SC}.shop_categories (name, slug, description, sort_order) VALUES (%s,%s,%s,%s) RETURNING id",
                    (name, slug, body.get("description", ""), body.get("sort_order", 0))
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"ok": True, "id": new_id})

            if method == "PUT":
                if not check_auth():
                    return err("Unauthorized", 401)
                cid = body.get("id")
                if not cid:
                    return err("Нет id")
                cur.execute(
                    f"UPDATE {SC}.shop_categories SET name=%s, description=%s, sort_order=%s WHERE id=%s",
                    (body.get("name"), body.get("description", ""), body.get("sort_order", 0), cid)
                )
                conn.commit()
                return ok({"ok": True})

            if method == "DELETE":
                if not check_auth():
                    return err("Unauthorized", 401)
                cid = body.get("id") or params.get("id")
                cur.execute(f"UPDATE {SC}.shop_products SET category_id = NULL WHERE category_id = %s", (cid,))
                cur.execute(f"DELETE FROM {SC}.shop_categories WHERE id = %s", (cid,))
                conn.commit()
                return ok({"ok": True})

        # ══════════════════════════════════════════════════════════════════════
        # ТОВАРЫ
        # ══════════════════════════════════════════════════════════════════════
        if resource == "products":

            if method == "GET":
                pid = params.get("id")
                if pid:
                    cur.execute(f"""
                        SELECT p.*, c.name as category_name, c.slug as category_slug
                        FROM {SC}.shop_products p
                        LEFT JOIN {SC}.shop_categories c ON c.id = p.category_id
                        WHERE p.id = %s
                    """, (pid,))
                    row = cur.fetchone()
                    if not row:
                        return err("Товар не найден", 404)
                    cols = [d[0] for d in cur.description]
                    product = dict(zip(cols, row))
                    # Доп. фото
                    cur.execute(f"SELECT id, image_url, sort_order FROM {SC}.shop_product_images WHERE product_id = %s ORDER BY sort_order", (pid,))
                    product["images"] = [{"id": r[0], "image_url": r[1], "sort_order": r[2]} for r in cur.fetchall()]
                    # Опубликованные отзывы
                    cur.execute(f"""
                        SELECT id, author_name, rating, text, created_at
                        FROM {SC}.shop_product_reviews WHERE product_id = %s AND is_published = TRUE
                        ORDER BY created_at DESC
                    """, (pid,))
                    rcols = [d[0] for d in cur.description]
                    product["reviews"] = [dict(zip(rcols, r)) for r in cur.fetchall()]
                    # Средний рейтинг
                    cur.execute(f"SELECT AVG(rating), COUNT(*) FROM {SC}.shop_product_reviews WHERE product_id = %s AND is_published = TRUE", (pid,))
                    avg_row = cur.fetchone()
                    product["rating_avg"] = round(float(avg_row[0]), 1) if avg_row[0] else None
                    product["rating_count"] = avg_row[1]
                    return ok({"product": product})

                # Список
                category = params.get("category")
                search = params.get("search", "")
                in_stock = params.get("in_stock")
                admin_mode = params.get("admin") == "1"
                limit = int(params.get("limit", 100))
                offset = int(params.get("offset", 0))

                where = [] if admin_mode else ["p.is_active = TRUE"]
                args = []
                if category:
                    where.append("c.slug = %s")
                    args.append(category)
                if search:
                    where.append("(p.name ILIKE %s OR p.description ILIKE %s OR p.sku ILIKE %s)")
                    args += [f"%{search}%", f"%{search}%", f"%{search}%"]
                if in_stock == "1":
                    where.append("p.in_stock = TRUE")

                where_sql = ("WHERE " + " AND ".join(where)) if where else ""
                cur.execute(f"""
                    SELECT p.*, c.name as category_name, c.slug as category_slug
                    FROM {SC}.shop_products p
                    LEFT JOIN {SC}.shop_categories c ON c.id = p.category_id
                    {where_sql}
                    ORDER BY p.sort_order, p.name
                    LIMIT %s OFFSET %s
                """, args + [limit, offset])
                cols = [d[0] for d in cur.description]
                products = [dict(zip(cols, r)) for r in cur.fetchall()]

                cur.execute(f"""
                    SELECT COUNT(*) FROM {SC}.shop_products p
                    LEFT JOIN {SC}.shop_categories c ON c.id = p.category_id
                    {where_sql}
                """, args)
                total = cur.fetchone()[0]

                return ok({"products": products, "total": total})

            if method == "POST":
                if not check_auth():
                    return err("Unauthorized", 401)

                # Импорт из Excel/CSV
                if body.get("action") == "import_csv":
                    csv_b64 = body.get("csv_data", "")
                    csv_text = base64.b64decode(csv_b64).decode("utf-8-sig")
                    reader = csv.DictReader(io.StringIO(csv_text), delimiter=";")
                    imported = 0
                    for row in reader:
                        name = (row.get("name") or row.get("название") or row.get("Название") or "").strip()
                        if not name:
                            continue
                        cat_name = (row.get("category") or row.get("категория") or row.get("Категория") or "").strip()
                        cat_id = None
                        if cat_name:
                            cur.execute(f"SELECT id FROM {SC}.shop_categories WHERE name ILIKE %s LIMIT 1", (cat_name,))
                            cat_row = cur.fetchone()
                            if cat_row:
                                cat_id = cat_row[0]
                        price_str = (row.get("price") or row.get("цена") or row.get("Цена") or "").replace(",", ".").replace(" ", "").replace("₽","")
                        try:
                            price = float(price_str) if price_str else None
                        except Exception:
                            price = None
                        price_old_str = (row.get("price_old") or row.get("цена_старая") or "").replace(",", ".").replace(" ", "")
                        try:
                            price_old = float(price_old_str) if price_old_str else None
                        except Exception:
                            price_old = None
                        sku = (row.get("sku") or row.get("артикул") or row.get("Артикул") or "").strip()
                        desc = (row.get("description") or row.get("описание") or row.get("Описание") or "").strip()
                        in_stock = (row.get("in_stock") or row.get("в_наличии") or "1").strip() not in ("0", "нет", "no", "false")
                        cur.execute(f"""
                            INSERT INTO {SC}.shop_products (category_id, name, description, price, price_old, sku, in_stock)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (cat_id, name, desc, price, price_old, sku or None, in_stock))
                        imported += 1
                    conn.commit()
                    return ok({"ok": True, "imported": imported})

                # Создание товара
                name = body.get("name", "").strip()
                if not name:
                    return err("Укажите название")

                image_url = None
                if body.get("image_b64"):
                    image_url = upload_image(body["image_b64"], body.get("image_type", "image/jpeg"))

                cur.execute(f"""
                    INSERT INTO {SC}.shop_products
                        (category_id, name, description, price, price_old, sku, in_stock, is_active, image_url, sort_order)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id
                """, (
                    body.get("category_id") or None,
                    name,
                    body.get("description", ""),
                    body.get("price") or None,
                    body.get("price_old") or None,
                    body.get("sku") or None,
                    body.get("in_stock", True),
                    body.get("is_active", True),
                    image_url,
                    body.get("sort_order", 0),
                ))
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"ok": True, "id": new_id})

            if method == "PUT":
                if not check_auth():
                    return err("Unauthorized", 401)
                pid = body.get("id")
                if not pid:
                    return err("Нет id")

                image_url = body.get("image_url")
                if body.get("image_b64"):
                    image_url = upload_image(body["image_b64"], body.get("image_type", "image/jpeg"))

                cur.execute(f"""
                    UPDATE {SC}.shop_products SET
                        category_id=%s, name=%s, description=%s, price=%s, price_old=%s,
                        sku=%s, in_stock=%s, is_active=%s, image_url=%s, sort_order=%s,
                        updated_at=NOW()
                    WHERE id=%s
                """, (
                    body.get("category_id") or None,
                    body.get("name"),
                    body.get("description", ""),
                    body.get("price") or None,
                    body.get("price_old") or None,
                    body.get("sku") or None,
                    body.get("in_stock", True),
                    body.get("is_active", True),
                    image_url,
                    body.get("sort_order", 0),
                    pid,
                ))
                conn.commit()
                return ok({"ok": True})

            if method == "DELETE":
                if not check_auth():
                    return err("Unauthorized", 401)
                pid = body.get("id") or params.get("id")
                cur.execute(f"UPDATE {SC}.shop_products SET is_active = FALSE WHERE id = %s", (pid,))
                conn.commit()
                return ok({"ok": True})

        # ══════════════════════════════════════════════════════════════════════
        # ОФОРМЛЕНИЕ ЗАКАЗА
        # ══════════════════════════════════════════════════════════════════════
        if resource == "order" and method == "POST":
            name = body.get("name", "").strip()
            phone = body.get("phone", "").strip()
            items = body.get("items", [])
            if not name or not phone:
                return err("Укажите имя и телефон")
            if not items:
                return err("Корзина пуста")

            items_text = "\n".join([
                f"- {i.get('name')} x{i.get('qty',1)} = {i.get('price',0)*i.get('qty',1):,.0f} ₽"
                for i in items
            ])
            total = sum(i.get("price", 0) * i.get("qty", 1) for i in items)
            title = f"Заказ из магазина: {len(items)} поз. на {total:,.0f} ₽"
            description = f"Клиент: {name}\nТелефон: {phone}\n\nТовары:\n{items_text}"
            if body.get("comment"):
                description += f"\n\nКомментарий: {body['comment']}"

            # Найти или создать клиента
            client_id = None
            cur.execute(f"SELECT id FROM {SC}.clients WHERE phone = %s LIMIT 1", (phone,))
            cl = cur.fetchone()
            if cl:
                client_id = cl[0]
            else:
                cur.execute(
                    f"INSERT INTO {SC}.clients (name, phone) VALUES (%s, %s) RETURNING id",
                    (name, phone)
                )
                client_id = cur.fetchone()[0]

            cur.execute(f"""
                INSERT INTO {SC}.tickets (client_id, title, description, status, priority)
                VALUES (%s, %s, %s, 'new', 'normal') RETURNING id
            """, (client_id, title, description))
            ticket_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "ticket_id": ticket_id})

        # ══════════════════════════════════════════════════════════════════════
        # ДОПОЛНИТЕЛЬНЫЕ ФОТО
        # ══════════════════════════════════════════════════════════════════════
        if resource == "images":
            if not check_auth():
                return err("Unauthorized", 401)

            if method == "POST":
                pid = body.get("product_id")
                if not pid:
                    return err("Нет product_id")
                image_url = upload_image(body["image_b64"], body.get("image_type", "image/jpeg"))
                cur.execute(
                    f"INSERT INTO {SC}.shop_product_images (product_id, image_url, sort_order) VALUES (%s, %s, (SELECT COALESCE(MAX(sort_order),0)+1 FROM {SC}.shop_product_images WHERE product_id=%s)) RETURNING id",
                    (pid, image_url, pid)
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"ok": True, "id": new_id, "image_url": image_url})

            if method == "DELETE":
                iid = body.get("id") or params.get("id")
                cur.execute(f"DELETE FROM {SC}.shop_product_images WHERE id = %s", (iid,))
                conn.commit()
                return ok({"ok": True})

            if method == "GET":
                pid = params.get("product_id")
                cur.execute(f"SELECT id, image_url, sort_order FROM {SC}.shop_product_images WHERE product_id = %s ORDER BY sort_order", (pid,))
                return ok({"images": [{"id": r[0], "image_url": r[1], "sort_order": r[2]} for r in cur.fetchall()]})

        # ══════════════════════════════════════════════════════════════════════
        # ОТЗЫВЫ
        # ══════════════════════════════════════════════════════════════════════
        if resource == "reviews":

            if method == "GET":
                pid = params.get("product_id")
                admin_mode = params.get("admin") == "1"
                where = f"WHERE product_id = %s" + ("" if admin_mode else " AND is_published = TRUE")
                cur.execute(f"SELECT id, author_name, rating, text, is_published, created_at FROM {SC}.shop_product_reviews {where} ORDER BY created_at DESC", (pid,))
                cols = [d[0] for d in cur.description]
                return ok({"reviews": [dict(zip(cols, r)) for r in cur.fetchall()]})

            if method == "POST":
                # Публичный отзыв от покупателя
                pid = body.get("product_id")
                author = body.get("author_name", "").strip()
                rating = int(body.get("rating", 5))
                text = body.get("text", "").strip()
                if not pid or not author:
                    return err("Заполните имя и оценку")
                cur.execute(
                    f"INSERT INTO {SC}.shop_product_reviews (product_id, author_name, rating, text, is_published) VALUES (%s,%s,%s,%s, FALSE) RETURNING id",
                    (pid, author, rating, text)
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return ok({"ok": True, "id": new_id})

            if method == "PUT":
                # Менеджер публикует/скрывает отзыв
                if not check_auth():
                    return err("Unauthorized", 401)
                rid = body.get("id")
                cur.execute(f"UPDATE {SC}.shop_product_reviews SET is_published=%s WHERE id=%s", (body.get("is_published", True), rid))
                conn.commit()
                return ok({"ok": True})

            if method == "DELETE":
                if not check_auth():
                    return err("Unauthorized", 401)
                rid = body.get("id") or params.get("id")
                cur.execute(f"UPDATE {SC}.shop_product_reviews SET is_published = FALSE WHERE id = %s", (rid,))
                conn.commit()
                return ok({"ok": True})

        return err("Not found", 404)

    finally:
        cur.close()
        conn.close()