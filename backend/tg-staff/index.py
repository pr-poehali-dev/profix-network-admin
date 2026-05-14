"""
Staff Hub: чат, задачи, фиксики, график, контакты, файлы.
Telegram webhook + Admin API.
"""
import json, os, base64, uuid
from urllib.request import urlopen, Request as UReq
from datetime import datetime, timezone

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

def get_conn():
    import psycopg2
    return psycopg2.connect(os.environ["DATABASE_URL"])

def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {"statusCode": code, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps({"error": msg}, ensure_ascii=False)}

def send_tg(chat_id, text, parse_mode="HTML"):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token or not chat_id:
        return None
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
    data = json.dumps(payload).encode()
    req = UReq(url, data=data, headers={"Content-Type": "application/json"})
    try:
        resp = urlopen(req, timeout=8)
        return json.loads(resp.read()).get("result", {}).get("message_id")
    except Exception:
        return None

def send_tg_photo(chat_id, photo_url, caption=""):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token or not chat_id:
        return None
    url = f"https://api.telegram.org/bot{token}/sendPhoto"
    payload = {"chat_id": chat_id, "photo": photo_url, "caption": caption}
    data = json.dumps(payload).encode()
    req = UReq(url, data=data, headers={"Content-Type": "application/json"})
    try:
        urlopen(req, timeout=8)
    except Exception:
        pass

def upload_file(b64_data, filename, content_type):
    """Загружает файл в S3, возвращает CDN URL."""
    import boto3
    raw = base64.b64decode(b64_data)
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    key = f"staff-chat/{uuid.uuid4()}.{ext}"
    s3 = boto3.client("s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"])
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

def verify_manager(event, conn):
    headers = event.get("headers") or {}
    # Платформа проксирует Authorization → X-Authorization
    auth = (headers.get("X-Authorization") or headers.get("Authorization")
            or headers.get("authorization") or "")
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(f"""
        SELECT ms.manager_id, m.role, COALESCE(m.name, m.full_name)
        FROM {SC}.manager_sessions ms JOIN {SC}.managers m ON m.id=ms.manager_id
        WHERE ms.token=%s AND ms.expires_at>NOW()
    """, (token,))
    row = cur.fetchone()
    cur.close()
    return row  # (id, role, name)

def fixie_add(cur, tech_id, amount, reason, task_id=None, manager_id=None):
    cur.execute(f"""
        INSERT INTO {SC}.fixie_transactions (tech_id, amount, reason, task_id, created_by)
        VALUES (%s, %s, %s, %s, %s)
    """, (tech_id, amount, reason, task_id, manager_id))
    cur.execute(f"UPDATE {SC}.technicians SET fixies_balance = fixies_balance + %s WHERE id=%s",
                (amount, tech_id))

