const SHOP_URL = "https://functions.poehali.dev/5fbf0da4-59e1-4a4d-b9d1-c44efe46c9b7";

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  product_count?: number;
}

export interface ProductImage {
  id: number;
  image_url: string;
  sort_order: number;
}

export interface ProductReview {
  id: number;
  author_name: string;
  rating: number;
  text?: string;
  is_published: boolean;
  created_at: string;
}

export interface Product {
  id: number;
  category_id?: number;
  category_name?: string;
  category_slug?: string;
  name: string;
  description?: string;
  price?: number;
  price_old?: number;
  sku?: string;
  in_stock: boolean;
  is_active: boolean;
  image_url?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  reviews?: ProductReview[];
  rating_avg?: number;
  rating_count?: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}

function authHeader() {
  const token = localStorage.getItem("crm_manager_token");
  return token ? { "Authorization": token } : {};
}

async function req(type: string, method = "GET", body?: object, extra?: Record<string, string>) {
  const url = new URL(SHOP_URL);
  url.searchParams.set("type", type);
  if (extra) Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const shopApi = {
  // Категории
  getCategories: () => req("categories"),
  createCategory: (data: Partial<Category>) => req("categories", "POST", data),
  updateCategory: (data: Partial<Category>) => req("categories", "PUT", data),
  deleteCategory: (id: number) => req("categories", "DELETE", { id }),

  // Товары
  getProducts: (params?: { category?: string; search?: string; in_stock?: string; admin?: string; limit?: number; offset?: number }) => {
    const extra: Record<string, string> = {};
    if (params?.category) extra.category = params.category;
    if (params?.search) extra.search = params.search;
    if (params?.in_stock) extra.in_stock = params.in_stock;
    if (params?.admin) extra.admin = params.admin;
    if (params?.limit) extra.limit = String(params.limit);
    if (params?.offset) extra.offset = String(params.offset);
    return req("products", "GET", undefined, extra);
  },
  getProduct: (id: number) => req("products", "GET", undefined, { id: String(id) }),
  createProduct: (data: object) => req("products", "POST", data),
  updateProduct: (data: object) => req("products", "PUT", data),
  deleteProduct: (id: number) => req("products", "DELETE", { id }),
  importCsv: (csvBase64: string) => req("products", "POST", { action: "import_csv", csv_data: csvBase64 }),

  // Заказ
  placeOrder: (data: { name: string; phone: string; comment?: string; items: { name: string; qty: number; price: number }[] }) =>
    req("order", "POST", data),

  // Доп. фото
  getImages: (productId: number) => req("images", "GET", undefined, { product_id: String(productId) }),
  uploadImage: (productId: number, imageB64: string, imageType: string) =>
    req("images", "POST", { product_id: productId, image_b64: imageB64, image_type: imageType }),
  deleteImage: (id: number) => req("images", "DELETE", { id }),

  // Отзывы
  getReviews: (productId: number, admin = false) =>
    req("reviews", "GET", undefined, { product_id: String(productId), ...(admin ? { admin: "1" } : {}) }),
  addReview: (data: { product_id: number; author_name: string; rating: number; text: string }) =>
    req("reviews", "POST", data),
  publishReview: (id: number, isPublished: boolean) => req("reviews", "PUT", { id, is_published: isPublished }),
  deleteReview: (id: number) => req("reviews", "DELETE", { id }),
};

// ── Корзина (localStorage) ────────────────────────────────────────────────────

const CART_KEY = "profix_cart";

export const cart = {
  get(): CartItem[] {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch { return []; }
  },
  save(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("cart-updated"));
  },
  add(product: Product, qty = 1) {
    const items = cart.get();
    const idx = items.findIndex(i => i.product.id === product.id);
    if (idx >= 0) items[idx].qty += qty;
    else items.push({ product, qty });
    cart.save(items);
  },
  remove(productId: number) {
    cart.save(cart.get().filter(i => i.product.id !== productId));
  },
  setQty(productId: number, qty: number) {
    if (qty <= 0) { cart.remove(productId); return; }
    const items = cart.get();
    const idx = items.findIndex(i => i.product.id === productId);
    if (idx >= 0) { items[idx].qty = qty; cart.save(items); }
  },
  clear() { cart.save([]); },
  count(): number { return cart.get().reduce((s, i) => s + i.qty, 0); },
  total(): number { return cart.get().reduce((s, i) => s + (i.product.price || 0) * i.qty, 0); },
};