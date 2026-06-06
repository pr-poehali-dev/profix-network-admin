"""
Видео-бот ПРОФИКС: собирает видео по теме ККТ, 1С, ТСД, DataMobile, ремонт касс
с YouTube (RSS без ключа), RuTube (RSS/API) и публикует в блог как посты типа "video".
Запускается вручную GET /?run=1 или по расписанию.
"""
import json
import os
import re
import hashlib
import urllib.request
import urllib.parse
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

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ProFiXVideoBot/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

# Темы для поиска по умолчанию
DEFAULT_TOPICS = [
    "ккт", "1с", "тсд", "datamobile", "ремонт кассовых аппаратов",
    "кассовый аппарат", "онлайн-касса", "фискальный регистратор",
]

# YouTube каналы — поиск через RSS-фид канала (не требует API-ключа)
# Формат: channel_id или @handle
YOUTUBE_CHANNELS = [
    "UCaIHoD6XzN77Fj1JQRZc_pA",  # 1С:Предприятие официальный
    "UC_5K1AxAXQr8Nh_t0-l-FmQ",  # ДатаМобайл
]

# RuTube поиск через RSS/API
RUTUBE_SEARCH_URL = "https://rutube.ru/api/video/?search={query}&format=json&page_size=10"

# VK видео через RSS (видео группы по ID)
VK_VIDEO_GROUPS = []  # заполняется из настроек, например: ["club123456"]


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
    return (text[:80] or "video") + "-" + h


def fetch_url(url: str, timeout: int = 12) -> Optional[bytes]:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except Exception:
        return None


def load_settings(conn) -> dict:
    """Загружает настройки video-bot из bot_settings."""
    cur = conn.cursor()
    cur.execute(f"SELECT key, value FROM {SC}.bot_settings WHERE key LIKE 'video_bot.%%'")
    rows = cur.fetchall()
    cur.close()
    return {r[0].replace("video_bot.", ""): r[1] for r in rows}


def already_published(conn, title: str, video_url: str) -> bool:
    slug = slugify(title)
    cur = conn.cursor()
    cur.execute(
        f"SELECT id FROM {SC}.posts WHERE slug=%s OR title=%s OR video_url=%s LIMIT 1",
        (slug, title[:280], video_url)
    )
    row = cur.fetchone()
    cur.close()
    return row is not None


def topic_matches(title: str, description: str, topics: list[str]) -> bool:
    """Проверяет, содержит ли видео хоть одну из тем."""
    text = (title + " " + description).lower()
    return any(t in text for t in topics)


# ═══════════════════════════════════════════════════════════════
# YouTube: поиск через RSS-фид
# ═══════════════════════════════════════════════════════════════

def fetch_youtube_channel(channel_id: str) -> list[dict]:
    """Получает последние видео с YouTube канала через Atom RSS (без API-ключа)."""
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    raw = fetch_url(url)
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return []

    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/",
    }
    entries = root.findall("atom:entry", ns)
    results = []
    for entry in entries[:15]:
        def t(tag, ns=ns):
            el = entry.find(tag, ns)
            return el.text.strip() if el is not None and el.text else ""

        video_id = t("yt:videoId")
        title = t("atom:title")
        if not video_id or not title:
            continue

        desc_el = entry.find("media:group/media:description", ns)
        description = desc_el.text.strip() if desc_el is not None and desc_el.text else ""

        thumb_el = entry.find("media:group/media:thumbnail", ns)
        thumb = thumb_el.get("url", "") if thumb_el is not None else f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"

        video_url = f"https://www.youtube.com/watch?v={video_id}"

        results.append({
            "source": "youtube",
            "title": title,
            "description": description,
            "video_url": video_url,
            "cover_url": thumb or f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg",
            "video_id": video_id,
        })
    return results


