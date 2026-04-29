import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Icon from "@/components/ui/icon";
import { shopApi, cart, Category, Product } from "@/lib/shop-api";
import SharedFooter from "@/components/SharedFooter";
import CartDrawer from "@/components/CartDrawer";

// ── Карточка товара ───────────────────────────────────────────────────────────

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div
      onClick={() => navigate(`/shop/${product.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-200 flex flex-col overflow-hidden group cursor-pointer h-full"
    >
      {/* Фото — фиксированная высота */}
      <div className="h-44 sm:h-48 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
          : <Icon name="Package" size={48} className="text-gray-200" />
        }
        {product.price_old && product.price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            -{Math.round((1 - product.price / product.price_old) * 100)}%
          </div>
        )}
      </div>
      {/* Контент — фиксированная структура */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 truncate">{product.category_name || ""}</p>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug" style={{ minHeight: "2.5rem" }}>{product.name}</h3>
        <div className="mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-end justify-between gap-1">
            <div>
              {product.price != null
                ? <p className="text-base font-bold text-gray-900 leading-none">{product.price.toLocaleString("ru-RU")} <span className="text-xs font-normal text-gray-500">₽</span></p>
                : <p className="text-xs text-gray-400">Цена по запросу</p>
              }
              {product.price_old != null && (
                <p className="text-[10px] text-gray-400 line-through mt-0.5">{product.price_old.toLocaleString("ru-RU")} ₽</p>
              )}
            </div>
            {!product.in_stock
              ? <span className="text-[10px] text-red-500 font-medium shrink-0">Нет</span>
              : <button
                  onClick={handleAdd}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${added ? "bg-green-500 text-white" : "text-white hover:opacity-90"}`}
                  style={added ? {} : { background: "#3ca615" }}
                >
                  <Icon name={added ? "Check" : "ShoppingCart"} size={12} />
                  {added ? "OK" : "В корзину"}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
                {filtered.map(p => (
                  <div key={p.id} className="relative">
                    <ProductCard product={p} onAddToCart={handleAddToCart} />
                  </div>
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