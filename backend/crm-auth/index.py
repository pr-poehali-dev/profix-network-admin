"""
CRM авторизация: клиенты (телефон + OTP на email/Telegram) и менеджеры (логин/пароль).
"""
import json
import os
import secrets
import hashlib
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from urllib.request import urlopen, Request
import psycopg2


CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization, Authorization",
}

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data: dict):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def err(msg: str, code: int = 400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg}, ensure_ascii=False)}


def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def send_email_otp(to_email: str, code: str, phone: str):
    host = os.environ["SMTP_HOST"]
    port = int(os.environ["SMTP_PORT"])
    user = os.environ["SMTP_USER"]
    pwd = os.environ["SMTP_PASSWORD"]

    msg = MIMEText(
        f"<h2>Ваш код для входа в кабинет ProFiX</h2>"
        f"<p>Номер телефона: <b>{phone}</b></p>"
        f"<p>Код подтверждения: <b style='font-size:28px;letter-spacing:4px'>{code}</b></p>"
        f"<p>Код действует 10 минут.</p>",
        "html", "utf-8"
    )
    msg["Subject"] = f"Код входа ProFiX: {code}"
    msg["From"] = user
    msg["To"] = to_email

    if port == 465:
        with smtplib.SMTP_SSL(host, port) as s:
            s.login(user, pwd)
            s.sendmail(user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(host, port) as s:
            s.starttls()
            s.login(user, pwd)
            s.sendmail(user, to_email, msg.as_string())


def send_telegram_otp(chat_id: int, code: str):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    text = (f"🔑 <b>Код входа в кабинет ProFiX</b>\n\n"
            f"Ваш код: <b>{code}</b>\n\n"
            f"Код действует 10 минут.")
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
    req = Request(url, data=data, headers={"Content-Type": "application/json"})
    urlopen(req, timeout=5)


def handler(event: dict, context) -> dict:
    """Авторизация клиентов и менеджеров CRM ProFiX."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # ── ПЕРВИЧНАЯ НАСТРОЙКА / СБРОС ПАРОЛЯ ADMIN ─────────────────────────────
    if action == "setup_admin":
        conn2 = get_conn()
        cur2 = conn2.cursor()
        login = body.get("login", "admin")
        password = body.get("password", "profix2024")
        pw_hash = hash_password(password)
        safe_login = login.replace("'", "")
        cur2.execute(f"UPDATE {SC}.managers SET password_hash = '{pw_hash}', role = 'admin' WHERE login = '{safe_login}' OR username = '{safe_login}'")
        updated = cur2.rowcount
        conn2.commit()
        cur2.close()
        conn2.close()
        return ok({"message": f"Пароль обновлён для {updated} менеджеров", "login": safe_login, "password": password})

    # ── КЛИЕНТ: запрос OTP ──────────────────────────────────────────────────
    if action == "client_request_otp":
        phone = body.get("phone", "").strip()
        channel = body.get("channel", "email")
        email = body.get("email", "").strip()

        if not phone:
            return err("Укажите номер телефона")

        conn = get_conn()
        cur = conn.cursor()

        cur.execute(f"SELECT id, email, telegram_id FROM {SC}.clients WHERE phone = %s", (phone,))
        row = cur.fetchone()

        if not row:
            if channel == "email" and not email:
                conn.close()
                return err("Для нового клиента укажите email")
            cur.execute(
                f"INSERT INTO {SC}.clients (phone, email) VALUES (%s, %s) RETURNING id, email, telegram_id",
                (phone, email or None)
            )
            row = cur.fetchone()
            conn.commit()

        client_id, client_email, tg_chat_id = row

        if channel == "email":
            if not client_email and not email:
                conn.close()
                return err("Email не привязан к аккаунту. Укажите email.")
            send_to_email = email or client_email
            if email and not client_email:
                cur.execute(f"UPDATE {SC}.clients SET email = %s WHERE id = %s", (email, client_id))
                conn.commit()
        else:
            if not tg_chat_id:
                conn.close()
                return err("Telegram не привязан. Перейдите в кабинет и нажмите «Привязать Telegram».")

        code = str(secrets.randbelow(900000) + 100000)
        expires = datetime.now() + timedelta(minutes=10)

        cur.execute(
            f"INSERT INTO {SC}.client_otp (phone, code, channel, expires_at) VALUES (%s, %s, %s, %s)",
            (phone, code, channel, expires)
        )
        conn.commit()
        cur.close()
        conn.close()

        if channel == "email":
            try:
                send_email_otp(send_to_email, code, phone)
            except Exception as e:
                return err(f"Ошибка отправки письма: {str(e)}")
        else:
            send_telegram_otp(tg_chat_id, code)

        return ok({"sent": True, "channel": channel})

    # ── КЛИЕНТ: подтверждение OTP ───────────────────────────────────────────
    if action == "client_verify_otp":
        phone = body.get("phone", "").strip()
        code = body.get("code", "").strip()

        if not phone or not code:
            return err("Укажите телефон и код")

        conn = get_conn()
        cur = conn.cursor()

        cur.execute(
            f"""SELECT id FROM {SC}.client_otp
               WHERE phone=%s AND code=%s AND used=FALSE AND expires_at > NOW()
               ORDER BY created_at DESC LIMIT 1""",
            (phone, code)
        )
        otp_row = cur.fetchone()
        if not otp_row:
            conn.close()
            return err("Неверный или истёкший код")

        cur.execute(f"UPDATE {SC}.client_otp SET used=TRUE WHERE id=%s", (otp_row[0],))

        cur.execute(f"SELECT id, name, phone, email FROM {SC}.clients WHERE phone=%s", (phone,))
        client = cur.fetchone()

        token = make_token()
        expires = datetime.now() + timedelta(days=30)
        cur.execute(
            f"INSERT INTO {SC}.client_sessions (client_id, token, expires_at) VALUES (%s, %s, %s)",
            (client[0], token, expires)
        )
        conn.commit()
        cur.close()
        conn.close()

        return ok({
            "token": token,
            "client": {"id": client[0], "name": client[1], "phone": client[2], "email": client[3]}
        })

    # ── МЕНЕДЖЕР: вход ──────────────────────────────────────────────────────
    if action == "manager_login":
        login = body.get("login", "").strip()
        password = body.get("password", "").strip()

        if not login or not password:
            return err("Укажите логин и пароль")

        conn = get_conn()
        cur = conn.cursor()

        pw_hash = hash_password(password)
        cur.execute(
            f"SELECT id, COALESCE(name, full_name), role FROM {SC}.managers WHERE (login=%s OR username=%s) AND password_hash=%s",
            (login, login, pw_hash)
        )
        mgr = cur.fetchone()
        if not mgr:
            conn.close()
            return err("Неверный логин или пароль", 401)

        token = make_token()
        expires = datetime.now() + timedelta(days=7)
        cur.execute(
            f"INSERT INTO {SC}.manager_sessions (manager_id, token, expires_at) VALUES (%s, %s, %s)",
            (mgr[0], token, expires)
        )
        conn.commit()
        cur.close()
        conn.close()

        return ok({
            "token": token,
            "manager": {"id": mgr[0], "name": mgr[1], "role": mgr[2]}
        })

    # ── МЕНЕДЖЕР: создание (только admin) ───────────────────────────────────
    if action == "manager_create":
        auth = (event.get("headers") or {}).get("X-Authorization", "")
        token = auth.replace("Bearer ", "").strip()

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"""SELECT m.role FROM {SC}.manager_sessions ms
               JOIN {SC}.managers m ON m.id = ms.manager_id
               WHERE ms.token=%s AND ms.expires_at > NOW()""",
            (token,)
        )
        session = cur.fetchone()
        if not session or session[0] != "admin":
            conn.close()
            return err("Доступ запрещён", 403)

        login = body.get("login", "").strip()
        password = body.get("password", "").strip()
        name = body.get("name", "").strip()
        role = body.get("role", "manager")

        if not login or not password or not name:
            conn.close()
            return err("Заполните все поля")

        cur.execute(
            f"INSERT INTO {SC}.managers (username, login, password_hash, full_name, name, role) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (login, login, hash_password(password), name, name, role)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return ok({"id": new_id, "login": login, "name": name, "role": role})

    # ── ТЕХНИК: вход по ID + PIN ─────────────────────────────────────────────
    if action == "technician_login":
        tech_id = body.get("technician_id")
        pin = body.get("pin", "").strip()

        if not tech_id or not pin:
            return err("Укажите ID специалиста и PIN")

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, phone, specialization FROM {SC}.technicians WHERE id=%s AND pin_code=%s AND is_active=TRUE",
            (int(tech_id), pin)
        )
        tech = cur.fetchone()
        if not tech:
            conn.close()
            return err("Неверный PIN или специалист не найден", 401)

        token = make_token()
        expires = datetime.now() + timedelta(days=30)
        cur.execute(
            f"INSERT INTO {SC}.technician_sessions (technician_id, token, expires_at) VALUES (%s, %s, %s)",
            (tech[0], token, expires)
        )
        conn.commit()
        cur.close()
        conn.close()
        return ok({
            "token": token,
            "technician": {"id": tech[0], "name": tech[1], "phone": tech[2], "specialization": tech[3]}
        })

    # ── ТЕХНИК: список для выбора при входе ──────────────────────────────────
    if action == "technicians_list":
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"SELECT id, name, specialization FROM {SC}.technicians WHERE is_active=TRUE ORDER BY name")
        techs = [{"id": r[0], "name": r[1], "specialization": r[2]} for r in cur.fetchall()]
        cur.close()
        conn.close()
        return ok({"technicians": techs})

    # ── ПРОВЕРКА ТОКЕНА ─────────────────────────────────────────────────────
    if action == "verify_token":
        auth = (event.get("headers") or {}).get("X-Authorization", "")
        if not auth:
            auth = (event.get("headers") or {}).get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        role = body.get("role", "client")

        conn = get_conn()
        cur = conn.cursor()

        if role == "client":
            cur.execute(
                f"""SELECT c.id, c.name, c.phone, c.email FROM {SC}.client_sessions cs
                   JOIN {SC}.clients c ON c.id = cs.client_id
                   WHERE cs.token=%s AND cs.expires_at > NOW()""",
                (token,)
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return err("Сессия истекла", 401)
            return ok({"valid": True, "client": {"id": row[0], "name": row[1], "phone": row[2], "email": row[3]}})
        elif role == "technician":
            cur.execute(
                f"""SELECT t.id, t.name, t.phone, t.specialization FROM {SC}.technician_sessions ts
                   JOIN {SC}.technicians t ON t.id = ts.technician_id
                   WHERE ts.token=%s AND ts.expires_at > NOW()""",
                (token,)
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return err("Сессия истекла", 401)
            return ok({"valid": True, "technician": {"id": row[0], "name": row[1], "phone": row[2], "specialization": row[3]}})
        else:
            cur.execute(
                f"""SELECT m.id, COALESCE(m.name, m.full_name), m.role FROM {SC}.manager_sessions ms
                   JOIN {SC}.managers m ON m.id = ms.manager_id
                   WHERE ms.token=%s AND ms.expires_at > NOW()""",
                (token,)
            )
            row = cur.fetchone()
            conn.close()
            if not row:
                return err("Сессия истекла", 401)
            return ok({"valid": True, "manager": {"id": row[0], "name": row[1], "role": row[2]}})

    # ── КЛИЕНТ: обновление профиля ───────────────────────────────────────────
    if action == "client_update_profile":
        auth = (event.get("headers") or {}).get("X-Authorization", "") or \
               (event.get("headers") or {}).get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        if not token:
            return err("Необходима авторизация", 401)

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT client_id FROM {SC}.client_sessions WHERE token=%s AND expires_at > NOW()",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Сессия истекла", 401)
        client_id = row[0]

        name = body.get("name", "").strip()
        telegram_id = body.get("telegram_id")

        sets, vals = [], []
        if name:
            sets.append("name = %s"); vals.append(name)
        if telegram_id is not None:
            sets.append("telegram_id = %s"); vals.append(int(telegram_id) if telegram_id else None)
        sets.append("updated_at = NOW()")
        vals.append(client_id)

        if len(sets) > 1:
            cur.execute(f"UPDATE {SC}.clients SET {', '.join(sets)} WHERE id = %s", vals)
            conn.commit()

        cur.execute(f"SELECT id, name, phone, email FROM {SC}.clients WHERE id = %s", (client_id,))
        c = cur.fetchone()
        cur.close(); conn.close()
        return ok({"client": {"id": c[0], "name": c[1], "phone": c[2], "email": c[3]}})

    return err("Неизвестное действие")