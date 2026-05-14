import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { shopApi, cart, CartItem } from "@/lib/shop-api";

const PAYMENT_OPTIONS = [
  { key: "cash",    icon: "Banknote",    label: "Наличными",       desc: "При получении или в офисе" },
  { key: "card",    icon: "CreditCard",  label: "Картой",          desc: "Visa, Мир — онлайн или при получении" },
  { key: "invoice", icon: "FileText",    label: "По счёту",        desc: "PDF-счёт с реквизитами на почту" },
  { key: "qr",      icon: "QrCode",      label: "QR / СБП",        desc: "Оплата через мобильный банк" },
];

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"cart" | "form" | "done">("cart");
  const [form, setForm] = useState({ name: "", phone: "", email: "", comment: "" });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  function reload() { setItems(cart.get()); }

  useEffect(() => {
    reload();
    window.addEventListener("cart-updated", reload);
    return () => window.removeEventListener("cart-updated", reload);
  }, []);

  useEffect(() => {
    if (open) { reload(); setStep("cart"); setInvoiceNumber(""); setError(""); }
  }, [open]);

  function handleQty(id: number, delta: number) {
    const item = items.find(i => i.product.id === id);
    if (!item) return;
    cart.setQty(id, item.qty + delta);
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentMethod) { setError("Выберите способ оплаты"); return; }
    setLoading(true); setError("");
    try {
      const res = await shopApi.placeOrder({
        name:           form.name,
        phone:          form.phone,
        email:          form.email || undefined,
        comment:        form.comment || undefined,
        payment_method: paymentMethod,
        items: items.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price || 0 })),
      });
      if (res.ok) {
        cart.clear();
        setInvoiceNumber(res.invoice_number || "");
        setStep("done");
      } else {
        setError(res.error || "Ошибка оформления заказа");
      }
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  const total = cart.total();
  const needsInvoice = paymentMethod === "invoice" || paymentMethod === "qr";

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`} style={{ height: "100dvh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-900">
            {step === "cart" ? "Корзина" : step === "form" ? "Оформление" : "Заказ принят"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* ── Корзина ── */}
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
              <div className="px-5 py-4 border-t border-gray-100 shrink-0" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
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

        {/* ── Форма оформления ── */}
        {step === "form" && (
          <form onSubmit={handleOrder} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <button type="button" onClick={() => setStep("cart")}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
                <Icon name="ChevronLeft" size={16} /> Назад к корзине
              </button>

              {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2"><Icon name="AlertCircle" size={15} className="shrink-0" />{error}</div>}

              {/* Контакты */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Контактные данные</p>
                <div className="space-y-2">
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
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Email {needsInvoice && <span className="text-red-400">*</span>}
                      {needsInvoice && <span className="text-gray-400 font-normal ml-1">(счёт придёт сюда)</span>}
                    </label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      required={needsInvoice} placeholder="your@email.com" type="email"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Комментарий</label>
                    <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))} rows={2}
                      placeholder="Удобное время для звонка, адрес доставки..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" />
                  </div>
                </div>
              </div>

              {/* Способ оплаты */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Способ оплаты *</p>
                <div className="space-y-2">
                  {PAYMENT_OPTIONS.map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => setPaymentMethod(paymentMethod === opt.key ? "" : opt.key)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === opt.key
                          ? "border-[#3ca615] bg-[#edf7e8]"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        paymentMethod === opt.key ? "bg-[#3ca615]" : "bg-gray-100"
                      }`}>
                        <Icon name={opt.icon as "Banknote"} size={17} className={paymentMethod === opt.key ? "text-white" : "text-gray-500"} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${paymentMethod === opt.key ? "text-[#3ca615]" : "text-gray-900"}`}>{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                      {paymentMethod === opt.key && <Icon name="CheckCircle" size={16} className="text-[#3ca615] shrink-0" />}
                    </button>
                  ))}
                </div>
                {needsInvoice && (
                  <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
                    <Icon name="Info" size={13} className="text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-600">
                      После оформления вы получите PDF-счёт с реквизитами и QR-кодом для оплаты.
                    </p>
                  </div>
                )}
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

            <div className="px-5 py-4 border-t border-gray-100 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreed ? "bg-[#3ca615] border-[#3ca615]" : "border-gray-300 bg-white group-hover:border-[#3ca615]"}`}>
                    {agreed && <Icon name="Check" size={12} className="text-white" />}
                  </div>
                </div>
                <span className="text-xs text-gray-500 leading-relaxed">
                  Я согласен(а) с{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#3ca615] hover:underline">политикой обработки персональных данных</a>
                </span>
              </label>
              <button type="submit" disabled={loading || !agreed}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                style={{ background: "#3ca615" }}>
                {loading ? <><Icon name="Loader2" size={16} className="animate-spin" />Оформляем...</> : "Оформить заказ"}
              </button>
            </div>
          </form>
        )}

        {/* ── Заказ принят ── */}
        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#edf7e8" }}>
              <Icon name="CheckCircle" size={40} className="text-[#3ca615]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Заказ оформлен!</h3>
              <p className="text-gray-500 text-sm">
                {needsInvoice
                  ? "Счёт для оплаты сформирован. Вы можете скачать его и оплатить."
                  : "Мы свяжемся с вами в ближайшее время для подтверждения."}
              </p>
            </div>

            {invoiceNumber && (needsInvoice) && (
              <button
                onClick={() => { onClose(); navigate(`/invoice/${invoiceNumber}`); }}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: "#3ca615" }}>
                <Icon name="FileText" size={16} />
                Открыть счёт {invoiceNumber}
              </button>
            )}

            <button onClick={() => { setStep("cart"); onClose(); }}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-colors">
              {needsInvoice ? "Закрыть" : "Продолжить покупки"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}