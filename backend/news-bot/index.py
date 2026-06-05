"""
Новостной бот ПРОФИКС: парсит RSS-ленты IT/бухгалтерских источников
и публикует 1–2 свежие новости в день в таблицу posts.
Приоритет: 1С, налоги, маркировка → остальные IT-новости.
Запускается вручную (GET /?run=1) или по расписанию через крон.
"""
import json
import os
import re
import hashlib
import urllib.request
import urllib.parse
import urllib.error
import xml.etree.ElementTree as ET
import psycopg2
from datetime import datetime, timezone
from typing import Optional

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

# ── RSS-источники ─────────────────────────────────────────────────────────────
# priority: 1 = высокий (1С, налоги, маркировка), 2 = средний, 3 = общий IT
RSS_SOURCES = [
    # 1С / бухгалтерия / налоги
    {"url": "https://its.1c.ru/news/rss/", "priority": 1, "tag": "1С"},
    {"url": "https://www.consultant.ru/rss/news.xml", "priority": 1, "tag": "Налоги"},
    {"url": "https://www.nalog.gov.ru/rss/rss.xml", "priority": 1, "tag": "ФНС"},
    # Маркировка / Честный знак
    {"url": "https://честныйзнак.рф/rss/", "priority": 1, "tag": "Маркировка"},
    {"url": "https://xn--80ajghhoc2aj1c8b.xn--p1ai/rss/", "priority": 1, "tag": "Маркировка"},
    # Общие IT
    {"url": "https://www.cnews.ru/inc/rss/news.xml", "priority": 2, "tag": "IT"},
    {"url": "https://habr.com/ru/rss/news/", "priority": 2, "tag": "IT"},
    {"url": "https://vc.ru/rss", "priority": 3, "tag": "Бизнес"},
    {"url": "https://www.klerk.ru/rss/all/", "priority": 1, "tag": "Бухгалтерия"},
]

