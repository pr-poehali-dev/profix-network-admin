"""
Блог ProFiX: посты (новости/статьи/видео/форум), комментарии, лайки/дизлайки.
"""
import json
import os
import re
import psycopg2
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


def check_manager(event, conn):
    headers = event.get("headers") or {}
    auth = headers.get("X-Authorization", "") or headers.get("Authorization", "")
    token = auth.replace("Bearer ", "").strip()
    if not token:
        return None
    cur = conn.cursor()
    cur.execute(
        f"SELECT m.id, COALESCE(m.name, m.full_name), m.role FROM {SC}.manager_sessions ms "
        f"JOIN {SC}.managers m ON m.id = ms.manager_id WHERE ms.token=%s AND ms.expires_at>NOW()",
        (token,)
    )
    row = cur.fetchone()
    cur.close()
    return row  # (id, name, role) or None


def resolve_commenter(token, cur):
    """По токену определяет автора комментария.
    Проверяет: клиент → менеджер → техник.
    Возвращает (author_name, role_label) или None если не найден."""
    if not token:
        return None
    # Клиент
    cur.execute(
        f"SELECT c.name, c.phone FROM {SC}.client_sessions cs "
        f"JOIN {SC}.clients c ON c.id=cs.client_id "
        f"WHERE cs.token=%s AND cs.expires_at>NOW()",
        (token,)
    )
    row = cur.fetchone()
    if row:
        return (row[0] or row[1] or "Клиент", "client")
    # Менеджер / админ
    cur.execute(
        f"SELECT COALESCE(m.name, m.full_name), m.role FROM {SC}.manager_sessions ms "
        f"JOIN {SC}.managers m ON m.id=ms.manager_id WHERE ms.token=%s AND ms.expires_at>NOW()",
        (token,)
    )
    row = cur.fetchone()
    if row:
        label = "Менеджер" if row[1] == "manager" else "Администратор"
        return (row[0] or label, "manager")
    # Техник
    cur.execute(
        f"SELECT t.name FROM {SC}.technician_sessions ts "
        f"JOIN {SC}.technicians t ON t.id=ts.technician_id WHERE ts.token=%s AND ts.expires_at>NOW()",
        (token,)
    )
    row = cur.fetchone()
    if row:
        return (row[0] or "Специалист", "tech")
    return None


def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-zа-я0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text.strip())
    return text[:100] or "post"


def strip_html(text):
    """Убирает HTML-теги из строки."""
    if not text:
        return text
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = re.sub(r'\s+', ' ', clean).strip()
    return clean


