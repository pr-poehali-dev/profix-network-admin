const BLOG_URL = "https://functions.poehali.dev/b8a623ee-7434-4b23-bf72-748d4f2582f8";

function authHeader() {
  const token = localStorage.getItem("crm_manager_token");
  return token ? { "Authorization": token } : {};
}

function getSessionId(): string {
  let id = localStorage.getItem("profix_session");
  if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("profix_session", id); }
  return id;
}

async function req(resource: string, method = "GET", body?: object, extra?: Record<string, string>) {
  const url = new URL(BLOG_URL);
  url.searchParams.set("resource", resource);
  if (extra) Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
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
}

export interface Comment {
  id: number;
  author_name: string;
  text: string;
  created_at: string;
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

  addComment: (postId: number, text: string, authorName: string, clientId?: number) =>
    req("comments", "POST", {
      post_id: postId,
      text,
      author_name: authorName,
      client_id: clientId,
    }),

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
