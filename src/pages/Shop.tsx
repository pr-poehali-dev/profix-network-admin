import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Icon from "@/components/ui/icon";
import { shopApi, cart, Category, Product, CartItem } from "@/lib/shop-api";
import SharedFooter from "@/components/SharedFooter";

// ── Карточка товара ───────────────────────────────────────────────────────────

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-200 flex flex-col overflow-hidden group">
      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <Icon name="Package" size={48} className="text-gray-200" />
        }
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 mb-1">{product.category_name || ""}</p>
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 flex-1">{product.name}</h3>
        {product.sku && <p className="text-xs text-gray-400 mb-2">Арт: {product.sku}</p>}

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div>
            {product.price != null
              ? <p className="text-lg font-bold text-gray-900">{product.price.toLocaleString("ru-RU")} <span className="text-sm font-normal">₽</span></p>
              : <p className="text-sm text-gray-400">Цена по запросу</p>
            }
            {product.price_old != null && (
              <p className="text-xs text-gray-400 line-through">{product.price_old.toLocaleString("ru-RU")} ₽</p>
            )}
          </div>
          {!product.in_stock
            ? <span className="text-xs text-red-500 font-medium">Нет в наличии</span>
            : <button
                onClick={handleAdd}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${added ? "bg-green-500 text-white" : "text-white hover:opacity-90"}`}
                style={added ? {} : { background: "#3ca615" }}
              >
                <Icon name={added ? "Check" : "ShoppingCart"} size={14} />
                {added ? "Добавлено" : "В корзину"}
              </button>
          }
        </div>
      </div>
    </div>
  );
}

// ── Боковая корзина ───────────────────────────────────────────────────────────

function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"cart" | "form" | "done">("cart");
  const [form, setForm] = useState({ name: "", phone: "", comment: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function reload() { setItems(cart.get()); }

  useEffect(() => {
    reload();
    window.addEventListener("cart-updated", reload);
    return () => window.removeEventListener("cart-updated", reload);
  }, []);

  useEffect(() => { if (open) reload(); }, [open]);

  function handleQty(id: number, delta: number) {
    const item = items.find(i => i.product.id === id);
    if (!item) return;
    cart.setQty(id, item.qty + delta);
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await shopApi.placeOrder({
        name: form.name,
        phone: form.phone,
        comment: form.comment,
        items: items.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price || 0 })),
      });
      if (res.ok) { cart.clear(); setStep("done"); }
      else setError(res.error || "Ошибка оформления заказа");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  const total = cart.total();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">
            {step === "cart" ? "Корзина" : step === "form" ? "Оформление" : "Заказ принят"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Корзина */}
        {step === "cart" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Icon name="ShoppingCart" size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Корзина пуста</p>
                </div>
              )}
              {items.map(item => (
                <div key={item.product.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                  {item.product.image_url
                    ? <img src={item.product.image_url} alt="" className="w-16 h-16 object-cover rounded-lg shrink-0" />
                    : <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center shrink-0"><Icon name="Package" size={20} className="text-gray-400" /></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.product.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-1">
                      {item.product.price != null ? `${(item.product.price * item.qty).toLocaleString("ru-RU")} ₽` : "—"}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => handleQty(item.product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-400 transition-colors">
                        <Icon name="Minus" size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                      <button onClick={() => handleQty(item.product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-400 transition-colors">
                        <Icon name="Plus" size={12} />
                      </button>
                      <button onClick={() => cart.remove(item.product.id)} className="ml-auto p-1 text-gray-300 hover:text-red-400 transition-colors">
                        <Icon name="Trash2" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-500">Итого:</span>
                  <span className="text-xl font-bold text-gray-900">{total.toLocaleString("ru-RU")} ₽</span>
                </div>
                <button onClick={() => setStep("form")}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                  style={{ background: "#3ca615" }}>
                  Оформить заказ
                </button>
              </div>
            )}
          </>
        )}

        {/* Форма заказа */}
        {step === "form" && (
          <form onSubmit={handleOrder} className="flex flex-col flex-1">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <button type="button" onClick={() => setStep("cart")}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2">
                <Icon name="ChevronLeft" size={16} /> Назад к корзине
              </button>
              <p className="text-sm text-gray-500">Оставьте контакты — мы свяжемся с вами для подтверждения заказа.</p>
              {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ваше имя *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                  placeholder="Иван Иванов"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Телефон *</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required
                  placeholder="+7 (___) ___-__-__" type="tel"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Комментарий</label>
                <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} rows={3}
                  placeholder="Удобное время для звонка, адрес доставки..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" />
              </div>
              {/* Состав заказа */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Состав заказа:</p>
                {items.map(i => (
                  <div key={i.product.id} className="flex justify-between text-xs text-gray-600 py-0.5">
                    <span className="truncate mr-2">{i.product.name} ×{i.qty}</span>
                    <span className="shrink-0 font-medium">{i.product.price != null ? `${(i.product.price * i.qty).toLocaleString("ru-RU")} ₽` : "—"}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t border-gray-200 mt-2 pt-2">
                  <span>Итого</span>
                  <span>{total.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100">
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: "#3ca615" }}>
                {loading ? "Отправка..." : "Отправить заявку"}
              </button>
            </div>
          </form>
        )}

        {/* Успех */}
        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "#edf7e8" }}>
              <Icon name="CheckCircle" size={40} className="text-[#3ca615]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Заказ оформлен!</h3>
            <p className="text-gray-500 text-sm mb-6">Мы свяжемся с вами в ближайшее время для подтверждения.</p>
            <button onClick={() => { setStep("cart"); onClose(); }}
              className="px-8 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: "#3ca615" }}>
              Продолжить покупки
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Главная страница магазина ─────────────────────────────────────────────────

export default function Shop() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(cart.count());

  function reloadCart() { setCartCount(cart.count()); }

  useEffect(() => {
    window.addEventListener("cart-updated", reloadCart);
    return () => window.removeEventListener("cart-updated", reloadCart);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        shopApi.getCategories(),
        shopApi.getProducts({ in_stock: undefined }),
      ]);
      if (cRes.categories) setCategories(cRes.categories);
      if (pRes.products) setProducts(pRes.products);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleAddToCart(p: Product) { cart.add(p); }

  const filtered = products.filter(p => {
    if (!p.is_active) return false;
    if (activeCategory && p.category_slug !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description || "").toLowerCase().includes(search.toLowerCase()) &&
        !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      <Helmet>
        <title>Магазин — ProFiX</title>
        <meta name="description" content="Интернет-магазин ProFiX: кассовое оборудование, сканеры, ПО и расходные материалы" />
      </Helmet>

      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0">
            <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
              alt="ProFiX" className="h-8 w-8 object-contain" />
            <span className="font-bold text-[#0D1B2A] hidden sm:block">ProFiX</span>
          </button>
          <span className="text-gray-300 hidden sm:block">|</span>
          <span className="font-semibold text-gray-700 hidden sm:block">Магазин</span>

          <div className="flex-1 max-w-lg mx-auto">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск товаров..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 bg-gray-50" />
            </div>
          </div>

          <button onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium shrink-0"
            style={{ background: "#3ca615" }}>
            <Icon name="ShoppingCart" size={18} />
            <span className="hidden sm:block">Корзина</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* Сайдбар категорий */}
          <aside className="w-52 shrink-0 hidden md:block">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sticky top-24">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Категории</p>
              <button
                onClick={() => setActiveCategory("")}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${!activeCategory ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                style={!activeCategory ? { background: "#3ca615" } : {}}>
                Все товары
                <span className="ml-1 text-xs opacity-70">({products.filter(p => p.is_active).length})</span>
              </button>
              {categories.map(c => (
                <button key={c.id}
                  onClick={() => setActiveCategory(activeCategory === c.slug ? "" : c.slug)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeCategory === c.slug ? "text-white" : "text-gray-600 hover:bg-gray-50"}`}
                  style={activeCategory === c.slug ? { background: "#3ca615" } : {}}>
                  {c.name}
                  <span className="ml-1 text-xs opacity-60">({c.product_count || 0})</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Основной контент */}
          <div className="flex-1 min-w-0">
            {/* Мобильные категории */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
              <button onClick={() => setActiveCategory("")}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${!activeCategory ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
                style={!activeCategory ? { background: "#3ca615" } : {}}>
                Все
              </button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setActiveCategory(activeCategory === c.slug ? "" : c.slug)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${activeCategory === c.slug ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
                  style={activeCategory === c.slug ? { background: "#3ca615" } : {}}>
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{loading ? "Загрузка..." : `${filtered.length} товаров`}</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm aspect-square animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
                <Icon name="Package" size={48} className="mx-auto mb-3 text-gray-200" />
                <p className="text-gray-400">Товары не найдены</p>
                {search && <button onClick={() => setSearch("")} className="mt-3 text-sm underline" style={{ color: "#3ca615" }}>Сбросить поиск</button>}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <SharedFooter />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
