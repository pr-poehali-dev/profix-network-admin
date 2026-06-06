"""
Планировщик ботов ПРОФИКС.
Проверяет расписание из bot_settings и запускает нужных ботов.
Вызывается каждые ~60 минут пингом из admin-панели или внешним сервисом.
GET / — проверить и запустить по расписанию
GET /?status=1 — показать текущее расписание и статус без запуска
"""
import json
import os
import urllib.request
import psycopg2
from datetime import datetime, timezone

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Authorization",
}

# Импортируем URL ботов из переменных окружения (задаются через bot_settings или env)
NEWS_BOT_URL = os.environ.get("NEWS_BOT_URL", "")
VIDEO_BOT_URL = os.environ.get("VIDEO_BOT_URL", "")


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"},
            "body": json.dumps(data, ensure_ascii=False, default=str)}


def load_all_settings(conn) -> dict:
    cur = conn.cursor()
    cur.execute(f"SELECT key, value FROM {SC}.bot_settings ORDER BY key")
    rows = cur.fetchall()
    cur.close()
    return {r[0]: r[1] for r in rows}


def update_setting(conn, key: str, value: str):
    cur = conn.cursor()
    cur.execute(
        f"INSERT INTO {SC}.bot_settings (key, value) VALUES (%s,%s) "
        f"ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value",
        (key, value)
    )
    conn.commit()
    cur.close()


def call_bot(url: str) -> dict:
    """Синхронный HTTP-вызов бота с ?run=1."""
    if not url:
        return {"error": "URL не задан"}
    try:
        req = urllib.request.Request(
            url + "?run=1",
            headers={"User-Agent": "ProFiXScheduler/1.0"},
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=25) as r:
            body = r.read().decode("utf-8", errors="ignore")
            return json.loads(body)
    except Exception as e:
        return {"error": str(e)}


def should_run(settings: dict, prefix: str, now: datetime) -> bool:
    """Проверяет, нужно ли запускать бота сейчас."""
    if settings.get(f"{prefix}.enabled", "true").lower() != "true":
        return False
    if settings.get(f"{prefix}.schedule_enabled", "true").lower() != "true":
        return False

    # Час запуска (UTC+9 Якутск)
    target_hour = int(settings.get(f"{prefix}.schedule_hour", "9"))
    # Дни недели: 1=пн, 2=вт, ..., 7=вс (isoweekday)
    raw_days = settings.get(f"{prefix}.schedule_days", "1,2,3,4,5")
    allowed_days = {int(d.strip()) for d in raw_days.split(",") if d.strip().isdigit()}

    # Время в зоне UTC+9 (Якутск)
    yakutsk_offset = 9 * 3600
    local_ts = now.timestamp() + yakutsk_offset
    local_dt = datetime.utcfromtimestamp(local_ts)
    current_hour = local_dt.hour
    current_day = local_dt.isoweekday()  # 1=пн ... 7=вс

    if current_day not in allowed_days:
        return False
    if current_hour != target_hour:
        return False

    # Проверяем last_run_at — не запускали ли уже сегодня в этот час
    last_run = settings.get(f"{prefix}.last_run_at", "")
    if last_run:
        try:
            last_dt = datetime.fromisoformat(last_run)
            # Переводим last_run в якутское время
            last_local_ts = last_dt.timestamp() + yakutsk_offset
            last_local = datetime.utcfromtimestamp(last_local_ts)
            if (last_local.date() == local_dt.date() and
                    last_local.hour == current_hour):
                return False  # уже запускали в этот час сегодня
        except Exception:
            pass

    return True


def handler(event: dict, context) -> dict:
    """Планировщик: проверяет расписание и запускает ботов вовремя."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    params = event.get("queryStringParameters") or {}
    status_only = params.get("status", "0") == "1"

    conn = get_conn()
    settings = load_all_settings(conn)

    # URL ботов берём из func2url (сохранены в bot_settings при деплое)
    news_url = settings.get("scheduler.news_bot_url", NEWS_BOT_URL)
    video_url = settings.get("scheduler.video_bot_url", VIDEO_BOT_URL)

    now = datetime.now(timezone.utc)

    # Якутское время для отображения
    yakutsk_offset = 9 * 3600
    local_ts = now.timestamp() + yakutsk_offset
    local_dt = datetime.utcfromtimestamp(local_ts)

    schedule_info = {
        "current_time_yakutsk": local_dt.strftime("%d.%m.%Y %H:%M"),
        "current_day_of_week": local_dt.isoweekday(),
        "news_bot": {
            "enabled":          settings.get("news_bot.enabled", "true") == "true",
            "schedule_enabled": settings.get("news_bot.schedule_enabled", "true") == "true",
            "hour":             settings.get("news_bot.schedule_hour", "9"),
            "days":             settings.get("news_bot.schedule_days", "1,2,3,4,5"),
            "last_run_at":      settings.get("news_bot.last_run_at", ""),
        },
        "video_bot": {
            "enabled":          settings.get("video_bot.enabled", "true") == "true",
            "schedule_enabled": settings.get("video_bot.schedule_enabled", "true") == "true",
            "hour":             settings.get("video_bot.schedule_hour", "11"),
            "days":             settings.get("video_bot.schedule_days", "1,3,5"),
            "last_run_at":      settings.get("video_bot.last_run_at", ""),
        },
    }

    if status_only:
        conn.close()
        return ok({"ok": True, "schedule": schedule_info})

    results = {}

    # ── Новостной бот ─────────────────────────────────────────────────────────
    if should_run(settings, "news_bot", now):
        result = call_bot(news_url)
        results["news_bot"] = {"triggered": True, "result": result}
        update_setting(conn, "news_bot.last_run_at", now.isoformat())
    else:
        results["news_bot"] = {"triggered": False}

    # ── Видео-бот ─────────────────────────────────────────────────────────────
    if should_run(settings, "video_bot", now):
        result = call_bot(video_url)
        results["video_bot"] = {"triggered": True, "result": result}
        update_setting(conn, "video_bot.last_run_at", now.isoformat())
    else:
        results["video_bot"] = {"triggered": False}

    conn.close()
    return ok({"ok": True, "schedule": schedule_info, "results": results})
