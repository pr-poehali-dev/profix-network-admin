"""
Первоначальная настройка CRM: создание admin-аккаунта.
"""
import json
import os
import hashlib
import psycopg2

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def handler(event: dict, context) -> dict:
    """Создаёт первого admin если его нет, возвращает список менеджеров."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = get_conn()
    cur = conn.cursor()

    sc = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

    cur.execute("SELECT id, login, name, role FROM " + sc + ".managers WHERE login = 'admin'")
    existing = cur.fetchone()

    if not existing:
        cur.execute(
            "INSERT INTO " + sc + ".managers (login, password_hash, name, role) VALUES (%s, %s, %s, %s) RETURNING id",
            ("admin", hash_password("profix2024"), "Администратор", "admin")
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        msg = f"Admin создан с id={new_id}"
    else:
        msg = f"Admin уже существует: id={existing[0]}, login={existing[1]}"

    cur.execute("SELECT id, login, name, role, created_at FROM " + sc + ".managers ORDER BY id")
    managers = [
        {"id": r[0], "login": r[1], "name": r[2], "role": r[3], "created_at": str(r[4])}
        for r in cur.fetchall()
    ]

    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"message": msg, "managers": managers}, ensure_ascii=False),
    }