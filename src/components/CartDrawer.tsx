import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { shopApi, cart, CartItem } from "@/lib/shop-api";
import { clientApi, clientSession } from "@/lib/crm-api";
import { onPhoneChange } from "@/lib/phone";

const PAYMENT_OPTIONS = [
  { key: "cash",    icon: "Banknote",   label: "Наличными",  desc: "При получении или в офисе" },
  { key: "card",    icon: "CreditCard", label: "Картой",     desc: "При получении или онлайн" },
  { key: "invoice", icon: "FileText",   label: "По счёту",   desc: "PDF-счёт с реквизитами на почту" },
  { key: "qr",      icon: "QrCode",     label: "QR / СБП",   desc: "Оплата через мобильный банк" },
];

const DELIVERY_OPTIONS = [
  { key: "pickup",   icon: "Store",       label: "Самовывоз",             desc: "г. Якутск, ул. Халтурина, 6" },
  { key: "physical", icon: "Truck",       label: "Доставка",              desc: "Укажите адрес доставки" },
  { key: "digital",  icon: "Mail",        label: "Электронная доставка",  desc: "Ключ/код придёт на email" },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:         { label: "Новый",       color: "#6366f1" },
  in_progress: { label: "В обработке", color: "#f59e0b" },
  waiting:     { label: "Ожидание",    color: "#8b5cf6" },
  done:        { label: "Выполнен",    color: "#3ca615" },
};
const PAY_STATUS: Record<string, { label: string; color: string }> = {
  pending:      { label: "Ожидает оплаты", color: "#f59e0b" },
  paid:         { label: "Оплачен",        color: "#3ca615" },
  not_required: { label: "Не требуется",   color: "#9ca3af" },
};

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<"cart" | "form" | "done">("cart");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", comment: "",
    delivery_type: "pickup",
    delivery_address: "",
    client_type: "individual",
    company_name: "", company_inn: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [clientProfile, setClientProfile] = useState<{ name?: string; phone?: string; email?: string } | null>(null);

  function reload() { setItems(cart.get()); }

  useEffect(() => {
    reload();
    window.addEventListener("cart-updated", reload);
    return () => window.removeEventListener("cart-updated", reload);
  }, []);

  useEffect(() => {
    if (open) {
      reload();
      setStep("cart");
      setInvoiceNumber("");
      setError("");
      // Подтягиваем данные авторизованного клиента
      const token = clientSession.get();
      setClientToken(token);
      if (token) {
        clientApi.verifyToken(token).then(r => {
          if (r.valid && r.client) {
            setClientProfile(r.client);
            setForm(prev => ({
              ...prev,
              name: r.client.name && !r.client.name.startsWith("+") ? r.client.name : prev.name,
              phone: r.client.phone || prev.phone,
              email: r.client.email || prev.email,
            }));
          }
        }).catch(() => {});
      }
    }
  }, [open]);

  function handleQty(id: number, delta: number) {
    const item = items.find(i => i.product.id === id);
    if (!item) return;
    cart.setQty(id, item.qty + delta);
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Укажите ваше имя"); return; }
    if (!form.phone.trim() || form.phone.trim() === "+7") { setError("Укажите номер телефона"); return; }
    if (form.delivery_type === "digital" && !form.email.trim()) { setError("Укажите email — ключ придёт на него"); return; }
    if ((paymentMethod === "invoice" || paymentMethod === "qr") && !form.email.trim()) { setError("Укажите email — счёт придёт на него"); return; }
    if (form.delivery_type === "physical" && !form.delivery_address.trim()) { setError("Укажите адрес доставки"); return; }
    if (!paymentMethod) { setError("Выберите способ оплаты"); return; }
    setLoading(true); setError("");
    try {
      const res = await shopApi.placeOrder({
        name:             form.name,
        phone:            form.phone,
        email:            form.email || undefined,
        comment:          form.comment || undefined,
        payment_method:   paymentMethod,
        delivery_type:    form.delivery_type,
        delivery_address: form.delivery_type === "physical" ? form.delivery_address : undefined,
        client_type:      form.client_type,
        company_name:     form.client_type === "company" ? form.company_name : undefined,
        company_inn:      form.client_type === "company" ? form.company_inn : undefined,
        items: items.map(i => ({ name: i.product.name, qty: i.qty, price: i.product.price || 0 })),
      }, clientToken || undefined);
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

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div className={`fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`} style={{ height: "100dvh" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-lg text-gray-900">
            {step === "cart" ? "Корзина" : step === "form" ? "Оформление заказа" : "Заказ принят!"}
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
                      <button onClick={() => handleQty(item.product.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-400 transition-colors">
                        <Icon name="Minus" size={12} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.qty}</span>
                      <button onClick={() => handleQty(item.product.id, 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:border-green-400 transition-colors">
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
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <button type="button" onClick={() => setStep("cart")}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
                <Icon name="ChevronLeft" size={16} /> Назад к корзине
              </button>

              {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm flex items-center gap-2"><Icon name="AlertCircle" size={15} className="shrink-0" />{error}</div>}

              {clientProfile && (
                <div className="bg-[#edf7e8] rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-[#2d6a0a]">
                  <Icon name="UserCheck" size={15} />
                  Вы вошли как {clientProfile.name || clientProfile.phone}
                </div>
              )}

              {/* Контактные данные */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Контактные данные</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Ваше имя / ФИО *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Иван Иванов"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Телефон *</label>
                    <input value={form.phone}
                      onFocus={e => { if (!e.target.value) setForm(p => ({ ...p, phone: "+7" })); }}
                      onChange={e => onPhoneChange(e.target.value, v => setForm(p => ({ ...p, phone: v })))}
                      placeholder="+7 (___) ___-__-__" type="tel"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      Email {form.delivery_type === "digital" || paymentMethod === "invoice" || paymentMethod === "qr" ? "*" : ""}
                    </label>
                    <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="example@mail.ru" type="email"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                </div>
              </div>

              {/* Тип получателя */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Тип получателя</p>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: "individual", label: "Физическое лицо", icon: "User" }, { key: "company", label: "Юридическое лицо", icon: "Building2" }].map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => setForm(p => ({ ...p, client_type: opt.key }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${form.client_type === opt.key ? "border-[#3ca615] bg-[#edf7e8] text-[#2d6a0a]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      <Icon name={opt.icon as "User"} size={15} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.client_type === "company" && (
                  <div className="mt-2 space-y-2">
                    <input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                      placeholder="Название организации"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                    <input value={form.company_inn} onChange={e => setForm(p => ({ ...p, company_inn: e.target.value }))}
                      placeholder="ИНН организации"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                )}
              </div>

              {/* Способ получения */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Способ получения</p>
                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => setForm(p => ({ ...p, delivery_type: opt.key }))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${form.delivery_type === opt.key ? "border-[#3ca615] bg-[#edf7e8]" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${form.delivery_type === opt.key ? "bg-[#3ca615]" : "bg-gray-100"}`}>
                        <Icon name={opt.icon as "Store"} size={15} className={form.delivery_type === opt.key ? "text-white" : "text-gray-500"} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                {form.delivery_type === "physical" && (
                  <div className="mt-2">
                    <input value={form.delivery_address} onChange={e => setForm(p => ({ ...p, delivery_address: e.target.value }))}
                      placeholder="Город, улица, дом, квартира *"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                  </div>
                )}
              </div>

              {/* Способ оплаты */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Способ оплаты</p>
                <div className="space-y-2">
                  {PAYMENT_OPTIONS.map(opt => (
                    <button key={opt.key} type="button"
                      onClick={() => setPaymentMethod(opt.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${paymentMethod === opt.key ? "border-[#3ca615] bg-[#edf7e8]" : "border-gray-200 hover:border-gray-300"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${paymentMethod === opt.key ? "bg-[#3ca615]" : "bg-gray-100"}`}>
                        <Icon name={opt.icon as "Banknote"} size={15} className={paymentMethod === opt.key ? "text-white" : "text-gray-500"} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-400">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Комментарий */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Комментарий</label>
                <textarea value={form.comment} onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                  placeholder="Уточнения по заказу..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" />
              </div>

              {!clientToken && (
                <p className="text-xs text-gray-400 text-center">
                  <button type="button" onClick={() => { onClose(); navigate("/cabinet"); }}
                    className="text-[#3ca615] underline">Войдите в личный кабинет</button> чтобы отслеживать заказы
                </p>
              )}
            </div>

            {/* Итог + кнопка */}
            <div className="px-5 py-4 border-t border-gray-100 shrink-0" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
              <div className="flex justify-between mb-3">
                <span className="text-gray-500 text-sm">Итого:</span>
                <span className="text-lg font-bold text-gray-900">{total.toLocaleString("ru-RU")} ₽</span>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ background: "#3ca615", color: "#ffffff" }}>
                {loading ? "Оформляем..." : "Подтвердить заказ"}
              </button>
            </div>
          </form>
        )}

        {/* ── Заказ принят ── */}
        {step === "done" && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#edf7e8" }}>
              <Icon name="CheckCircle" size={36} className="text-[#3ca615]" />
            </div>
            <div>
              <h3 className="font-oswald text-2xl font-bold text-gray-900 mb-1">Заказ принят!</h3>
              {invoiceNumber && <p className="text-sm text-gray-500">Номер заказа: <span className="font-bold text-gray-800">{invoiceNumber}</span></p>}
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 w-full text-left space-y-1.5 text-sm text-gray-600">
              <p>✅ Уведомление отправлено менеджеру</p>
              {form.email && <p>📧 Подтверждение отправлено на {form.email}</p>}
              <p>📞 Менеджер свяжется с вами по телефону {form.phone}</p>
              {clientToken && <p>👤 Статус заказа — в личном кабинете</p>}
            </div>
            <div className="flex flex-col gap-2 w-full">
              {clientToken && (
                <button onClick={() => { onClose(); navigate("/cabinet"); }}
                  className="w-full py-2.5 rounded-xl text-white font-semibold text-sm"
                  style={{ background: "#3ca615", color: "#ffffff" }}>
                  Перейти в личный кабинет
                </button>
              )}
              <button onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">
                Продолжить покупки
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