def search_youtube_rss(query: str) -> list[dict]:
    """Поиск YouTube видео через Invidious API (публичный, без ключа)."""
    encoded = urllib.parse.quote(query)
    # Используем публичный Invidious instance для поиска
    url = f"https://iv.datura.network/api/v1/search?q={encoded}&type=video&page=1"
    raw = fetch_url(url, timeout=8)
    if not raw:
        return []
    try:
        items = json.loads(raw.decode("utf-8", errors="ignore"))
        if not isinstance(items, list):
            return []
    except Exception:
        return []

    results = []
    for item in items[:10]:
        video_id = item.get("videoId", "")
        title = item.get("title", "")
        if not video_id or not title:
            continue
        description = item.get("description", "") or ""
        thumb = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
        results.append({
            "source": "youtube",
            "title": title,
            "description": description[:500],
            "video_url": f"https://www.youtube.com/watch?v={video_id}",
            "cover_url": thumb,
            "video_id": video_id,
        })
    return results


# ═══════════════════════════════════════════════════════════════
# RuTube: поиск через публичный API
# ═══════════════════════════════════════════════════════════════

def search_rutube(query: str) -> list[dict]:
    """Поиск видео на RuTube через открытый API."""
    encoded = urllib.parse.quote(query)
    url = f"https://rutube.ru/api/video/?search={encoded}&format=json&page_size=8"
    raw = fetch_url(url, timeout=10)
    if not raw:
        return []
    try:
        data = json.loads(raw.decode("utf-8", errors="ignore"))
        items = data.get("results", [])
    except Exception:
        return []

    results = []
    for item in items:
        video_id = item.get("id", "")
        title = item.get("title", "")
        if not video_id or not title:
            continue
        description = item.get("description", "") or ""
        # Обложка
        thumb = ""
        thumbnail_url = item.get("thumbnail_url", "")
        if thumbnail_url:
            thumb = thumbnail_url
        video_url = f"https://rutube.ru/video/{video_id}/"
        results.append({
            "source": "rutube",
            "title": title,
            "description": description[:500],
            "video_url": video_url,
            "cover_url": thumb,
            "video_id": str(video_id),
        })
    return results


# ═══════════════════════════════════════════════════════════════
# VK видео: через RSS открытых групп
# ═══════════════════════════════════════════════════════════════

def search_vk_video(query: str) -> list[dict]:
    """Поиск VK видео через открытый API (без токена, только публичные)."""
    encoded = urllib.parse.quote(query)
    url = f"https://vk.com/video?q={encoded}&section=search"
    # VK не даёт публичный API видео без токена — возвращаем пусто
    # Реальная реализация требует VK_ACCESS_TOKEN
    vk_token = os.environ.get("VK_ACCESS_TOKEN", "")
    if not vk_token:
        return []

    api_url = (
        f"https://api.vk.com/method/video.search"
        f"?q={encoded}&count=10&access_token={vk_token}&v=5.199"
    )
    raw = fetch_url(api_url, timeout=10)
    if not raw:
        return []
    try:
        data = json.loads(raw.decode("utf-8", errors="ignore"))
        items = data.get("response", {}).get("items", [])
    except Exception:
        return []

    results = []
    for item in items:
        video_id = item.get("id", "")
        owner_id = item.get("owner_id", "")
        title = item.get("title", "")
        if not video_id or not title:
            continue
        description = item.get("description", "") or ""
        thumb = item.get("image", [{}])[-1].get("url", "") if item.get("image") else ""
        video_url = f"https://vk.com/video{owner_id}_{video_id}"
        results.append({
            "source": "vk",
            "title": title,
            "description": description[:500],
            "video_url": video_url,
            "cover_url": thumb,
            "video_id": f"{owner_id}_{video_id}",
        })
    return results


