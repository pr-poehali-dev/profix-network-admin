const BLOG_URL = "https://functions.poehali.dev/8e78593d-eec2-43e8-9176-c5ca7d3712ca";

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("crm_manager_token");
  return token ? { "Authorization": token } : {};
}

function clientAuthHeader(): Record<string, string> {
  // Приоритет: клиент → менеджер → техник
  const clientToken = localStorage.getItem("crm_client_token");
  if (clientToken) return { "X-Authorization": `Bearer ${clientToken}` };
  const managerToken = localStorage.getItem("crm_manager_token");
  if (managerToken) return { "X-Authorization": `Bearer ${managerToken}` };
  const techToken = localStorage.getItem("crm_tech_token");
  if (techToken) return { "X-Authorization": `Bearer ${techToken}` };
  return {};
}

function getSessionId(): string {
  let id = localStorage.getItem("profix_session");
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("profix_session", id); }
  return id;
}

// Лента новостей меняется редко — кэшируем на 3 минуты и склеиваем
// одновременные запросы, чтобы не дёргать сервер при каждом переходе.
const CACHE_TTL = 3 * 60 * 1000;
const _cache = new Map<string, { at: number; data: unknown }>();
const _inflight = new Map<string, Promise<unknown>>();

export function invalidateBlogCache() {
  _cache.clear();
  _inflight.clear();
}

async function req(resource: string, method = "GET", body?: object, extra?: Record<string, string>, useClientAuth = false) {
  const url = new URL(BLOG_URL);
  url.searchParams.set("resource", resource);
  if (extra) Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  const key = url.toString();

  // Кэшируем только публичные списки постов (не админку и не детали с комментариями)
  const cacheable = method === "GET" && resource === "posts" && !extra?.id;

  if (cacheable) {
    const hit = _cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;
    const flying = _inflight.get(key);
    if (flying) return flying;
  }

  const run = (async () => {
    const res = await fetch(key, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(useClientAuth ? clientAuthHeader() : authHeader()),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (cacheable) _cache.set(key, { at: Date.now(), data });
    return data;
  })();

  if (cacheable) {
    _inflight.set(key, run);
    try { return await run; } finally { _inflight.delete(key); }
  }
  if (method !== "GET") invalidateBlogCache();
  return run;
}

export interface Post {
  id: number;
  type: "news" | "article" | "video" | "forum";
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  cover_url?: string;
  video_url?: string;
  author_name?: string;
  tags?: string;
  views: number;
  created_at: string;
  comment_count?: number;
  comments?: Comment[];
  reactions?: Record<string, number>;
  is_published?: boolean;
  comments_mode?: "open" | "users" | "closed";
}

export interface Comment {
  id: number;
  author_name: string;
  text: string;
  created_at: string;
  edited_by?: string | null;
  is_hidden?: boolean;
  hidden_by?: string | null;
}

export const blogApi = {
  getPosts: (type?: string, limit = 20, offset = 0) =>
    req("posts", "GET", undefined, {
      ...(type ? { type } : {}),
      limit: String(limit),
      offset: String(offset),
    }),

  getPost: (id: number) => req("posts", "GET", undefined, { id: String(id) }),

  createPost: (data: Partial<Post>) => req("posts", "POST", data),
  updatePost: (data: Partial<Post> & { id: number }) => req("posts", "PUT", data),
  deletePost: (id: number) => req("posts", "DELETE", { id }),

  addComment: (postId: number, text: string) =>
    req("comments", "POST", { post_id: postId, text }, undefined, true),

  updateComment: (commentId: number, text: string) =>
    req("comments", "PUT", { id: commentId, text }, undefined, true),

  removeComment: (commentId: number) =>
    req("comments", "DELETE", { id: commentId }, undefined, true),

  react: (postId: number | null, reaction: "like" | "dislike", commentId?: number) =>
    req("reactions", "POST", {
      post_id: postId || undefined,
      comment_id: commentId || undefined,
      reaction,
      session_id: getSessionId(),
    }),

  getAdminPosts: () => req("admin_posts", "GET"),

  getSessionId,
};