def handler(event: dict, context) -> dict:
    """Блог: посты, комментарии, реакции (лайки/дизлайки)."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = json.loads(event.get("body") or "{}")
    resource = params.get("resource", "posts")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ══════════════════════════════════════════════════════════════════════
        # ПОСТЫ — публичное чтение
        # ══════════════════════════════════════════════════════════════════════
        if resource == "posts" and method == "GET":
            post_id = params.get("id")
            if post_id:
                # Один пост
                cur.execute(
                    f"UPDATE {SC}.posts SET views=views+1 WHERE id=%s", (post_id,)
                )
                cur.execute(
                    f"""SELECT id, type, title, slug, content, excerpt, cover_url,
                               video_url, author_name, tags, views, created_at, updated_at,
                               comments_mode
                        FROM {SC}.posts WHERE id=%s AND is_published=TRUE""",
                    (post_id,)
                )
                row = cur.fetchone()
                conn.commit()
                if not row:
                    return err("Пост не найден", 404)
                # Комментарии
                cur.execute(
                    f"SELECT id, author_name, text, created_at, edited_by, is_hidden, hidden_by "
                    f"FROM {SC}.post_comments "
                    f"WHERE post_id=%s AND is_approved=TRUE ORDER BY created_at ASC",
                    (post_id,)
                )
                comments = [{"id": c[0], "author_name": c[1],
                             "text": c[2] if not c[5] else "[Комментарий удалён модератором]",
                             "created_at": str(c[3]),
                             "edited_by": c[4],
                             "is_hidden": bool(c[5]),
                             "hidden_by": c[6]} for c in cur.fetchall()]
                # Реакции
                cur.execute(
                    f"SELECT reaction, COUNT(*) FROM {SC}.post_reactions WHERE post_id=%s GROUP BY reaction",
                    (post_id,)
                )
                reactions = {r[0]: r[1] for r in cur.fetchall()}
                post = {"id": row[0], "type": row[1], "title": row[2], "slug": row[3],
                        "content": row[4], "excerpt": row[5], "cover_url": row[6],
                        "video_url": row[7], "author_name": row[8], "tags": row[9],
                        "views": row[10],
                        "created_at": str(row[11]), "updated_at": str(row[12]),
                        "comments_mode": row[13] or "users",
                        "comments": comments, "reactions": reactions}
                return ok({"post": post})
            else:
                # Список постов
                post_type = params.get("type", "")
                limit = min(int(params.get("limit", 20)), 50)
                offset = int(params.get("offset", 0))
                where = "WHERE is_published=TRUE"
                vals = []
                if post_type:
                    where += " AND type=%s"; vals.append(post_type)
                cur.execute(
                    f"""SELECT id, type, title, slug, excerpt, cover_url, video_url,
                               author_name, tags, views, created_at
                        FROM {SC}.posts {where}
                        ORDER BY created_at DESC LIMIT %s OFFSET %s""",
                    vals + [limit, offset]
                )
                rows = cur.fetchall()
                # Кол-во комментов и реакций
                post_ids = [r[0] for r in rows]
                comment_counts = {}
                like_counts = {}
                if post_ids:
                    cur.execute(
                        f"SELECT post_id, COUNT(*) FROM {SC}.post_comments WHERE post_id=ANY(%s) AND is_approved=TRUE GROUP BY post_id",
                        (post_ids,)
                    )
                    comment_counts = {r[0]: r[1] for r in cur.fetchall()}
                    cur.execute(
                        f"SELECT post_id, reaction, COUNT(*) FROM {SC}.post_reactions WHERE post_id=ANY(%s) GROUP BY post_id, reaction",
                        (post_ids,)
                    )
                    for r in cur.fetchall():
                        if r[0] not in like_counts:
                            like_counts[r[0]] = {}
                        like_counts[r[0]][r[1]] = r[2]

                cur.execute(f"SELECT COUNT(*) FROM {SC}.posts {where}", vals)
                total = cur.fetchone()[0]
                posts = [{"id": r[0], "type": r[1], "title": r[2], "slug": r[3],
                          "excerpt": r[4], "cover_url": r[5], "video_url": r[6],
                          "author_name": r[7], "tags": r[8], "views": r[9],
                          "created_at": str(r[10]),
                          "comment_count": comment_counts.get(r[0], 0),
                          "reactions": like_counts.get(r[0], {})} for r in rows]
                return ok({"posts": posts, "total": total, "limit": limit, "offset": offset})

        # ══════════════════════════════════════════════════════════════════════
        # ПОСТЫ — создание/редактирование (менеджер)
        # ══════════════════════════════════════════════════════════════════════
        if resource == "posts" and method == "POST":
            mgr = check_manager(event, conn)
            if not mgr:
                return err("Необходима авторизация менеджера", 401)
            title = body.get("title", "").strip()
            if not title:
                return err("Укажите заголовок")
            slug = slugify(title)
            cur.execute(
                f"""INSERT INTO {SC}.posts
                    (type, title, slug, content, excerpt, cover_url, video_url,
                     author_id, author_name, tags, is_published, comments_mode)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (body.get("type", "news"), title, slug,
                 body.get("content", ""), strip_html(body.get("excerpt", "")),
                 body.get("cover_url", ""), body.get("video_url", ""),
                 mgr[0], mgr[1], body.get("tags", ""),
                 body.get("is_published", False),
                 body.get("comments_mode", "users"))
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"ok": True, "id": new_id, "slug": slug})

        if resource == "posts" and method == "PUT":
            mgr = check_manager(event, conn)
            if not mgr:
                return err("Необходима авторизация менеджера", 401)
            post_id = body.get("id")
            sets, vals = [], []
            for field in ["title", "content", "excerpt", "cover_url", "video_url",
                          "tags", "type", "is_published", "comments_mode"]:
                if field in body:
                    val = strip_html(body[field]) if field == "excerpt" else body[field]
                    sets.append(f"{field}=%s"); vals.append(val)
            sets.append("updated_at=NOW()")
            vals.append(post_id)
            cur.execute(f"UPDATE {SC}.posts SET {', '.join(sets)} WHERE id=%s", vals)
            conn.commit()
            return ok({"ok": True})

        if resource == "posts" and method == "DELETE":
            mgr = check_manager(event, conn)
            if not mgr or mgr[2] != "admin":
                return err("Доступ запрещён", 403)
            post_id = body.get("id") or params.get("id")
            cur.execute(f"UPDATE {SC}.posts SET is_published=FALSE WHERE id=%s", (post_id,))
            conn.commit()
            return ok({"ok": True})

        # ══════════════════════════════════════════════════════════════════════
        # КОММЕНТАРИИ — только авторизованные клиенты
        # ══════════════════════════════════════════════════════════════════════
        if resource == "comments" and method == "POST":
            post_id = body.get("post_id")
            text    = body.get("text", "").strip()
            if not post_id or not text:
                return err("Укажите пост и текст комментария")
            if len(text) > 2000:
                return err("Комментарий слишком длинный")

            # Проверяем режим комментариев поста
            cur.execute(
                f"SELECT comments_mode FROM {SC}.posts WHERE id=%s AND is_published=TRUE",
                (post_id,)
            )
            post_row = cur.fetchone()
            if not post_row:
                return err("Пост не найден", 404)
            comments_mode = post_row[0] or "users"

            if comments_mode == "closed":
                return err("Комментарии к этой публикации отключены", 403)

            headers  = event.get("headers") or {}
            auth_hdr = headers.get("X-Authorization", "") or headers.get("Authorization", "")
            token    = auth_hdr.replace("Bearer ", "").strip()

            client_id = None
            if comments_mode == "users":
                # Требуем авторизацию (клиент, менеджер или техник)
                if not token:
                    return err("Для комментирования необходимо войти в личный кабинет", 401)
                resolved = resolve_commenter(token, cur)
                if not resolved:
                    return err("Сессия истекла. Пожалуйста, войдите снова.", 401)
                author = resolved[0]
            else:
                # open — пробуем взять имя из токена, иначе берём из тела или "Гость"
                resolved = resolve_commenter(token, cur) if token else None
                if resolved:
                    author = resolved[0]
                else:
                    author = body.get("author_name", "").strip() or "Гость"

            cur.execute(
                f"""INSERT INTO {SC}.post_comments (post_id, client_id, author_name, text)
                    VALUES (%s,%s,%s,%s) RETURNING id, created_at""",
                (post_id, client_id, author, text)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({"ok": True, "comment": {
                "id": row[0], "author_name": author,
                "text": text, "created_at": str(row[1])
            }})

        # ══════════════════════════════════════════════════════════════════════
        # КОММЕНТАРИИ — редактирование своего
        # ══════════════════════════════════════════════════════════════════════
        if resource == "comments" and method == "PUT":
            headers  = event.get("headers") or {}
            auth_hdr = headers.get("X-Authorization", "") or headers.get("Authorization", "")
            token    = auth_hdr.replace("Bearer ", "").strip()
            if not token:
                return err("Необходима авторизация", 401)
            resolved = resolve_commenter(token, cur)
            if not resolved:
                return err("Сессия истекла", 401)
            actor_name, actor_role = resolved[0], resolved[1]
            is_moderator = actor_role == "manager"

            comment_id = body.get("id")
            new_text   = body.get("text", "").strip()
            if not comment_id or not new_text:
                return err("Укажите id и текст комментария")
            if len(new_text) > 2000:
                return err("Комментарий слишком длинный")

            if is_moderator:
                # Модератор может редактировать любой комментарий
                cur.execute(
                    f"UPDATE {SC}.post_comments SET text=%s, edited_by=%s WHERE id=%s AND is_approved=TRUE RETURNING id",
                    (new_text, actor_name, comment_id)
                )
            else:
                # Обычный пользователь — только свой
                cur.execute(
                    f"UPDATE {SC}.post_comments SET text=%s, edited_by=%s WHERE id=%s AND author_name=%s AND is_approved=TRUE RETURNING id",
                    (new_text, actor_name, comment_id, actor_name)
                )
            row = cur.fetchone()
            if not row:
                return err("Комментарий не найден или нет прав", 403)
            conn.commit()
            return ok({"ok": True, "edited_by": actor_name})

        # ══════════════════════════════════════════════════════════════════════
        # КОММЕНТАРИИ — скрытие (удаление)
        # ══════════════════════════════════════════════════════════════════════
        if resource == "comments" and method == "DELETE":
            headers  = event.get("headers") or {}
            auth_hdr = headers.get("X-Authorization", "") or headers.get("Authorization", "")
            token    = auth_hdr.replace("Bearer ", "").strip()
            if not token:
                return err("Необходима авторизация", 401)
            resolved = resolve_commenter(token, cur)
            if not resolved:
                return err("Сессия истекла", 401)
            actor_name, actor_role = resolved[0], resolved[1]
            is_moderator = actor_role == "manager"

            comment_id = body.get("id")
            if not comment_id:
                return err("Укажите id комментария")

            if is_moderator:
                cur.execute(
                    f"UPDATE {SC}.post_comments SET is_hidden=TRUE, hidden_by=%s WHERE id=%s AND is_approved=TRUE RETURNING id",
                    (actor_name, comment_id)
                )
            else:
                cur.execute(
                    f"UPDATE {SC}.post_comments SET is_hidden=TRUE, hidden_by=%s WHERE id=%s AND author_name=%s AND is_approved=TRUE RETURNING id",
                    (actor_name, comment_id, actor_name)
                )
            row = cur.fetchone()
            if not row:
                return err("Комментарий не найден или нет прав", 403)
            conn.commit()
            return ok({"ok": True})

        # ══════════════════════════════════════════════════════════════════════
        # РЕАКЦИИ (лайки/дизлайки)
        # ══════════════════════════════════════════════════════════════════════
        if resource == "reactions" and method == "POST":
            post_id    = body.get("post_id")
            comment_id = body.get("comment_id")
            session_id = body.get("session_id", "").strip()
            reaction   = body.get("reaction", "like")  # like | dislike
            if not session_id or reaction not in ("like", "dislike"):
                return err("Некорректные данные")

            if post_id:
                # Проверяем, есть ли уже реакция этой сессии
                cur.execute(
                    f"SELECT id, reaction FROM {SC}.post_reactions WHERE post_id=%s AND session_id=%s",
                    (post_id, session_id)
                )
                existing = cur.fetchone()
                if existing:
                    if existing[1] == reaction:
                        # Убираем реакцию (toggle)
                        cur.execute(f"UPDATE {SC}.post_reactions SET reaction=NULL WHERE id=%s", (existing[0],))
                        cur.execute(f"UPDATE {SC}.post_reactions SET reaction=%s WHERE id=%s AND reaction IS NOT NULL", (reaction, existing[0]))
                        # Просто удаляем запись
                        cur.execute(f"UPDATE {SC}.post_reactions SET reaction=NULL WHERE id=%s", (existing[0],))
                    else:
                        cur.execute(f"UPDATE {SC}.post_reactions SET reaction=%s WHERE id=%s", (reaction, existing[0]))
                else:
                    cur.execute(
                        f"INSERT INTO {SC}.post_reactions (post_id, session_id, reaction) VALUES (%s,%s,%s)",
                        (post_id, session_id, reaction)
                    )
                conn.commit()
                cur.execute(
                    f"SELECT reaction, COUNT(*) FROM {SC}.post_reactions WHERE post_id=%s AND reaction IS NOT NULL GROUP BY reaction",
                    (post_id,)
                )
                counts = {r[0]: r[1] for r in cur.fetchall()}
                return ok({"ok": True, "reactions": counts})

            elif comment_id:
                cur.execute(
                    f"SELECT id, reaction FROM {SC}.post_reactions WHERE comment_id=%s AND session_id=%s",
                    (comment_id, session_id)
                )
                existing = cur.fetchone()
                if existing:
                    if existing[1] == reaction:
                        cur.execute(f"UPDATE {SC}.post_reactions SET reaction=NULL WHERE id=%s", (existing[0],))
                    else:
                        cur.execute(f"UPDATE {SC}.post_reactions SET reaction=%s WHERE id=%s", (reaction, existing[0]))
                else:
                    cur.execute(
                        f"INSERT INTO {SC}.post_reactions (comment_id, session_id, reaction) VALUES (%s,%s,%s)",
                        (comment_id, session_id, reaction)
                    )
                conn.commit()
                cur.execute(
                    f"SELECT reaction, COUNT(*) FROM {SC}.post_reactions WHERE comment_id=%s AND reaction IS NOT NULL GROUP BY reaction",
                    (comment_id,)
                )
                counts = {r[0]: r[1] for r in cur.fetchall()}
                return ok({"ok": True, "reactions": counts})

            return err("Укажите post_id или comment_id")

        # ══════════════════════════════════════════════════════════════════════
        # МЕНЕДЖЕР: список постов (включая неопубликованные)
        # ══════════════════════════════════════════════════════════════════════
        if resource == "admin_posts" and method == "GET":
            mgr = check_manager(event, conn)
            if not mgr:
                return err("Необходима авторизация", 401)
            cur.execute(
                f"""SELECT id, type, title, slug, content, excerpt, cover_url,
                           video_url, author_name, tags, is_published, views,
                           created_at, comments_mode
                    FROM {SC}.posts ORDER BY created_at DESC LIMIT 100"""
            )
            posts = [{"id": r[0], "type": r[1], "title": r[2], "slug": r[3],
                      "content": r[4], "excerpt": r[5], "cover_url": r[6],
                      "video_url": r[7], "author_name": r[8], "tags": r[9],
                      "is_published": r[10], "views": r[11],
                      "created_at": str(r[12]),
                      "comments_mode": r[13] or "users"} for r in cur.fetchall()]
            return ok({"posts": posts})

        return err("Not found", 404)

    finally:
        cur.close()
        conn.close()