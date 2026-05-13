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


def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-zа-я0-9\s-]', '', text)
    text = re.sub(r'\s+', '-', text.strip())
    return text[:100] or "post"


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
                               video_url, author_name, tags, views, created_at, updated_at
                        FROM {SC}.posts WHERE id=%s AND is_published=TRUE""",
                    (post_id,)
                )
                row = cur.fetchone()
                conn.commit()
                if not row:
                    return err("Пост не найден", 404)
                # Комментарии
                cur.execute(
                    f"SELECT id, author_name, text, created_at FROM {SC}.post_comments "
                    f"WHERE post_id=%s AND is_approved=TRUE ORDER BY created_at ASC",
                    (post_id,)
                )
                comments = [{"id": c[0], "author_name": c[1], "text": c[2],
                             "created_at": str(c[3])} for c in cur.fetchall()]
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
                     author_id, author_name, tags, is_published)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
                (body.get("type", "news"), title, slug,
                 body.get("content", ""), body.get("excerpt", ""),
                 body.get("cover_url", ""), body.get("video_url", ""),
                 mgr[0], mgr[1], body.get("tags", ""),
                 body.get("is_published", False))
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
                          "tags", "type", "is_published"]:
                if field in body:
                    sets.append(f"{field}=%s"); vals.append(body[field])
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
        # КОММЕНТАРИИ
        # ══════════════════════════════════════════════════════════════════════
        if resource == "comments" and method == "POST":
            post_id    = body.get("post_id")
            author     = (body.get("author_name") or "Гость").strip()[:50]
            text       = body.get("text", "").strip()
            client_id  = body.get("client_id")
            if not post_id or not text:
                return err("Укажите пост и текст комментария")
            if len(text) > 2000:
                return err("Комментарий слишком длинный")
            cur.execute(
                f"""INSERT INTO {SC}.post_comments (post_id, client_id, author_name, text)
                    VALUES (%s,%s,%s,%s) RETURNING id, created_at""",
                (post_id, client_id or None, author, text)
            )
            row = cur.fetchone()
            conn.commit()
            return ok({"ok": True, "comment": {
                "id": row[0], "author_name": author,
                "text": text, "created_at": str(row[1])
            }})

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
                f"""SELECT id, type, title, is_published, views, created_at
                    FROM {SC}.posts ORDER BY created_at DESC LIMIT 100"""
            )
            posts = [{"id": r[0], "type": r[1], "title": r[2],
                      "is_published": r[3], "views": r[4],
                      "created_at": str(r[5])} for r in cur.fetchall()]
            return ok({"posts": posts})

        return err("Not found", 404)

    finally:
        cur.close()
        conn.close()
