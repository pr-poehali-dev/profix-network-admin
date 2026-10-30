// Публичные GET-запросы для loader'ов маршрутов (работают и на сервере, и в браузере).
// Без localStorage и без модульных кэшей.
// Результат: объект — найден; null — сервер ответил, что записи нет; undefined — сбой запроса.
import type { Product } from "@/lib/shop-api";
import type { Post } from "@/lib/blog-api";
import type { CustomPage } from "@/lib/pages-api";

const SHOP_URL = "https://functions.poehali.dev/af797564-9d5c-44c8-ad16-72d5be9bdedf";
const BLOG_URL = "https://functions.poehali.dev/8e78593d-eec2-43e8-9176-c5ca7d3712ca";
const PAGES_URL = "https://functions.poehali.dev/21b48158-a13f-47cd-86a7-475df63bc60e";

async function getJson(url: URL): Promise<{ status: number; data: Record<string, unknown> | null } | undefined> {
  try {
    const res = await fetch(url.toString(), { headers: { "Content-Type": "application/json" } });
    let data: Record<string, unknown> | null = null;
    try { data = (await res.json()) as Record<string, unknown>; } catch { data = null; }
    return { status: res.status, data };
  } catch {
    return undefined;
  }
}

function pick<T>(r: Awaited<ReturnType<typeof getJson>>, key: string): T | null | undefined {
  if (!r) return undefined;
  const item = r.data?.[key] as T | undefined;
  if (item) return item;
  // Только явный ответ «не найдено» считаем отсутствием записи
  if (r.status === 404 || (r.status === 200 && r.data && !r.data.error)) return null;
  return undefined;
}

export async function fetchPublicProduct(id: string): Promise<Product | null | undefined> {
  const url = new URL(SHOP_URL);
  url.searchParams.set("type", "products");
  url.searchParams.set("id", id);
  return pick<Product>(await getJson(url), "product");
}

export async function fetchPublicPost(id: string): Promise<Post | null | undefined> {
  const url = new URL(BLOG_URL);
  url.searchParams.set("resource", "posts");
  url.searchParams.set("id", id);
  return pick<Post>(await getJson(url), "post");
}

export async function fetchPublicPage(slug: string): Promise<CustomPage | null | undefined> {
  const url = new URL(PAGES_URL);
  url.searchParams.set("slug", slug);
  return pick<CustomPage>(await getJson(url), "page");
}