def publish_video(conn, video: dict) -> int:
    """Публикует видео-пост в блог."""
    slug = slugify(video["title"])
    description = video.get("description", "")
    source_label = {"youtube": "YouTube", "rutube": "RuTube", "vk": "VK Видео"}.get(video["source"], "Видео")

    content_parts = []
    if description:
        content_parts.append(f"<p>{description}</p>")
    content_parts.append(
        f'<p><a href="{video["video_url"]}" target="_blank" rel="noopener noreferrer">'
        f'Смотреть на {source_label} →</a></p>'
    )
    content = "\n".join(content_parts)

    tag = "ККТ" if "касс" in (video["title"] + video.get("description", "")).lower() else \
          "1С" if "1с" in (video["title"] + video.get("description", "")).lower() else \
          "ТСД" if "тсд" in (video["title"] + video.get("description", "")).lower() else \
          source_label

    cur = conn.cursor()
    cur.execute(
        f"""INSERT INTO {SC}.posts
            (type, title, slug, content, excerpt, cover_url, video_url,
             author_name, tags, is_published, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,TRUE,NOW(),NOW())
            RETURNING id""",
        (
            "video",
            video["title"][:280],
            slug,
            content,
            description[:400],
            video.get("cover_url", ""),
            video["video_url"],
            "ПРОФИКС Бот",
            tag,
        ),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return new_id


def send_tg_report(published: list, errors: list) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    today = datetime.now(timezone.utc).strftime("%d.%m.%Y")
    if published:
        lines = [f"🎬 *Видео-бот — отчёт за {today}*\n"]
        lines.append(f"✅ Опубликовано: *{len(published)}* видео")
        for i, p in enumerate(published, 1):
            icon = {"youtube": "▶️", "rutube": "🟠", "vk": "🔵"}.get(p.get("source", ""), "🎬")
            lines.append(f"{icon} {i}\\. {p['title'][:80]}")
        if errors:
            lines.append(f"⚠️ Ошибок: {len(errors)}")
    else:
        lines = [f"🎬 *Видео-бот — отчёт за {today}*\n", "ℹ️ Новых видео не найдено."]
    text = "\n".join(lines)
    try:
        payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "MarkdownV2"}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=payload, headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def handler(event: dict, context) -> dict:
    """Видео-бот: ищет видео по темам ККТ/1С/ТСД на YouTube, RuTube, VK и публикует в блог."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    run = params.get("run", "0")

    if run != "1":
        return ok({"ok": True, "status": "video-bot ready"})

    conn = get_conn()
    settings = load_settings(conn)

    if settings.get("enabled", "true").lower() != "true":
        conn.close()
        return ok({"ok": False, "status": "video-bot disabled"})

    use_youtube = settings.get("youtube", "true").lower() == "true"
    use_rutube  = settings.get("rutube",  "true").lower() == "true"
    use_vk      = settings.get("vk",      "false").lower() == "true"
    limit       = min(int(params.get("limit", settings.get("max_per_run", "2"))), 10)

    raw_topics = settings.get("topics", ",".join(DEFAULT_TOPICS))
    topics = [t.strip().lower() for t in raw_topics.split(",") if t.strip()]
    if not topics:
        topics = DEFAULT_TOPICS

    all_videos = []
    errors = []

    # ── YouTube ───────────────────────────────────────────────
    if use_youtube:
        for query in topics[:5]:
            try:
                vids = search_youtube_rss(query)
                for v in vids:
                    if topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"youtube/{query}: {str(e)}")

        for ch_id in YOUTUBE_CHANNELS:
            try:
                vids = fetch_youtube_channel(ch_id)
                for v in vids:
                    if topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"yt_channel/{ch_id}: {str(e)}")

    # ── RuTube ────────────────────────────────────────────────
    if use_rutube:
        for query in topics[:5]:
            try:
                vids = search_rutube(query)
                for v in vids:
                    if topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"rutube/{query}: {str(e)}")

    # ── VK ────────────────────────────────────────────────────
    if use_vk:
        for query in topics[:3]:
            try:
                vids = search_vk_video(query)
                for v in vids:
                    if topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"vk/{query}: {str(e)}")

    # Дедупликация по video_url внутри батча
    seen_urls = set()
    unique_videos = []
    for v in all_videos:
        if v["video_url"] not in seen_urls:
            seen_urls.add(v["video_url"])
            unique_videos.append(v)

    published = []
    skipped = 0

    for video in unique_videos:
        if len(published) >= limit:
            break
        if not video["title"] or not video["video_url"]:
            continue
        if already_published(conn, video["title"], video["video_url"]):
            skipped += 1
            continue
        try:
            post_id = publish_video(conn, video)
            published.append({
                "id": post_id,
                "title": video["title"],
                "source": video["source"],
            })
        except Exception as e:
            errors.append(f"publish: {str(e)}")

    conn.close()
    send_tg_report(published, errors)

    return ok({
        "ok": True,
        "published": len(published),
        "posts": published,
        "skipped_duplicates": skipped,
        "total_found": len(unique_videos),
        "errors": errors,
    })
