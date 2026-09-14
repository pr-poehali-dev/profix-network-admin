"""
Боты контента ПРОФИКС (объединённая функция): новостной бот, видео-бот, планировщик.
Роутинг по query-параметру bot: news | video | scheduler (по умолчанию scheduler).

GET /?bot=news&run=1     — запустить новостной бот
GET /?bot=news           — статус новостного бота
GET /?bot=video&run=1    — запустить видео-бот
GET /?bot=video          — статус видео-бота
GET /?bot=scheduler (или без bot) — проверить расписание и запустить нужных ботов
GET /?bot=scheduler&status=1      — показать расписание без запуска
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


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


# ═══════════════════════════════════════════════════════════════════════════
# ОБЩИЕ УТИЛИТЫ
# ═══════════════════════════════════════════════════════════════════════════

def slugify(text: str, fallback: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-zа-я0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text.strip())
    h = hashlib.md5(text.encode()).hexdigest()[:6]
    return (text[:80] or fallback) + "-" + h


def fetch_url(url: str, headers: dict, timeout: int = 10) -> Optional[bytes]:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.read()
    except Exception:
        return None


def send_tg_report(text: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        return
    try:
        payload = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "MarkdownV2"}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data=payload, headers={"Content-Type": "application/json"}, method="POST")
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


# ═══════════════════════════════════════════════════════════════════════════
# НОВОСТНОЙ БОТ
# ═══════════════════════════════════════════════════════════════════════════

NEWS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ProFiXNewsBot/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

RSS_SOURCES = [
    {"url": "https://its.1c.ru/news/rss/", "priority": 1, "tag": "1С"},
    {"url": "https://www.consultant.ru/rss/news.xml", "priority": 1, "tag": "Налоги"},
    {"url": "https://www.nalog.gov.ru/rss/rss.xml", "priority": 1, "tag": "ФНС"},
    {"url": "https://честныйзнак.рф/rss/", "priority": 1, "tag": "Маркировка"},
    {"url": "https://xn--80ajghhoc2aj1c8b.xn--p1ai/rss/", "priority": 1, "tag": "Маркировка"},
    {"url": "https://www.cnews.ru/inc/rss/news.xml", "priority": 2, "tag": "IT"},
    {"url": "https://habr.com/ru/rss/news/", "priority": 2, "tag": "IT"},
    {"url": "https://vc.ru/rss", "priority": 3, "tag": "Бизнес"},
    {"url": "https://www.klerk.ru/rss/all/", "priority": 1, "tag": "Бухгалтерия"},
]

HIGH_PRIORITY_KEYWORDS = [
    "1с", "1c", "маркировка", "честный знак", "фнс", "налог", "ндс",
    "бухгалтер", "ккт", "касса", "фискал", "оператор фискальных",
    "egais", "егаис", "фф", "ффд", "прослеживаем", "эдо",
]
MEDIUM_PRIORITY_KEYWORDS = [
    "автоматизация", "склад", "торговл", "розниц", "erp", "crm",
    "программное обеспечение", "цифровизац", "it", "ит",
]

MAX_POSTS_PER_RUN = 1
MAX_EXCERPT_LEN = 400
MAX_TITLE_LEN = 280


def news_score_text(text: str) -> int:
    t = text.lower()
    score = 0
    for kw in HIGH_PRIORITY_KEYWORDS:
        if kw in t:
            score += 10
    for kw in MEDIUM_PRIORITY_KEYWORDS:
        if kw in t:
            score += 3
    return score


def news_extract_image(entry_elem) -> Optional[str]:
    enc = entry_elem.find("enclosure")
    if enc is not None:
        t = enc.get("type", "")
        if t.startswith("image"):
            url = enc.get("url", "")
            if url:
                return url
    for tag in ["media:content", "media:thumbnail"]:
        tag_ns = tag.replace("media:", "{http://search.yahoo.com/mrss/}")
        el = entry_elem.find(tag_ns)
        if el is not None:
            url = el.get("url", "")
            if url:
                return url
    for field in ["description", "{http://purl.org/rss/1.0/modules/content/}encoded"]:
        el = entry_elem.find(field)
        if el is not None and el.text:
            m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', el.text)
            if m:
                return m.group(1)
    return None


def news_clean_html(text: str) -> str:
    if not text:
        return ""
    text = text.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")
    text = text.replace("&nbsp;", " ").replace("&quot;", '"').replace("&#39;", "'")
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&[a-zA-Z#0-9]+;", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def news_parse_rss(source: dict) -> list:
    raw = fetch_url(source["url"], NEWS_HEADERS)
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom"}
    items = root.findall(".//item") or root.findall(".//atom:entry", ns)

    results = []
    for item in items[:20]:
        def t(tag):
            el = item.find(tag)
            return el.text.strip() if el is not None and el.text else ""

        title = news_clean_html(t("title") or t("atom:title"))[:MAX_TITLE_LEN]
        if not title:
            continue

        desc = news_clean_html(
            t("{http://purl.org/rss/1.0/modules/content/}encoded")
            or t("description")
            or t("atom:summary")
            or t("atom:content")
        )
        excerpt = desc[:MAX_EXCERPT_LEN] if desc else ""

        link = t("link") or t("guid") or t("atom:id")
        if not link:
            el = item.find("atom:link", ns)
            if el is not None:
                link = el.get("href", "")

        image_url = news_extract_image(item)
        score = source["priority"] * -5 + news_score_text(title + " " + excerpt)

        results.append({
            "title": title, "excerpt": excerpt, "link": link,
            "image_url": image_url, "tag": source["tag"], "score": score,
        })
    return results


def news_already_published(conn, title: str) -> bool:
    slug = slugify(title, "news")
    cur = conn.cursor()
    cur.execute(f"SELECT id FROM {SC}.posts WHERE slug=%s OR title=%s LIMIT 1", (slug, title[:MAX_TITLE_LEN]))
    row = cur.fetchone()
    cur.close()
    return row is not None


def news_publish_post(conn, article: dict) -> int:
    slug = slugify(article["title"], "news")
    tag = article.get("tag", "IT")
    link = article.get("link", "")
    excerpt = article.get("excerpt", "")

    content_parts = []
    if excerpt:
        content_parts.append(f"<p>{excerpt}</p>")
    if link:
        content_parts.append(f'<p><a href="{link}" target="_blank" rel="noopener noreferrer">Читать источник →</a></p>')
    content = "\n".join(content_parts)

    cur = conn.cursor()
    cur.execute(
        f"""INSERT INTO {SC}.posts
            (type, title, slug, content, excerpt, cover_url, author_name, tags, is_published, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, TRUE, NOW(), NOW()) RETURNING id""",
        ("news", article["title"][:MAX_TITLE_LEN], slug, content, excerpt[:MAX_EXCERPT_LEN],
         article.get("image_url") or "", "ПРОФИКС Бот", tag),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return new_id


def news_load_settings(conn) -> dict:
    cur = conn.cursor()
    cur.execute(f"SELECT key, value FROM {SC}.bot_settings WHERE key LIKE 'news_bot.%%'")
    rows = cur.fetchall()
    cur.close()
    return {r[0].replace("news_bot.", ""): r[1] for r in rows}


def run_news_bot(params: dict) -> dict:
    run = params.get("run", "0")
    if run != "1":
        return {"ok": True, "status": "news-bot ready", "sources": len(RSS_SOURCES)}

    conn = get_conn()
    settings = news_load_settings(conn)

    if settings.get("enabled", "true").lower() != "true":
        conn.close()
        return {"ok": False, "status": "news-bot disabled"}

    limit = min(int(params.get("limit", settings.get("max_per_run", str(MAX_POSTS_PER_RUN)))), 20)
    require_image = settings.get("require_image", "true").lower() == "true"
    extra_keywords = [k.strip().lower() for k in settings.get("keywords", "").split(",") if k.strip()]

    sources_setting = settings.get("sources", "all")
    if sources_setting == "all":
        active_sources = RSS_SOURCES
    else:
        allowed_tags = {t.strip().lower() for t in sources_setting.split(",")}
        active_sources = [s for s in RSS_SOURCES if s["tag"].lower() in allowed_tags] or RSS_SOURCES

    all_articles = []
    errors = []
    for source in active_sources:
        try:
            articles = news_parse_rss(source)
            if extra_keywords:
                for a in articles:
                    t = (a["title"] + " " + a.get("excerpt", "")).lower()
                    for kw in extra_keywords:
                        if kw in t:
                            a["score"] += 8
            all_articles.extend(articles)
        except Exception as e:
            errors.append(f"{source['url']}: {str(e)}")

    if not all_articles:
        conn.close()
        return {"ok": False, "error": "Нет статей из RSS", "rss_errors": errors}

    all_articles.sort(key=lambda a: -a["score"])

    published = []
    skipped = 0
    for article in all_articles:
        if len(published) >= limit:
            break
        if not article["title"]:
            continue
        if require_image and not article.get("image_url"):
            skipped += 1
            continue
        if news_already_published(conn, article["title"]):
            skipped += 1
            continue
        try:
            post_id = news_publish_post(conn, article)
            published.append({"id": post_id, "title": article["title"], "tag": article["tag"],
                               "score": article["score"], "has_image": bool(article.get("image_url"))})
        except Exception as e:
            errors.append(f"publish error: {str(e)}")

    conn.close()

    today = datetime.now(timezone.utc).strftime("%d.%m.%Y")
    if published:
        lines = [f"📰 *Новостной бот — отчёт за {today}*\n", f"✅ Опубликовано: *{len(published)}* новости"]
        for i, p in enumerate(published, 1):
            icon = "🖼" if p.get("has_image") else "📄"
            lines.append(f"{icon} {i}\\. [{p['tag']}] {p['title'][:80]}")
        if skipped:
            lines.append(f"\n⏭ Пропущено дублей: {skipped}")
    else:
        lines = [f"📰 *Новостной бот — отчёт за {today}*\n", "ℹ️ Новых новостей не найдено."]
    send_tg_report("\n".join(lines))

    return {"ok": True, "published": len(published), "posts": published,
            "skipped_duplicates": skipped, "total_fetched": len(all_articles), "rss_errors": errors}


# ═══════════════════════════════════════════════════════════════════════════
# ВИДЕО-БОТ
# ═══════════════════════════════════════════════════════════════════════════

VIDEO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ProFiXVideoBot/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}

DEFAULT_TOPICS = [
    "ккт", "1с", "тсд", "datamobile", "ремонт кассовых аппаратов",
    "кассовый аппарат", "онлайн-касса", "фискальный регистратор",
]

YOUTUBE_CHANNELS = [
    "UCaIHoD6XzN77Fj1JQRZc_pA",
    "UC_5K1AxAXQr8Nh_t0-l-FmQ",
]


def video_fetch_youtube_channel(channel_id: str) -> list:
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    raw = fetch_url(url, VIDEO_HEADERS, timeout=12)
    if not raw:
        return []
    try:
        root = ET.fromstring(raw)
    except ET.ParseError:
        return []

    ns = {"atom": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015",
          "media": "http://search.yahoo.com/mrss/"}
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
        results.append({"source": "youtube", "title": title, "description": description,
                         "video_url": f"https://www.youtube.com/watch?v={video_id}",
                         "cover_url": thumb, "video_id": video_id})
    return results


def video_search_youtube_rss(query: str) -> list:
    encoded = urllib.parse.quote(query)
    url = f"https://iv.datura.network/api/v1/search?q={encoded}&type=video&page=1"
    raw = fetch_url(url, VIDEO_HEADERS, timeout=8)
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
        results.append({"source": "youtube", "title": title, "description": description[:500],
                         "video_url": f"https://www.youtube.com/watch?v={video_id}",
                         "cover_url": f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg", "video_id": video_id})
    return results


def video_search_rutube(query: str) -> list:
    encoded = urllib.parse.quote(query)
    url = f"https://rutube.ru/api/video/?search={encoded}&format=json&page_size=8"
    raw = fetch_url(url, VIDEO_HEADERS, timeout=10)
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
        thumb = item.get("thumbnail_url", "") or ""
        results.append({"source": "rutube", "title": title, "description": description[:500],
                         "video_url": f"https://rutube.ru/video/{video_id}/", "cover_url": thumb,
                         "video_id": str(video_id)})
    return results


def video_search_vk(query: str) -> list:
    vk_token = os.environ.get("VK_ACCESS_TOKEN", "")
    if not vk_token:
        return []
    encoded = urllib.parse.quote(query)
    api_url = f"https://api.vk.com/method/video.search?q={encoded}&count=10&access_token={vk_token}&v=5.199"
    raw = fetch_url(api_url, VIDEO_HEADERS, timeout=10)
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
        results.append({"source": "vk", "title": title, "description": description[:500],
                         "video_url": f"https://vk.com/video{owner_id}_{video_id}", "cover_url": thumb,
                         "video_id": f"{owner_id}_{video_id}"})
    return results


def video_topic_matches(title: str, description: str, topics: list) -> bool:
    text = (title + " " + description).lower()
    return any(t in text for t in topics)


def video_already_published(conn, title: str, video_url: str) -> bool:
    slug = slugify(title, "video")
    cur = conn.cursor()
    cur.execute(f"SELECT id FROM {SC}.posts WHERE slug=%s OR title=%s OR video_url=%s LIMIT 1",
                (slug, title[:280], video_url))
    row = cur.fetchone()
    cur.close()
    return row is not None


def video_publish(conn, video: dict) -> int:
    slug = slugify(video["title"], "video")
    description = video.get("description", "")
    source_label = {"youtube": "YouTube", "rutube": "RuTube", "vk": "VK Видео"}.get(video["source"], "Видео")

    content_parts = []
    if description:
        content_parts.append(f"<p>{description}</p>")
    content_parts.append(f'<p><a href="{video["video_url"]}" target="_blank" rel="noopener noreferrer">Смотреть на {source_label} →</a></p>')
    content = "\n".join(content_parts)

    text_all = (video["title"] + video.get("description", "")).lower()
    tag = "ККТ" if "касс" in text_all else "1С" if "1с" in text_all else "ТСД" if "тсд" in text_all else source_label

    cur = conn.cursor()
    cur.execute(
        f"""INSERT INTO {SC}.posts
            (type, title, slug, content, excerpt, cover_url, video_url, author_name, tags, is_published, created_at, updated_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,TRUE,NOW(),NOW()) RETURNING id""",
        ("video", video["title"][:280], slug, content, description[:400],
         video.get("cover_url", ""), video["video_url"], "ПРОФИКС Бот", tag),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    return new_id


def video_load_settings(conn) -> dict:
    cur = conn.cursor()
    cur.execute(f"SELECT key, value FROM {SC}.bot_settings WHERE key LIKE 'video_bot.%%'")
    rows = cur.fetchall()
    cur.close()
    return {r[0].replace("video_bot.", ""): r[1] for r in rows}


def run_video_bot(params: dict) -> dict:
    run = params.get("run", "0")
    if run != "1":
        return {"ok": True, "status": "video-bot ready"}

    conn = get_conn()
    settings = video_load_settings(conn)

    if settings.get("enabled", "true").lower() != "true":
        conn.close()
        return {"ok": False, "status": "video-bot disabled"}

    use_youtube = settings.get("youtube", "true").lower() == "true"
    use_rutube = settings.get("rutube", "true").lower() == "true"
    use_vk = settings.get("vk", "false").lower() == "true"
    limit = min(int(params.get("limit", settings.get("max_per_run", "2"))), 10)

    raw_topics = settings.get("topics", ",".join(DEFAULT_TOPICS))
    topics = [t.strip().lower() for t in raw_topics.split(",") if t.strip()] or DEFAULT_TOPICS

    all_videos = []
    errors = []

    if use_youtube:
        for query in topics[:5]:
            try:
                for v in video_search_youtube_rss(query):
                    if video_topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"youtube/{query}: {str(e)}")
        for ch_id in YOUTUBE_CHANNELS:
            try:
                for v in video_fetch_youtube_channel(ch_id):
                    if video_topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"yt_channel/{ch_id}: {str(e)}")

    if use_rutube:
        for query in topics[:5]:
            try:
                for v in video_search_rutube(query):
                    if video_topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"rutube/{query}: {str(e)}")

    if use_vk:
        for query in topics[:3]:
            try:
                for v in video_search_vk(query):
                    if video_topic_matches(v["title"], v.get("description", ""), topics):
                        all_videos.append(v)
            except Exception as e:
                errors.append(f"vk/{query}: {str(e)}")

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
        if video_already_published(conn, video["title"], video["video_url"]):
            skipped += 1
            continue
        try:
            post_id = video_publish(conn, video)
            published.append({"id": post_id, "title": video["title"], "source": video["source"]})
        except Exception as e:
            errors.append(f"publish: {str(e)}")

    conn.close()

    today = datetime.now(timezone.utc).strftime("%d.%m.%Y")
    if published:
        lines = [f"🎬 *Видео-бот — отчёт за {today}*\n", f"✅ Опубликовано: *{len(published)}* видео"]
        for i, p in enumerate(published, 1):
            icon = {"youtube": "▶️", "rutube": "🟠", "vk": "🔵"}.get(p.get("source", ""), "🎬")
            lines.append(f"{icon} {i}\\. {p['title'][:80]}")
    else:
        lines = [f"🎬 *Видео-бот — отчёт за {today}*\n", "ℹ️ Новых видео не найдено."]
    send_tg_report("\n".join(lines))

    return {"ok": True, "published": len(published), "posts": published,
            "skipped_duplicates": skipped, "total_found": len(unique_videos), "errors": errors}


# ═══════════════════════════════════════════════════════════════════════════
# ПЛАНИРОВЩИК
# ═══════════════════════════════════════════════════════════════════════════

def scheduler_load_all_settings(conn) -> dict:
    cur = conn.cursor()
    cur.execute(f"SELECT key, value FROM {SC}.bot_settings ORDER BY key")
    rows = cur.fetchall()
    cur.close()
    return {r[0]: r[1] for r in rows}


def scheduler_update_setting(conn, key: str, value: str):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SC}.bot_settings (key, value) VALUES (%s,%s) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
        (key, value))
    conn.commit()
    cur.close()


def scheduler_should_run(settings: dict, prefix: str, now: datetime) -> bool:
    if settings.get(f"{prefix}.enabled", "true").lower() != "true":
        return False
    if settings.get(f"{prefix}.schedule_enabled", "true").lower() != "true":
        return False

    target_hour = int(settings.get(f"{prefix}.schedule_hour", "9"))
    raw_days = settings.get(f"{prefix}.schedule_days", "1,2,3,4,5")
    allowed_days = {int(d.strip()) for d in raw_days.split(",") if d.strip().isdigit()}

    yakutsk_offset = 9 * 3600
    local_ts = now.timestamp() + yakutsk_offset
    local_dt = datetime.utcfromtimestamp(local_ts)
    current_hour = local_dt.hour
    current_day = local_dt.isoweekday()

    if current_day not in allowed_days:
        return False
    if current_hour != target_hour:
        return False

    last_run = settings.get(f"{prefix}.last_run_at", "")
    if last_run:
        try:
            last_dt = datetime.fromisoformat(last_run)
            last_local_ts = last_dt.timestamp() + yakutsk_offset
            last_local = datetime.utcfromtimestamp(last_local_ts)
            if last_local.date() == local_dt.date() and last_local.hour == current_hour:
                return False
        except Exception:
            pass
    return True


def run_scheduler(params: dict) -> dict:
    status_only = params.get("status", "0") == "1"

    conn = get_conn()
    settings = scheduler_load_all_settings(conn)
    now = datetime.now(timezone.utc)

    yakutsk_offset = 9 * 3600
    local_ts = now.timestamp() + yakutsk_offset
    local_dt = datetime.utcfromtimestamp(local_ts)

    schedule_info = {
        "current_time_yakutsk": local_dt.strftime("%d.%m.%Y %H:%M"),
        "current_day_of_week": local_dt.isoweekday(),
        "news_bot": {
            "enabled": settings.get("news_bot.enabled", "true") == "true",
            "schedule_enabled": settings.get("news_bot.schedule_enabled", "true") == "true",
            "hour": settings.get("news_bot.schedule_hour", "9"),
            "days": settings.get("news_bot.schedule_days", "1,2,3,4,5"),
            "last_run_at": settings.get("news_bot.last_run_at", ""),
        },
        "video_bot": {
            "enabled": settings.get("video_bot.enabled", "true") == "true",
            "schedule_enabled": settings.get("video_bot.schedule_enabled", "true") == "true",
            "hour": settings.get("video_bot.schedule_hour", "11"),
            "days": settings.get("video_bot.schedule_days", "1,3,5"),
            "last_run_at": settings.get("video_bot.last_run_at", ""),
        },
    }

    if status_only:
        conn.close()
        return {"ok": True, "schedule": schedule_info}

    results = {}

    if scheduler_should_run(settings, "news_bot", now):
        result = run_news_bot({"run": "1"})
        results["news_bot"] = {"triggered": True, "result": result}
        scheduler_update_setting(conn, "news_bot.last_run_at", now.isoformat())
    else:
        results["news_bot"] = {"triggered": False}

    if scheduler_should_run(settings, "video_bot", now):
        result = run_video_bot({"run": "1"})
        results["video_bot"] = {"triggered": True, "result": result}
        scheduler_update_setting(conn, "video_bot.last_run_at", now.isoformat())
    else:
        results["video_bot"] = {"triggered": False}

    conn.close()
    return {"ok": True, "schedule": schedule_info, "results": results}


# ═══════════════════════════════════════════════════════════════════════════
# ГЛАВНЫЙ РОУТЕР
# ═══════════════════════════════════════════════════════════════════════════

def handler(event: dict, context) -> dict:
    """Боты контента: новостной бот, видео-бот, планировщик. Роутинг по ?bot=news|video|scheduler."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    bot = params.get("bot", "scheduler")

    if bot == "news":
        return ok(run_news_bot(params))
    if bot == "video":
        return ok(run_video_bot(params))
    return ok(run_scheduler(params))
