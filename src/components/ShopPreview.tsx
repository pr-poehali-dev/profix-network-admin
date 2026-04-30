import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { shopApi, cart, Product } from "@/lib/shop-api";
import CartDrawer from "@/components/CartDrawer";

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    cart.add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div
      onClick={() => navigate(`/shop/${product.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200 transition-all duration-200 flex flex-col overflow-hidden group h-full cursor-pointer"
    >
      <div className="relative h-44 sm:h-48 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
        {product.image_url
          ? <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300" />
          : <Icon name="Package" size={44} className="text-gray-200" />
        }
        {product.price_old && product.price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            -{Math.round((1 - product.price / product.price_old) * 100)}%
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {product.category_name && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1 truncate">{product.category_name}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 flex-1 leading-snug" style={{ minHeight: "2.5rem" }}>{product.name}</h3>
        <div className="mt-auto pt-2 border-t border-gray-50">
          <div className="flex flex-col gap-2">
            <div>
              {product.price != null
                ? <p className="text-base font-bold text-gray-900 leading-none">{product.price.toLocaleString("ru-RU")} <span className="text-xs font-normal text-gray-500">₽</span></p>
                : <p className="text-xs text-gray-400">По запросу</p>
              }
              {product.price_old != null && (
                <p className="text-[10px] text-gray-400 line-through mt-0.5">{product.price_old.toLocaleString("ru-RU")} ₽</p>
              )}
            </div>
            {!product.in_stock
              ? <span className="text-[10px] text-red-500 font-medium">Нет в наличии</span>
              : <button
                  onClick={handleAdd}
                  className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${added ? "bg-green-500 text-white" : "text-white hover:opacity-90"}`}
                  style={added ? {} : { background: "#3ca615" }}
                >
                  <Icon name={added ? "Check" : "ShoppingCart"} size={13} />
                  {added ? "Добавлено!" : "В корзину"}
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPreview() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(cart.count());

  useEffect(() => {
    const reload = () => setCartCount(cart.count());
    window.addEventListener("cart-updated", reload);
    return () => window.removeEventListener("cart-updated", reload);
  }, []);

  useEffect(() => {
    shopApi.getProducts({ limit: 8 }).then(res => {
      if (res.products) setProducts(res.products.filter((p: Product) => p.is_active && p.in_stock).slice(0, 8));
    }).finally(() => setLoading(false));
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="bg-[#F7F9FC] py-16 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Заголовок */}
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#3ca615] mb-2">Интернет-магазин</p>
            <h2 className="font-oswald text-3xl font-bold text-[#0D1B2A]">ПОПУЛЯРНЫЕ ТОВАРЫ</h2>
          </div>
          <div className="flex items-center gap-3">
            {cartCount > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#3ca615] text-[#3ca615] text-sm font-semibold hover:bg-[#3ca615] hover:text-white transition-all"
              >
                <Icon name="ShoppingCart" size={16} />
                Корзина
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              </button>
            )}
            <button
              onClick={() => navigate("/shop")}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:border-[#3ca615] hover:text-[#3ca615] transition-all"
            >
              Весь каталог
              <Icon name="ArrowRight" size={16} />
            </button>
          </div>
        </div>

        {/* Скелетоны пока грузится */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 aspect-square animate-pulse" />
            ))}
          </div>
        )}

        {/* Сетка товаров */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
            {products.map(p => (
              <div key={p.id} className="relative">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}

        {/* Кнопка внизу */}
        {!loading && products.length > 0 && (
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            {cartCount > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold text-sm transition-all"
                style={{ borderColor: "#3ca615", color: "#3ca615" }}
              >
                <Icon name="ShoppingCart" size={18} />
                Корзина ({cartCount})
              </button>
            )}
            <button
              onClick={() => navigate("/shop")}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
              style={{ background: "#3ca615" }}
            >
              <Icon name="Store" size={18} />
              Весь каталог
            </button>
          </div>
        )}
      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </section>
  );
}