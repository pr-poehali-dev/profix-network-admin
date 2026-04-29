const PAGES_URL = "https://functions.poehali.dev/2a645545-8532-4126-ac23-39b9b70e19bc";

function authHeader() {
  const token = localStorage.getItem("crm_manager_token") || "";
  return token ? { "Authorization": token } : {};
}

// ── Типы блоков ───────────────────────────────────────────────────────────────

export type BlockType =
  | "hero"       // Шапка с фоном, заголовком, кнопками
  | "text"       // Текстовый блок с заголовком
  | "cards"      // Сетка карточек (иконка/фото + заголовок + текст)
  | "image"      // Одно изображение на всю ширину или в колонку
  | "two_cols"   // Два столбца: текст + изображение
  | "stats"      // Строка со статистикой (число + подпись)
  | "cta"        // Call-to-action с кнопкой
  | "contacts";  // Контактный блок

export interface HeroBlock {
  type: "hero";
  title: string;
  subtitle?: string;
  bg_color?: string;
  text_color?: string;
  image_url?: string;
  btn1_text?: string;
  btn1_link?: string;
  btn2_text?: string;
  btn2_link?: string;
  badge?: string;
}

export interface TextBlock {
  type: "text";
  title?: string;
  body: string;
  align?: "left" | "center";
}

export interface Card {
  icon?: string;
  image_url?: string;
  title: string;
  text?: string;
  price?: string;
  badge?: string;
  link?: string;
}

export interface CardsBlock {
  type: "cards";
  title?: string;
  subtitle?: string;
  cols?: 2 | 3 | 4;
  accent_color?: string;
  items: Card[];
}

export interface ImageBlock {
  type: "image";
  url: string;
  alt?: string;
  caption?: string;
  size?: "full" | "wide" | "medium";
}

export interface TwoColsBlock {
  type: "two_cols";
  title?: string;
  text: string;
  image_url?: string;
  image_position?: "left" | "right";
  features?: string[];
}

export interface StatsBlock {
  type: "stats";
  title?: string;
  accent_color?: string;
  items: { value: string; label: string }[];
}

export interface CtaBlock {
  type: "cta";
  title: string;
  text?: string;
  btn_text: string;
  btn_link: string;
  bg_color?: string;
}

export interface ContactsBlock {
  type: "contacts";
  title?: string;
}

export type PageBlock =
  | HeroBlock | TextBlock | CardsBlock | ImageBlock
  | TwoColsBlock | StatsBlock | CtaBlock | ContactsBlock;

export interface CustomPage {
  id: number;
  slug: string;
  title: string;
  meta_desc?: string;
  accent_color?: string;
  blocks: PageBlock[];
  is_published: boolean;
  show_in_nav: boolean;
  nav_label?: string;
  created_at: string;
  updated_at: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

async function req(method: string, params?: Record<string,string>, body?: object) {
  const url = new URL(PAGES_URL);
  if (params) Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const pagesApi = {
  list: (admin = false) => req("GET", admin ? { admin: "1" } : {}),
  get: (slug: string, admin = false) => req("GET", admin ? { slug, admin: "1" } : { slug }),
  create: (data: Partial<CustomPage>) => req("POST", undefined, data),
  update: (data: Partial<CustomPage> & { id: number }) => req("PUT", undefined, data),
  remove: (id: number) => req("DELETE", undefined, { id }),
  uploadImage: (b64: string, type: string) =>
    req("POST", undefined, { action: "upload_image", image_b64: b64, image_type: type }),
};
