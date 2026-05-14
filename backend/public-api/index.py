"""
Публичный API для партнёров ProFiX: создание заявок, проверка статусов, управление API-ключами.
"""
import json
import os
import secrets
import psycopg2
from datetime import datetime

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg, "code": code}, ensure_ascii=False)}


def get_api_key(event: dict):
    headers = event.get("headers") or {}
    key = headers.get("X-API-Key") or headers.get("x-api-key") or ""
    if not key:
        qs = event.get("queryStringParameters") or {}
        key = qs.get("api_key", "")
    return key.strip()


def verify_api_key(key: str):
    """Возвращает (api_key_id, permissions) или None."""
    if not key:
        return None
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, permissions FROM {SC}.api_keys WHERE key=%s AND active=TRUE",
        (key,)
    )
    row = cur.fetchone()
    if row:
        cur.execute(f"UPDATE {SC}.api_keys SET last_used_at=NOW() WHERE id=%s", (row[0],))
        conn.commit()
    cur.close()
    conn.close()
    return row


def handler(event: dict, context) -> dict:
    """Публичный API для интеграции партнёров с ProFiX CRM."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "")

    # ── Документация (без ключа) ─────────────────────────────────────────────
    if method == "GET" and not action:
        return ok({
            "name": "ProFiX Public API",
            "version": "1.1",
            "description": "API для интеграции партнёров с CRM ProFiX",
            "endpoints": [
                {"method": "GET",  "path": "?action=ping",                         "description": "Проверка доступности API"},
                {"method": "GET",  "path": "?action=shop.categories",               "description": "Список категорий товаров", "auth": True},
                {"method": "GET",  "path": "?action=shop.products",                 "description": "Список товаров (с фильтрами)", "auth": True},
                {"method": "GET",  "path": "?action=shop.product&id=<id>",          "description": "Товар с изображениями", "auth": True},
                {"method": "POST", "path": "?action=ticket.create",                 "description": "Создать заявку", "auth": True},
                {"method": "GET",  "path": "?action=ticket.status&id=<id>",         "description": "Статус заявки", "auth": True},
                {"method": "GET",  "path": "?action=tickets.list",                  "description": "Список заявок партнёра", "auth": True},
            ],
            "auth": "Передайте ключ в заголовке X-API-Key или параметре ?api_key=",
            "contact": "727187@it-profix.ru",
        })

    # ── Ping ─────────────────────────────────────────────────────────────────
    if action == "ping":
        return ok({"pong": True, "ts": datetime.now().isoformat()})

    # ── Все остальные действия требуют ключа ─────────────────────────────────
    api_key_str = get_api_key(event)
    key_row = verify_api_key(api_key_str)
    if not key_row:
        return err("Неверный или отсутствующий API-ключ. Передайте ключ в заголовке X-API-Key.", 401)

    key_id, permissions = key_row
    perms = permissions if isinstance(permissions, list) else json.loads(permissions or "[]")

    # ── Создать заявку ───────────────────────────────────────────────────────
    if action == "ticket.create" and method == "POST":
        if "tickets:create" not in perms:
            return err("Недостаточно прав: tickets:create", 403)

        body = json.loads(event.get("body") or "{}")
        title = body.get("title", "").strip()
        description = body.get("description", "").strip()
        client_name = body.get("client_name", "").strip()
        client_phone = body.get("client_phone", "").strip()
        priority = body.get("priority", "medium")

        if not title or not client_phone:
            return err("Обязательные поля: title, client_phone")
        if priority not in ("low", "medium", "high", "critical"):
            priority = "medium"

        conn = get_conn()
        cur = conn.cursor()

        # Найдём или создадим клиента
        cur.execute(f"SELECT id FROM {SC}.clients WHERE phone=%s", (client_phone,))
        client = cur.fetchone()
        if not client:
            cur.execute(
                f"INSERT INTO {SC}.clients (name, phone) VALUES (%s, %s) RETURNING id",
                (client_name or "Партнёрская заявка", client_phone)
            )
            client = cur.fetchone()
        client_id = client[0]

        cur.execute(
            f"""INSERT INTO {SC}.tickets (client_id, title, description, priority, status, source)
                VALUES (%s, %s, %s, %s, 'new', 'api') RETURNING id, created_at""",
            (client_id, title, description or title, priority)
        )
        ticket = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return ok({
            "ok": True,
            "ticket_id": ticket[0],
            "created_at": str(ticket[1]),
            "status": "new",
        })

    # ── Статус заявки ─────────────────────────────────────────────────────────
    if action == "ticket.status" and method == "GET":
        if "tickets:read" not in perms:
            return err("Недостаточно прав: tickets:read", 403)

        ticket_id = qs.get("id")
        if not ticket_id:
            return err("Укажите ?id=<ticket_id>")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, title, status, priority, created_at, updated_at FROM {SC}.tickets WHERE id=%s",
            (ticket_id,)
        )
        t = cur.fetchone()
        cur.close()
        conn.close()

        if not t:
            return err("Заявка не найдена", 404)

        return ok({
            "id": t[0], "title": t[1], "status": t[2],
            "priority": t[3], "created_at": str(t[4]), "updated_at": str(t[5]),
        })

    # ── Список заявок ─────────────────────────────────────────────────────────
    if action == "tickets.list" and method == "GET":
        if "tickets:read" not in perms:
            return err("Недостаточно прав: tickets:read", 403)

        limit = min(int(qs.get("limit", 20)), 100)
        offset = int(qs.get("offset", 0))
        status = qs.get("status")

        conn = get_conn()
        cur = conn.cursor()
        where = f"WHERE source='api'" + (f" AND status='{status}'" if status else "")
        cur.execute(
            f"SELECT id, title, status, priority, created_at FROM {SC}.tickets {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (limit, offset)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return ok({
            "tickets": [{"id": r[0], "title": r[1], "status": r[2], "priority": r[3], "created_at": str(r[4])} for r in rows],
            "limit": limit,
            "offset": offset,
        })

    # ── Каталог: категории ────────────────────────────────────────────────────
    if action == "shop.categories" and method == "GET":
        if "shop:read" not in perms:
            return err("Недостаточно прав: shop:read", 403)
        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.name, c.slug, c.description, c.sort_order,
                   COUNT(p.id) FILTER (WHERE p.is_active) AS product_count
            FROM {SC}.shop_categories c
            LEFT JOIN {SC}.shop_products p ON p.category_id = c.id
            GROUP BY c.id ORDER BY c.sort_order, c.name
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"categories": rows, "total": len(rows)})

    # ── Каталог: список товаров ───────────────────────────────────────────────
    if action == "shop.products" and method == "GET":
        if "shop:read" not in perms:
            return err("Недостаточно прав: shop:read", 403)

        category = qs.get("category")       # slug категории
        search   = qs.get("search", "")
        in_stock = qs.get("in_stock")       # "1" — только в наличии
        limit    = min(int(qs.get("limit", 100)), 500)
        offset   = int(qs.get("offset", 0))

        conn = get_conn(); cur = conn.cursor()
        where = ["p.is_active = TRUE"]
        args = []
        if category:
            where.append("c.slug = %s"); args.append(category)
        if search:
            where.append("(p.name ILIKE %s OR p.description ILIKE %s OR p.sku ILIKE %s)")
            args += [f"%{search}%", f"%{search}%", f"%{search}%"]
        if in_stock == "1":
            where.append("p.in_stock = TRUE")

        where_sql = "WHERE " + " AND ".join(where)
        cur.execute(f"""
            SELECT p.id, p.name, p.description, p.price, p.price_old, p.sku,
                   p.in_stock, p.image_url, p.sort_order, p.created_at, p.updated_at,
                   c.id AS category_id, c.name AS category_name, c.slug AS category_slug
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
        cur.close(); conn.close()

        return ok({"products": products, "total": total, "limit": limit, "offset": offset})

    # ── Каталог: один товар с изображениями ──────────────────────────────────
    if action == "shop.product" and method == "GET":
        if "shop:read" not in perms:
            return err("Недостаточно прав: shop:read", 403)

        pid = qs.get("id")
        if not pid:
            return err("Укажите ?id=<product_id>")

        conn = get_conn(); cur = conn.cursor()
        cur.execute(f"""
            SELECT p.id, p.name, p.description, p.price, p.price_old, p.sku,
                   p.in_stock, p.image_url, p.sort_order, p.created_at, p.updated_at,
                   c.id AS category_id, c.name AS category_name, c.slug AS category_slug
            FROM {SC}.shop_products p
            LEFT JOIN {SC}.shop_categories c ON c.id = p.category_id
            WHERE p.id = %s AND p.is_active = TRUE
        """, (pid,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err("Товар не найден", 404)

        cols = [d[0] for d in cur.description]
        product = dict(zip(cols, row))

        cur.execute(f"""
            SELECT image_url, sort_order FROM {SC}.shop_product_images
            WHERE product_id = %s ORDER BY sort_order
        """, (pid,))
        product["images"] = [{"image_url": r[0], "sort_order": r[1]} for r in cur.fetchall()]

        cur.execute(f"""
            SELECT AVG(rating)::numeric(3,1), COUNT(*)
            FROM {SC}.shop_product_reviews WHERE product_id = %s AND is_published = TRUE
        """, (pid,))
        avg = cur.fetchone()
        product["rating_avg"]   = float(avg[0]) if avg[0] else None
        product["rating_count"] = avg[1]
        cur.close(); conn.close()

        return ok({"product": product})

    return err(f"Неизвестное действие: {action}. Смотрите документацию по URL без параметров.", 404)