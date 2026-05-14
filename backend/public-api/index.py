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
            "version": "1.0",
            "description": "API для интеграции партнёров с CRM ProFiX",
            "endpoints": [
                {"method": "GET", "path": "?action=ping", "description": "Проверка доступности API"},
                {"method": "POST", "path": "?action=ticket.create", "description": "Создать заявку", "auth": True},
                {"method": "GET", "path": "?action=ticket.status&id=<id>", "description": "Статус заявки", "auth": True},
                {"method": "GET", "path": "?action=tickets.list", "description": "Список заявок партнёра", "auth": True},
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

    return err(f"Неизвестное действие: {action}. Смотрите документацию по URL без параметров.", 404)
