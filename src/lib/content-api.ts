const CONTENT_URL = "https://functions.poehali.dev/c21176bb-34b5-4c32-aa88-89ebe97868ce";

type ContentMap = Record<string, string>;

// Без кэша — всегда свежий контент
export async function fetchContent(): Promise<ContentMap> {
  try {
    const res = await fetch(`${CONTENT_URL}?t=${Date.now()}`);
    const d = await res.json();
    return d.content || {};
  } catch {
    return {};
  }
}

export function invalidateContent() { /* no-op */ }

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
  return data.url || "";
}

// Хелперы для парсинга значений
export function getString(content: ContentMap, key: string, fallback = ""): string {
  return content[key] ?? fallback;
}

export function getJson<T>(content: ContentMap, key: string, fallback: T): T {
  try { return content[key] ? JSON.parse(content[key]) : fallback; }
  catch { return fallback; }
}