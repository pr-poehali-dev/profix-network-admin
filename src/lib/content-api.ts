const CONTENT_URL = "https://functions.poehali.dev/6c2255f1-c5fa-43e0-826e-f5e68a052c3a";

type ContentMap = Record<string, string>;

// Кэш в памяти + дедупликация одновременных запросов.
// Решает проблему десятков параллельных запросов при загрузке страницы.
let _cache: ContentMap | null = null;
let _inflight: Promise<ContentMap> | null = null;
let _cacheTime = 0;
const CACHE_TTL = 60 * 1000; // 60 секунд

export async function fetchContent(): Promise<ContentMap> {
  // Свежий кэш — отдаём сразу, без запроса
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;
  // Запрос уже летит — ждём его, не плодим дубли
  if (_inflight) return _inflight;

  _inflight = (async () => {
    try {
      const res = await fetch(CONTENT_URL);
      const d = await res.json();
      _cache = d.content || {};
      _cacheTime = Date.now();
      return _cache;
    } catch {
      return _cache || {};
    } finally {
      _inflight = null;
    }
  })();
  return _inflight;
}

export function invalidateContent() { _cache = null; _cacheTime = 0; }

export async function saveContent(updates: Record<string, unknown>): Promise<boolean> {
  const token = localStorage.getItem("crm_manager_token") || "";
  const res = await fetch(CONTENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": token },
    body: JSON.stringify({ updates }),
  });
  const data = await res.json();
  if (data.ok) invalidateContent();
  return !!data.ok;
}

export async function uploadContentImage(b64: string, type: string): Promise<string> {
  const token = localStorage.getItem("crm_manager_token") || "";
  const res = await fetch(CONTENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": token },
    body: JSON.stringify({ action: "upload_image", image_b64: b64, image_type: type }),
  });
  const data = await res.json();
  if (!data.url && data.error) throw new Error(data.error);
  return data.url || "";
}

// ── Bot settings ─────────────────────────────────────────────────────────────
export async function fetchBotSettings(): Promise<Record<string, string>> {
  const token = localStorage.getItem("crm_manager_token") || "";
  try {
    const res = await fetch(CONTENT_URL + "?resource=bot_settings", {
      headers: { "Authorization": token },
    });
    const d = await res.json();
    return d.settings || {};
  } catch { return {}; }
}

export async function saveBotSettings(updates: Record<string, string>): Promise<boolean> {
  const token = localStorage.getItem("crm_manager_token") || "";
  const res = await fetch(CONTENT_URL + "?resource=bot_settings", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": token },
    body: JSON.stringify({ updates }),
  });
  const d = await res.json();
  return !!d.ok;
}

// Хелперы для парсинга значений
export function getString(content: ContentMap, key: string, fallback = ""): string {
  return content[key] ?? fallback;
}

export function getJson<T>(content: ContentMap, key: string, fallback: T): T {
  try { return content[key] ? JSON.parse(content[key]) : fallback; }
  catch { return fallback; }
}