# Ключевые слова по приоритетам (для scoring)
HIGH_PRIORITY_KEYWORDS = [
    "1с", "1c", "маркировка", "честный знак", "фнс", "налог", "ндс",
    "бухгалтер", "ккт", "касса", "фискал", "оператор фискальных",
    "egais", "егаис", "фф", "ффд", "прослеживаем", "эдо",
]
MEDIUM_PRIORITY_KEYWORDS = [
    "автоматизация", "склад", "торговл", "розниц", "erp", "crm",
    "программное обеспечение", "цифровизац", "it", "ит",
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ProFiXNewsBot/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

MAX_POSTS_PER_RUN = 1
MAX_EXCERPT_LEN = 400
MAX_TITLE_LEN = 280


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-zа-я0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    h = hashlib.md5(text.encode()).hexdigest()[:6]
    return (text[:80] or "news") + "-" + h


def score_text(text: str) -> int:
    """Возвращает score: чем выше — тем приоритетнее публикация."""
    t = text.lower()
    score = 0
    for kw in HIGH_PRIORITY_KEYWORDS:
        if kw in t:
            score += 10
    for kw in MEDIUM_PRIORITY_KEYWORDS:
        if kw in t:
            score += 3
    return score


def fetch_url(url: str, timeout: int = 10) -> Optional[bytes]:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except Exception:
        return None


def extract_image_from_entry(entry_elem, ns: dict) -> Optional[str]:
    """Ищет картинку в элементе RSS: enclosure, media:content, <img> в description."""
    # enclosure
    enc = entry_elem.find("enclosure")
    if enc is not None:
        t = enc.get("type", "")
        if t.startswith("image"):
            url = enc.get("url", "")
            if url:
                return url

    # media:content
    for tag in ["media:content", "media:thumbnail"]:
        tag_ns = tag.replace("media:", "{http://search.yahoo.com/mrss/}")
        el = entry_elem.find(tag_ns)
        if el is not None:
            url = el.get("url", "")
            if url:
                return url

    # img в description / content
    for field in ["description", "{http://purl.org/rss/1.0/modules/content/}encoded"]:
        el = entry_elem.find(field)
        if el is not None and el.text:
            m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', el.text)
            if m:
                return m.group(1)

    return None


def clean_html(text: str) -> str:
    """Убирает HTML-теги из текста."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def parse_rss(source: dict) -> list[dict]:
    """Парсит один RSS-источник, возвращает список статей."""
    raw = fetch_url(source["url"])
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return []

    # Поддержка Atom и RSS
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = root.findall(".//item") or root.findall(".//atom:entry", ns)

    results = []
    for item in items[:20]:
        def t(tag):
            el = item.find(tag)
            return el.text.strip() if el is not None and el.text else ""

        title = clean_html(t("title") or t("atom:title"))[:MAX_TITLE_LEN]
        if not title:
            continue

        desc = clean_html(
            t("{http://purl.org/rss/1.0/modules/content/}encoded")
            or t("description")
            or t("atom:summary")
            or t("atom:content")
        )
        excerpt = desc[:MAX_EXCERPT_LEN] if desc else ""

        link = t("link") or t("guid") or t("atom:id")
        # link может быть пустым — пробуем atom:link href
        if not link:
            el = item.find("atom:link", ns)
            if el is not None:
                link = el.get("href", "")

        pub_date_str = t("pubDate") or t("atom:published") or t("atom:updated")
        image_url = extract_image_from_entry(item, ns)

        score = source["priority"] * -5 + score_text(title + " " + excerpt)

        results.append({
            "title": title,
            "excerpt": excerpt,
            "link": link,
            "image_url": image_url,
            "tag": source["tag"],
            "score": score,
            "pub_date": pub_date_str,
        })
    return results


def already_published(conn, title: str, link: str) -> bool:
    """Проверяет, не публиковали ли уже такую новость (по заголовку или slug)."""
    slug = slugify(title)
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SC}.posts WHERE slug=%s OR title=%s LIMIT 1",
        (slug, title[:MAX_TITLE_LEN])
    )
    row = cur.fetchone()
    cur.close()
    return row is not None


def publish_post(conn, article: dict) -> int:
    """Вставляет пост в таблицу posts, возвращает новый id."""
    slug = slugify(article["title"])
    tag = article.get("tag", "IT")
    link = article.get("link", "")
    excerpt = article.get("excerpt", "")

    content_parts = []
    if excerpt:
        content_parts.append(f"<p>{excerpt}</p>")
    if link:
        content_parts.append(
            f'<p><a href="{link}" target="_blank" rel="noopener noreferrer">'
            f'Читать источник →</a></p>'
        )
    content = "\n".join(content_parts)

    cur = conn.cursor()
    cur.execute(
        f"""INSERT INTO {SC}.posts
            (type, title, slug, content, excerpt, cover_url,
             author_name, tags, is_published, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW())
            RETURNING id""",
        (
            "news",
            article["title"][:MAX_TITLE_LEN],
            slug,
            content,
            excerpt[:MAX_EXCERPT_LEN],
            article.get("image_url") or "",
            "ПРОФИКС Бот",
            tag,
        ),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return new_id


def send_tg_report(published: list, skipped: int, errors: list) -> None:
    """Отправляет отчёт о публикации новостей в Telegram."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return

    today = datetime.now(timezone.utc).strftime("%d.%m.%Y")

    if published:
        lines = [f"📰 *Новостной бот — отчёт за {today}*\n"]
        lines.append(f"✅ Опубликовано: *{len(published)}* новости")
        for i, p in enumerate(published, 1):
            img = "🖼" if p.get("has_image") else "📄"
            lines.append(f"{img} {i}\\. [{p['tag']}] {p['title'][:80]}")
        if skipped:
            lines.append(f"\n⏭ Пропущено дублей: {skipped}")
        if errors:
            lines.append(f"⚠️ Ошибок RSS: {len(errors)}")
    else:
        lines = [
            f"📰 *Новостной бот — отчёт за {today}*\n",
            "ℹ️ Новых новостей не найдено — всё уже опубликовано.",
        ]
        if skipped:
            lines.append(f"⏭ Дублей пропущено: {skipped}")
        if errors:
            lines.append(f"⚠️ Ошибок RSS: {len(errors)}")

    text = "\n".join(lines)
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "MarkdownV2",
    }).encode()
    try:
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Новостной бот: парсит RSS IT/бухгалтерских источников и публикует 1–2 новости в день."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    run = params.get("run", "0")

    # Статус — просто проверка что бот жив
    if run != "1":
        return ok({"ok": True, "status": "news-bot ready", "sources": len(RSS_SOURCES)})

    # ── Собираем статьи из всех RSS ───────────────────────────────────────────
    all_articles = []
    errors = []
    for source in RSS_SOURCES:
        try:
            articles = parse_rss(source)
            all_articles.extend(articles)
        except Exception as e:
            errors.append(f"{source['url']}: {str(e)}")

    if not all_articles:
        return ok({"ok": False, "error": "Нет статей из RSS", "rss_errors": errors})

    # Сортируем: высокий score = высокий приоритет
    all_articles.sort(key=lambda a: -a["score"])

    # ── Публикуем до MAX_POSTS_PER_RUN новых постов ───────────────────────────
    conn = get_conn()
    published = []
    skipped = 0

    for article in all_articles:
        if len(published) >= MAX_POSTS_PER_RUN:
            break
        if not article["title"]:
            continue
        if not article.get("image_url"):
            skipped += 1
            continue
        if already_published(conn, article["title"], article.get("link", "")):
            skipped += 1
            continue
        try:
            post_id = publish_post(conn, article)
            published.append({
                "id": post_id,
                "title": article["title"],
                "tag": article["tag"],
                "score": article["score"],
                "has_image": bool(article.get("image_url")),
            })
        except Exception as e:
            errors.append(f"publish error: {str(e)}")

    conn.close()

    # ── Отчёт в Telegram ──────────────────────────────────────────────────────
    send_tg_report(published, skipped, errors)

    return ok({
        "ok": True,
        "published": len(published),
        "posts": published,
        "skipped_duplicates": skipped,
        "total_fetched": len(all_articles),
        "rss_errors": errors,
    })