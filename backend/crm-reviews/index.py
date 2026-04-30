"""
Отзывы клиентов: создание, публикация, список для сайта.
"""
import json
import os
import psycopg2

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
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


def get_client_id(event, conn):
    headers = event.get("headers") or {}
    auth = headers.get("X-Authorization", "") or headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT client_id FROM {SC}.client_sessions WHERE token=%s AND expires_at > NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None


def get_manager_role(event, conn):
    headers = event.get("headers") or {}
    auth = headers.get("X-Authorization", "") or headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"""SELECT m.role FROM {SC}.manager_sessions ms
            JOIN {SC}.managers m ON m.id = ms.manager_id
            WHERE ms.token=%s AND ms.expires_at > NOW()""",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row[0] if row else None


def handler(event: dict, context) -> dict:
    """API отзывов: создание клиентом, публикация менеджером, список для сайта."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}
    action = body.get("action") or params.get("action", "")

    conn = get_conn()

    # ── Список опубликованных отзывов (публичный) ────────────────────────────
    if method == "GET" and action == "list":
        cur = conn.cursor()
        cur.execute(
            f"""SELECT r.id, r.client_name, r.rating, r.text, r.created_at,
                       t.title as service
                FROM {SC}.reviews r
                LEFT JOIN {SC}.tickets t ON t.id = r.ticket_id
                WHERE r.published = TRUE
                ORDER BY r.created_at DESC
                LIMIT 20"""
        )
        reviews = [
            {"id": r[0], "name": r[1] or "Клиент", "rating": r[2],
             "text": r[3], "created_at": r[4].isoformat() if r[4] else None,
             "service": r[5]}
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return ok({"reviews": reviews})

    # ── Создать отзыв (клиент) ───────────────────────────────────────────────
    if method == "POST" and action == "create":
        client_id = get_client_id(event, conn)
        if not client_id:
            conn.close()
            return err("Необходима авторизация", 401)

        rating = body.get("rating")
        text = body.get("text", "").strip()
        ticket_id = body.get("ticket_id")

        if not rating or int(rating) < 1 or int(rating) > 5:
            conn.close()
            return err("Оценка от 1 до 5")
        if not text:
            conn.close()
            return err("Напишите текст отзыва")

        cur = conn.cursor()
        cur.execute(f"SELECT name, phone FROM {SC}.clients WHERE id=%s", (client_id,))
        client = cur.fetchone()
        client_name = (client[0] or client[1]) if client else None

        # Проверяем что заявка принадлежит клиенту
        if ticket_id:
            cur.execute(
                f"SELECT id FROM {SC}.tickets WHERE id=%s AND client_id=%s AND status='done'",
                (ticket_id, client_id)
            )
            if not cur.fetchone():
                ticket_id = None

        # Проверяем что уже не оставлял отзыв по этой заявке
        if ticket_id:
            cur.execute(f"SELECT id FROM {SC}.reviews WHERE ticket_id=%s AND client_id=%s", (ticket_id, client_id))
            if cur.fetchone():
                conn.close()
                return err("Вы уже оставили отзыв по этой заявке")

        cur.execute(
            f"""INSERT INTO {SC}.reviews (client_id, ticket_id, client_name, rating, text, published)
                VALUES (%s, %s, %s, %s, %s, FALSE) RETURNING id""",
            (client_id, ticket_id, client_name, int(rating), text)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return ok({"id": new_id, "created": True})

    # ── Список всех отзывов для менеджера ────────────────────────────────────
    if method == "GET" and action == "all":
        role = get_manager_role(event, conn)
        if not role:
            conn.close()
            return err("Необходима авторизация", 401)
        cur = conn.cursor()
        cur.execute(
            f"""SELECT r.id, r.client_name, r.rating, r.text, r.published, r.created_at,
                       t.title as service, r.client_id
                FROM {SC}.reviews r
                LEFT JOIN {SC}.tickets t ON t.id = r.ticket_id
                ORDER BY r.created_at DESC"""
        )
        reviews = [
            {"id": r[0], "name": r[1] or "Клиент", "rating": r[2], "text": r[3],
             "published": r[4], "created_at": r[5].isoformat() if r[5] else None,
             "service": r[6], "client_id": r[7]}
            for r in cur.fetchall()
        ]
        cur.close()
        conn.close()
        return ok({"reviews": reviews})

    # ── Опубликовать / скрыть отзыв (менеджер) ───────────────────────────────
    if method == "PUT" and action == "publish":
        role = get_manager_role(event, conn)
        if not role:
            conn.close()
            return err("Необходима авторизация", 401)
        review_id = body.get("id")
        published = body.get("published", True)
        cur = conn.cursor()
        cur.execute(f"UPDATE {SC}.reviews SET published=%s WHERE id=%s", (published, review_id))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"updated": True})

    # ── Удалить отзыв (менеджер) ───────────────────────────���──────────────────
    if method == "DELETE" and action == "delete":
        role = get_manager_role(event, conn)
        if not role:
            conn.close()
            return err("Необходима авторизация", 401)
        review_id = body.get("id")
        if not review_id:
            conn.close()
            return err("Не указан id отзыва")
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SC}.reviews WHERE id=%s", (review_id,))
        conn.commit()
        cur.close()
        conn.close()
        return ok({"deleted": True})

    conn.close()
    return err("Неизвестное действие")