def handler(event: dict, context) -> dict:
    """Staff Hub: chat, tasks, fixies, schedule, contacts."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")
    body_raw = event.get("body") or "{}"

    # ── WEBHOOK ───────────────────────────────────────────────────────────────
    if action == "webhook":
        body = json.loads(body_raw)
        message = body.get("message", {})
        if not message:
            return ok({"ok": True})
        chat_id   = message.get("chat", {}).get("id")
        text      = (message.get("text") or "").strip()
        tg_msg_id = message.get("message_id")
        from_user = message.get("from", {})
        tg_user_id = from_user.get("id")
        first_name = from_user.get("first_name", "")
        username   = from_user.get("username", "")

        conn = get_conn(); cur = conn.cursor()

        if text.startswith("/start"):
            parts = text.split(" ", 1)
            token_param = parts[1].strip() if len(parts) > 1 else ""
            if token_param:
                cur.execute(f"""
                    SELECT ts.technician_id, t.name FROM {SC}.technician_sessions ts
                    JOIN {SC}.technicians t ON t.id=ts.technician_id
                    WHERE ts.token=%s AND ts.expires_at>NOW() ORDER BY ts.created_at DESC LIMIT 1
                """, (token_param,))
                row = cur.fetchone()
                if row:
                    tech_id, tech_name = row
                    cur.execute(f"UPDATE {SC}.technicians SET tg_chat_id=%s,tg_username=%s WHERE id=%s",
                                (tg_user_id, username, tech_id))
                    conn.commit()
                    send_tg(chat_id, f"✅ <b>Telegram привязан!</b>\nПривет, {tech_name}! Менеджеры смогут ставить задачи прямо сюда.")
                else:
                    send_tg(chat_id, "⚠️ Ссылка устарела. Войдите в портал и нажмите «Привязать Telegram» снова.")
            else:
                send_tg(chat_id, f"👋 Привет{', ' + first_name if first_name else ''}!\nЯ бот ProFiX. Войдите в портал специалиста и нажмите «Привязать Telegram».")
            cur.close(); conn.close()
            return ok({"ok": True})

        # Обычное сообщение от специалиста → сохраняем
        cur.execute(f"SELECT id, name FROM {SC}.technicians WHERE tg_chat_id=%s", (tg_user_id,))
        tech = cur.fetchone()
        if tech:
            tech_id, _ = tech
            cur.execute(f"""
                INSERT INTO {SC}.tg_staff_messages (tech_id,tg_chat_id,from_role,text,tg_message_id)
                VALUES (%s,%s,'tech',%s,%s)
            """, (tech_id, chat_id, text, tg_msg_id))
            conn.commit()
        cur.close(); conn.close()
        return ok({"ok": True})

    # ── ADMIN API ─────────────────────────────────────────────────────────────
    conn = get_conn()
    mgr = verify_manager(event, conn)
    if not mgr:
        conn.close()
        return err("Необходима авторизация", 401)
    mgr_id, mgr_role, mgr_name = mgr
    cur = conn.cursor()
    body = json.loads(body_raw)

    # ─── ЧАТ ──────────────────────────────────────────────────────────────────
    if method == "GET" and action == "list":
        cur.execute(f"""
            SELECT t.id, t.name, t.phone, t.tg_chat_id, t.tg_username, t.is_active,
                   t.fixies_balance,
                   (SELECT text FROM {SC}.tg_staff_messages WHERE tech_id=t.id ORDER BY created_at DESC LIMIT 1) last_text,
                   (SELECT created_at FROM {SC}.tg_staff_messages WHERE tech_id=t.id ORDER BY created_at DESC LIMIT 1) last_at,
                   (SELECT COUNT(*) FROM {SC}.tg_staff_messages WHERE tech_id=t.id AND from_role='tech' AND read_at IS NULL) unread,
                   (SELECT COUNT(*) FROM {SC}.staff_tasks WHERE assigned_to=t.id AND status NOT IN ('done','cancelled')) open_tasks,
                   (SELECT COUNT(*) FROM {SC}.staff_tasks WHERE assigned_to=t.id AND status NOT IN ('done','cancelled') AND due_at < NOW()) overdue
            FROM {SC}.technicians t ORDER BY t.name
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"techs": rows})

    if method == "GET" and action == "history":
        tech_id  = int(params.get("tech_id", 0))
        after_id = int(params.get("after_id", 0))
        cur.execute(f"""
            SELECT id,from_role,text,tg_message_id,read_at,created_at,file_url,file_type,file_name
            FROM {SC}.tg_staff_messages WHERE tech_id=%s AND id>%s ORDER BY created_at ASC LIMIT 100
        """, (tech_id, after_id))
        msgs = [{"id":r[0],"from_role":r[1],"text":r[2],"tg_message_id":r[3],
                 "read":r[4] is not None,"created_at":r[5].isoformat(),
                 "file_url":r[6],"file_type":r[7],"file_name":r[8]} for r in cur.fetchall()]
        cur.execute(f"""UPDATE {SC}.tg_staff_messages SET read_at=NOW()
                        WHERE tech_id=%s AND from_role='tech' AND read_at IS NULL""", (tech_id,))
        conn.commit(); cur.close(); conn.close()
        return ok({"messages": msgs})

    if method == "POST" and action == "send":
        tech_id  = int(body.get("tech_id", 0))
        text     = body.get("text", "").strip()
        file_b64 = body.get("file_b64")
        file_name= body.get("file_name", "file")
        file_type_mime = body.get("file_mime", "application/octet-stream")
        if not tech_id:
            cur.close(); conn.close(); return err("Нужен tech_id")
        cur.execute(f"SELECT tg_chat_id FROM {SC}.technicians WHERE id=%s", (tech_id,))
        tech = cur.fetchone()
        if not tech or not tech[0]:
            cur.close(); conn.close(); return err("Telegram не привязан")
        tg_chat_id = tech[0]
        file_url = None; file_kind = None
        if file_b64:
            file_url = upload_file(file_b64, file_name, file_type_mime)
            file_kind = "image" if file_type_mime.startswith("image/") else "file"
            if file_kind == "image":
                send_tg_photo(tg_chat_id, file_url, text or "")
            else:
                send_tg(tg_chat_id, f"📎 <b>{file_name}</b>\n{file_url}\n{text or ''}")
            tg_msg_id = None
        else:
            tg_msg_id = send_tg(tg_chat_id, f"💬 <b>ProFiX</b>: {text}")
        cur.execute(f"""
            INSERT INTO {SC}.tg_staff_messages
            (tech_id,tg_chat_id,from_role,text,tg_message_id,read_at,file_url,file_type,file_name)
            VALUES (%s,%s,'manager',%s,%s,NOW(),%s,%s,%s)
        """, (tech_id, tg_chat_id, text, tg_msg_id, file_url, file_kind, file_name if file_b64 else None))
        conn.commit(); cur.close(); conn.close()
        return ok({"sent": True})

    if action == "unread_count":
        cur.execute(f"SELECT COUNT(*) FROM {SC}.tg_staff_messages WHERE from_role='tech' AND read_at IS NULL")
        count = cur.fetchone()[0]; cur.close(); conn.close()
        return ok({"unread": count})

    if method == "POST" and action == "get_link":
        tech_id = int(body.get("tech_id", 0))
        cur.execute(f"""SELECT token FROM {SC}.technician_sessions
                        WHERE technician_id=%s AND expires_at>NOW()
                        ORDER BY created_at DESC LIMIT 1""", (tech_id,))
        row = cur.fetchone(); cur.close(); conn.close()
        if not row:
            return err("Нет активной сессии. Пусть специалист войдёт в портал.")
        bot_name = os.environ.get("TELEGRAM_BOT_NAME", "ProFixBot")
        return ok({"link": f"https://t.me/{bot_name}?start={row[0]}"})

    # ─── ГРУППОВОЙ ЧАТ ───────────────────────────────────────────────────────
    if method == "POST" and action == "group_send":
        text       = body.get("text", "").strip()
        file_b64   = body.get("file_b64")
        file_name  = body.get("file_name", "file")
        file_type_mime = body.get("file_mime", "application/octet-stream")
        group_id   = os.environ.get("TELEGRAM_CHAT_ID", "")
        if not group_id:
            cur.close(); conn.close(); return err("TELEGRAM_CHAT_ID не задан")
        group_id_int = int(group_id)
        file_url = None; file_kind = None
        if file_b64:
            file_url = upload_file(file_b64, file_name, file_type_mime)
            file_kind = "image" if file_type_mime.startswith("image/") else "file"
            if file_kind == "image":
                send_tg_photo(group_id_int, file_url, f"📢 {mgr_name}: {text or ''}")
            else:
                send_tg(group_id_int, f"📢 <b>{mgr_name}</b>: 📎 {file_name}\n{file_url}\n{text or ''}")
        else:
            send_tg(group_id_int, f"📢 <b>{mgr_name}</b>: {text}")
        # Сохраняем как tech_id=NULL (групповое)
        cur.execute(f"""
            INSERT INTO {SC}.tg_staff_messages
            (tech_id, tg_chat_id, from_role, text, read_at, file_url, file_type, file_name)
            VALUES (NULL, %s, 'manager', %s, NOW(), %s, %s, %s)
        """, (group_id_int, text, file_url, file_kind, file_name if file_b64 else None))
        conn.commit(); cur.close(); conn.close()
        return ok({"sent": True})

    if method == "GET" and action == "group_history":
        group_id = os.environ.get("TELEGRAM_CHAT_ID", "")
        if not group_id:
            cur.close(); conn.close(); return ok({"messages": []})
        after_id = int(params.get("after_id", 0))
        cur.execute(f"""
            SELECT id, from_role, text, created_at, file_url, file_type, file_name
            FROM {SC}.tg_staff_messages
            WHERE tg_chat_id = %s AND tech_id IS NULL AND id > %s
            ORDER BY created_at ASC LIMIT 100
        """, (int(group_id), after_id))
        msgs = [{"id":r[0],"from_role":r[1],"text":r[2],"created_at":r[3].isoformat(),
                 "file_url":r[4],"file_type":r[5],"file_name":r[6]} for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"messages": msgs})

    # ─── ЗАДАЧИ ───────────────────────────────────────────────────────────────
    if method == "GET" and action == "tasks":
        tech_id  = params.get("tech_id")
        status   = params.get("status")  # open|done|overdue|all
        where_parts = []
        args = []
        if tech_id:
            where_parts.append("t.assigned_to=%s"); args.append(int(tech_id))
        if status == "overdue":
            where_parts.append("t.status NOT IN ('done','cancelled') AND t.due_at < NOW()")
        elif status and status != "all":
            where_parts.append("t.status=%s"); args.append(status)
        where = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""
        cur.execute(f"""
            SELECT t.id, t.title, t.description, t.status, t.priority,
                   t.due_at, t.done_at, t.fixies_reward, t.penalty_fixies,
                   t.close_comment, t.created_at, t.updated_at,
                   tech.name AS tech_name, tech.id AS tech_id, tech.tg_chat_id,
                   m.name AS manager_name
            FROM {SC}.staff_tasks t
            LEFT JOIN {SC}.technicians tech ON tech.id=t.assigned_to
            LEFT JOIN {SC}.managers m ON m.id=t.created_by
            {where}
            ORDER BY CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                     t.due_at ASC NULLS LAST, t.created_at DESC
            LIMIT 200
        """, args)
        cols = [d[0] for d in cur.description]
        tasks = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"tasks": tasks})

    if method == "POST" and action == "task_create":
        title       = body.get("title", "").strip()
        description = body.get("description", "")
        assigned_to = int(body.get("assigned_to", 0))
        due_at      = body.get("due_at")
        priority    = body.get("priority", "normal")
        reward      = int(body.get("fixies_reward", 10))
        if not title or not assigned_to:
            cur.close(); conn.close(); return err("Нужен title и assigned_to")
        cur.execute(f"""
            INSERT INTO {SC}.staff_tasks
            (title,description,assigned_to,created_by,due_at,priority,fixies_reward,status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,'open') RETURNING id
        """, (title, description, assigned_to, mgr_id, due_at or None, priority, reward))
        task_id = cur.fetchone()[0]
        conn.commit()
        # Уведомление в Telegram
        cur.execute(f"SELECT tg_chat_id, name FROM {SC}.technicians WHERE id=%s", (assigned_to,))
        tech = cur.fetchone()
        if tech and tech[0]:
            due_str = f"\n⏰ Срок: {due_at}" if due_at else ""
            send_tg(tech[0],
                f"📋 <b>Новая задача от {mgr_name}</b>\n\n"
                f"<b>{title}</b>\n{description or ''}{due_str}\n"
                f"💰 Награда: {reward} фиксиков")
        cur.close(); conn.close()
        return ok({"id": task_id, "created": True})

    if method == "POST" and action == "task_update":
        task_id  = int(body.get("task_id", 0))
        new_status  = body.get("status")
        new_due_at  = body.get("due_at")
        comment     = body.get("comment", "")
        log_action  = body.get("log_action", "comment")  # extend|penalty|close
        penalty_amt = int(body.get("penalty", 0))
        if not task_id:
            cur.close(); conn.close(); return err("Нужен task_id")

        cur.execute(f"SELECT assigned_to, title, fixies_reward, status FROM {SC}.staff_tasks WHERE id=%s", (task_id,))
        task = cur.fetchone()
        if not task:
            cur.close(); conn.close(); return err("Задача не найдена", 404)
        tech_id, task_title, reward, old_status = task

        updates = ["updated_at=NOW()"]
        uargs = []
        if new_status:
            updates.append("status=%s"); uargs.append(new_status)
            if new_status == "done":
                updates.append("done_at=NOW()")
        if new_due_at:
            updates.append("due_at=%s"); uargs.append(new_due_at)
        if penalty_amt:
            updates.append("penalty_fixies=penalty_fixies+%s"); uargs.append(penalty_amt)
        if comment and new_status in ("done", "cancelled"):
            updates.append("close_comment=%s"); uargs.append(comment)
        cur.execute(f"UPDATE {SC}.staff_tasks SET {', '.join(updates)} WHERE id=%s", uargs + [task_id])

        # Лог
        cur.execute(f"""
            INSERT INTO {SC}.staff_task_logs (task_id,author_role,author_id,text,action,new_due_at)
            VALUES (%s,'manager',%s,%s,%s,%s)
        """, (task_id, mgr_id, comment or log_action, log_action, new_due_at or None))

        # Фиксики
        cur.execute(f"SELECT tg_chat_id FROM {SC}.technicians WHERE id=%s", (tech_id,))
        tg_row = cur.fetchone()
        tg_cid = tg_row[0] if tg_row else None

        if new_status == "done" and old_status != "done" and reward > 0:
            fixie_add(cur, tech_id, reward, f"Задача #{task_id}: {task_title}", task_id, mgr_id)
            if tg_cid:
                send_tg(tg_cid, f"✅ <b>Задача закрыта!</b>\n«{task_title}»\n💰 +{reward} фиксиков на ваш счёт!")
        elif penalty_amt > 0:
            fixie_add(cur, tech_id, -penalty_amt, f"Штраф по задаче #{task_id}", task_id, mgr_id)
            if tg_cid:
                send_tg(tg_cid, f"⚠️ <b>Штраф по задаче</b>\n«{task_title}»\n💸 -{penalty_amt} фиксиков\n{comment or ''}")
        elif new_due_at and tg_cid:
            send_tg(tg_cid, f"🔄 <b>Срок задачи продлён</b>\n«{task_title}»\nНовый срок: {new_due_at[:10]}\n{comment or ''}")
        elif new_status == "cancelled" and tg_cid:
            send_tg(tg_cid, f"❌ <b>Задача отменена</b>\n«{task_title}»\n{comment or ''}")

        conn.commit(); cur.close(); conn.close()
        return ok({"updated": True})

    if method == "GET" and action == "task_logs":
        task_id = int(params.get("task_id", 0))
        cur.execute(f"""
            SELECT l.id, l.author_role, l.author_id, l.text, l.action, l.new_due_at, l.created_at,
                   CASE WHEN l.author_role='manager' THEN m.name ELSE t.name END AS author_name
            FROM {SC}.staff_task_logs l
            LEFT JOIN {SC}.managers m ON l.author_role='manager' AND m.id=l.author_id
            LEFT JOIN {SC}.technicians t ON l.author_role='tech' AND t.id=l.author_id
            WHERE l.task_id=%s ORDER BY l.created_at ASC
        """, (task_id,))
        cols = [d[0] for d in cur.description]
        logs = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"logs": logs})

    # ─── ФИКСИКИ ──────────────────────────────────────────────────────────────
    if method == "GET" and action == "fixies":
        cur.execute(f"""
            SELECT t.id, t.name, t.fixies_balance, t.is_active
            FROM {SC}.technicians t ORDER BY t.fixies_balance DESC
        """)
        techs = [{"id":r[0],"name":r[1],"balance":r[2],"is_active":r[3]} for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"techs": techs})

    if method == "GET" and action == "fixies_history":
        tech_id = int(params.get("tech_id", 0))
        cur.execute(f"""
            SELECT ft.id, ft.amount, ft.reason, ft.task_id, ft.created_at, m.name AS manager
            FROM {SC}.fixie_transactions ft
            LEFT JOIN {SC}.managers m ON m.id=ft.created_by
            WHERE ft.tech_id=%s ORDER BY ft.created_at DESC LIMIT 100
        """, (tech_id,))
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"transactions": rows})

    if method == "POST" and action == "fixies_add":
        tech_id = int(body.get("tech_id", 0))
        amount  = int(body.get("amount", 0))
        reason  = body.get("reason", "").strip()
        if not tech_id or not amount or not reason:
            cur.close(); conn.close(); return err("Нужен tech_id, amount, reason")
        fixie_add(cur, tech_id, amount, reason, None, mgr_id)
        cur.execute(f"SELECT tg_chat_id, name FROM {SC}.technicians WHERE id=%s", (tech_id,))
        tech = cur.fetchone()
        if tech and tech[0]:
            sign = "+" if amount > 0 else ""
            send_tg(tech[0], f"💰 <b>{sign}{amount} фиксиков</b>\nПричина: {reason}")
        conn.commit(); cur.close(); conn.close()
        return ok({"added": True})

    # ─── СТАТИСТИКА ───────────────────────────────────────────────────────────
    if method == "GET" and action == "stats":
        cur.execute(f"""
            SELECT
                (SELECT COUNT(*) FROM {SC}.staff_tasks WHERE status='open') tasks_open,
                (SELECT COUNT(*) FROM {SC}.staff_tasks WHERE status='done' AND done_at > NOW()-INTERVAL '30 days') tasks_done_30d,
                (SELECT COUNT(*) FROM {SC}.staff_tasks WHERE status NOT IN ('done','cancelled') AND due_at < NOW()) tasks_overdue,
                (SELECT SUM(fixies_balance) FROM {SC}.technicians WHERE is_active=TRUE) total_fixies,
                (SELECT COUNT(*) FROM {SC}.tg_staff_messages WHERE from_role='tech' AND read_at IS NULL) unread_msgs
        """)
        r = cur.fetchone()
        # Топ по задачам
        cur.execute(f"""
            SELECT t.name, t.fixies_balance,
                   COUNT(CASE WHEN st.status='done' AND st.done_at > NOW()-INTERVAL '30 days' THEN 1 END) done_30d,
                   COUNT(CASE WHEN st.status NOT IN ('done','cancelled') AND st.due_at < NOW() THEN 1 END) overdue
            FROM {SC}.technicians t
            LEFT JOIN {SC}.staff_tasks st ON st.assigned_to=t.id
            WHERE t.is_active=TRUE
            GROUP BY t.id, t.name, t.fixies_balance
            ORDER BY done_30d DESC, t.name
        """)
        tech_stats = [{"name":tr[0],"balance":tr[1],"done_30d":tr[2],"overdue":tr[3]} for tr in cur.fetchall()]
        cur.close(); conn.close()
        return ok({
            "tasks_open": r[0], "tasks_done_30d": r[1],
            "tasks_overdue": r[2], "total_fixies": r[3], "unread_msgs": r[4],
            "tech_stats": tech_stats,
        })

    # ─── ГРАФИК ───────────────────────────────────────────────────────────────
    if method == "GET" and action == "schedule":
        year  = int(params.get("year",  datetime.now().year))
        month = int(params.get("month", datetime.now().month))
        cur.execute(f"""
            SELECT s.tech_id, t.name, s.date, s.type, s.note
            FROM {SC}.staff_schedule s
            JOIN {SC}.technicians t ON t.id=s.tech_id
            WHERE EXTRACT(YEAR FROM s.date)=%s AND EXTRACT(MONTH FROM s.date)=%s
            ORDER BY t.name, s.date
        """, (year, month))
        rows = [{"tech_id":r[0],"name":r[1],"date":str(r[2]),"type":r[3],"note":r[4]}
                for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"schedule": rows})

    if method == "POST" and action == "schedule_set":
        tech_id = int(body.get("tech_id", 0))
        date    = body.get("date", "")
        stype   = body.get("type", "work")
        note    = body.get("note", "")
        if not tech_id or not date:
            cur.close(); conn.close(); return err("Нужен tech_id и date")
        cur.execute(f"""
            INSERT INTO {SC}.staff_schedule (tech_id, date, type, note, created_by)
            VALUES (%s,%s,%s,%s,%s)
            ON CONFLICT (tech_id, date) DO UPDATE SET type=%s, note=%s, created_by=%s
        """, (tech_id, date, stype, note, mgr_id, stype, note, mgr_id))
        conn.commit(); cur.close(); conn.close()
        return ok({"ok": True})

    # ─── КОНТАКТЫ ─────────────────────────────────────────────────────────────
    if method == "GET" and action == "contacts":
        cur.execute(f"""
            SELECT t.id, t.name, t.phone, t.tg_chat_id, t.tg_username, t.is_active, t.fixies_balance,
                   c.department, c.position, c.email, c.tg_username AS c_tg, c.vk_url, c.notes, c.sort_order
            FROM {SC}.technicians t
            LEFT JOIN {SC}.staff_contacts c ON c.tech_id=t.id
            ORDER BY COALESCE(c.sort_order, 999), t.name
        """)
        cols = [d[0] for d in cur.description]
        rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        cur.close(); conn.close()
        return ok({"contacts": rows})

    if method == "POST" and action == "contact_save":
        tech_id    = int(body.get("tech_id", 0))
        department = body.get("department", "")
        position   = body.get("position", "")
        email      = body.get("email", "")
        tg_username= body.get("tg_username", "")
        vk_url     = body.get("vk_url", "")
        notes      = body.get("notes", "")
        sort_order = int(body.get("sort_order", 0))
        if not tech_id:
            cur.close(); conn.close(); return err("Нужен tech_id")
        cur.execute(f"""
            INSERT INTO {SC}.staff_contacts (tech_id,department,position,email,tg_username,vk_url,notes,sort_order,updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,NOW())
            ON CONFLICT (tech_id) DO UPDATE SET
              department=%s,position=%s,email=%s,tg_username=%s,vk_url=%s,notes=%s,sort_order=%s,updated_at=NOW()
        """, (tech_id,department,position,email,tg_username,vk_url,notes,sort_order,
              department,position,email,tg_username,vk_url,notes,sort_order))
        conn.commit(); cur.close(); conn.close()
        return ok({"saved": True})

    cur.close(); conn.close()
    return err(f"Unknown action: {action}", 404)