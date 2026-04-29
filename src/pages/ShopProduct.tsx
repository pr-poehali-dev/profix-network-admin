import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Icon from "@/components/ui/icon";
import { shopApi, cart, Product, ProductReview } from "@/lib/shop-api";
import CartDrawer from "@/components/CartDrawer";
import SharedFooter from "@/components/SharedFooter";

function Stars({ value, max = 5, size = 18, interactive = false, onChange }: {
  value: number; max?: number; size?: number; interactive?: boolean; onChange?: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => i + 1).map(i => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Icon
            name="Star"
            size={size}
            className={(hover || value) >= i ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onDone }: { productId: number; onDone: () => void }) {
  const [form, setForm] = useState({ author_name: "", rating: 5, text: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await shopApi.addReview({ product_id: productId, ...form });
    setLoading(false);
    if (res.ok) { setDone(true); onDone(); }
  }

  if (done) return (
    <div className="bg-green-50 border border-green-100 rounded-2xl p-5 text-center">
      <Icon name="CheckCircle" size={32} className="text-green-500 mx-auto mb-2" />
      <p className="font-semibold text-green-800">Спасибо за отзыв!</p>
      <p className="text-sm text-green-600 mt-1">Он появится после проверки модератором.</p>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl p-5 space-y-4">
      <h4 className="font-semibold text-gray-900">Оставить отзыв</h4>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Ваша оценка *</label>
        <Stars value={form.rating} interactive onChange={v => setForm(p => ({ ...p, rating: v }))} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Ваше имя *</label>
        <input value={form.author_name} onChange={e => setForm(p => ({ ...p, author_name: e.target.value }))} required
          placeholder="Иван И."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 bg-white" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Комментарий</label>
        <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} rows={3}
          placeholder="Поделитесь впечатлениями о товаре..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 bg-white resize-none" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: "#3ca615" }}>
        {loading ? "Отправка..." : "Отправить отзыв"}
      </button>
    </form>
  );
}

export default function ShopProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(cart.count());
  const [added, setAdded] = useState(false);

  function reloadCart() { setCartCount(cart.count()); }
  useEffect(() => {
    window.addEventListener("cart-updated", reloadCart);
    return () => window.removeEventListener("cart-updated", reloadCart);
  }, []);

  async function load() {
    if (!id) return;
    setLoading(true);
    const res = await shopApi.getProduct(Number(id));
    if (res.product) setProduct(res.product);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  function handleAddToCart() {
    if (!product) return;
    cart.add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] gap-4">
      <Icon name="Package" size={48} className="text-gray-300" />
      <p className="text-gray-500">Товар не найден</p>
      <button onClick={() => navigate("/shop")} className="text-sm underline" style={{ color: "#3ca615" }}>В магазин</button>
    </div>
  );

  const allImages = [
    ...(product.image_url ? [{ id: 0, image_url: product.image_url }] : []),
    ...(product.images || []),
  ];

  const reviews: ProductReview[] = product.reviews || [];
  const discount = product.price_old && product.price
    ? Math.round((1 - product.price / product.price_old) * 100)
    : null;

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      <Helmet>
        <title>{product.name} — ProFiX</title>
        <meta name="description" content={product.description?.slice(0, 160) || product.name} />
      </Helmet>

      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="shrink-0">
            <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
              alt="ProFiX" className="h-8 w-8 object-contain" />
          </button>
          <button onClick={() => navigate("/shop")}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <Icon name="ChevronLeft" size={16} />
            Магазин
          </button>
          {product.category_name && (
            <>
              <Icon name="ChevronRight" size={14} className="text-gray-300" />
              <span className="text-sm text-gray-400 truncate hidden sm:block">{product.category_name}</span>
            </>
          )}
          <div className="ml-auto">
            <button onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
              style={{ background: "#3ca615" }}>
              <Icon name="ShoppingCart" size={16} />
              <span className="hidden sm:block">Корзина</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden aspect-square flex items-center justify-center mb-3">
              {allImages.length > 0
                ? <img src={allImages[activeImg]?.image_url} alt={product.name} className="w-full h-full object-contain p-4" />
                : <Icon name="Package" size={80} className="text-gray-200" />
              }
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button key={img.id} onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-colors ${activeImg === i ? "border-green-400" : "border-gray-100 hover:border-gray-300"}`}>
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {product.category_name && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{product.category_name}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h1>
            {(product.rating_count || 0) > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Stars value={Math.round(product.rating_avg || 0)} size={16} />
                <span className="text-sm text-gray-500">{product.rating_avg} ({product.rating_count} отз.)</span>
              </div>
            )}
            {product.sku && <p className="text-xs text-gray-400 mb-4">Артикул: {product.sku}</p>}
            <div className="flex items-end gap-3 mb-4">
              {product.price != null
                ? <p className="text-3xl font-bold text-gray-900">{product.price.toLocaleString("ru-RU")} ₽</p>
                : <p className="text-lg text-gray-400">Цена по запросу</p>
              }
              {product.price_old != null && (
                <p className="text-lg text-gray-400 line-through mb-0.5">{product.price_old.toLocaleString("ru-RU")} ₽</p>
              )}
              {discount && (
                <span className="mb-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-6">
              <div className={`w-2 h-2 rounded-full ${product.in_stock ? "bg-green-500" : "bg-red-400"}`} />
              <span className={`text-sm font-medium ${product.in_stock ? "text-green-700" : "text-red-500"}`}>
                {product.in_stock ? "В наличии" : "Нет в наличии"}
              </span>
            </div>
            <div className="flex gap-3 mt-auto">
              {product.in_stock && (
                <button onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${added ? "bg-green-500 text-white" : "text-white hover:opacity-90"}`}
                  style={added ? {} : { background: "#3ca615" }}>
                  <Icon name={added ? "Check" : "ShoppingCart"} size={18} />
                  {added ? "Добавлено!" : "В корзину"}
                </button>
              )}
              {added && (
                <button onClick={() => setCartOpen(true)}
                  className="px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors"
                  style={{ borderColor: "#3ca615", color: "#3ca615" }}>
                  Перейти
                </button>
              )}
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
              <p className="text-xs text-gray-500 mb-2">Есть вопросы по товару?</p>
              <a href="tel:+79142727187" className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-green-600 transition-colors">
                <Icon name="Phone" size={16} className="text-green-500" />
                +7 (914) 272-71-87
              </a>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Описание</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg text-gray-900">
              Отзывы {reviews.length > 0 && <span className="text-gray-400 font-normal text-base">({reviews.length})</span>}
            </h2>
            {(product.rating_count || 0) > 0 && (
              <div className="flex items-center gap-2">
                <Stars value={Math.round(product.rating_avg || 0)} size={20} />
                <span className="text-2xl font-bold text-gray-900">{product.rating_avg}</span>
              </div>
            )}
          </div>
          {reviews.length === 0 && <p className="text-gray-400 text-sm mb-6">Пока нет отзывов. Будьте первым!</p>}
          <div className="space-y-4 mb-6">
            {reviews.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{r.author_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <Stars value={r.rating} size={14} />
                </div>
                {r.text && <p className="text-sm text-gray-600 leading-relaxed">{r.text}</p>}
              </div>
            ))}
          </div>
          <ReviewForm productId={product.id} onDone={load} />
        </div>
      </div>

      <SharedFooter />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
