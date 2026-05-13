import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const SEND_URL = "https://functions.poehali.dev/d9dfa652-a0b7-4233-ba59-2efd338c4f10";

const PAYMENT_METHODS = [
  { key: "cash", icon: "Banknote", label: "Наличными", desc: "Оплата при получении или в офисе" },
  { key: "card", icon: "CreditCard", label: "Картой", desc: "Visa, Mastercard, Мир — онлайн или при получении" },
  { key: "transfer", icon: "Building2", label: "Перевод / р/с", desc: "Безналичный перевод, для юридических лиц" },
];

interface Props {
  open: boolean;
  serviceName?: string;
  onClose: () => void;
}

export default function QuickOrderModal({ open, serviceName, onClose }: Props) {
  const [form, setForm] = useState({ name: "", phone: "", comment: "" });
  const [payment, setPayment] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // Сброс при открытии
  useEffect(() => {
    if (open) {
      setForm({ name: "", phone: "", comment: "" });
      setPayment("");
      setAgreed(false);
      setError("");
      setDone(false);
    }
  }, [open]);

  // Закрытие по Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setError("Заполните имя и телефон"); return; }
    if (!agreed) { setError("Подтвердите согласие на обработку данных"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          topic: serviceName ? `Быстрый заказ: ${serviceName}` : "Быстрый заказ",
          problem: [
            form.comment && `Комментарий: ${form.comment}`,
            payment && `Способ оплаты: ${PAYMENT_METHODS.find(p => p.key === payment)?.label || payment}`,
          ].filter(Boolean).join("\n") || "—",
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) setDone(true);
      else setError(data.error || "Не удалось отправить. Попробуйте позже.");
    } catch { setError("Ошибка соединения. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Оверлей */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Окно */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#edf7e8] flex items-center justify-center shrink-0">
              <Icon name="Zap" size={18} className="text-[#3ca615]" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Заказать в 1 клик</p>
              {serviceName && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{serviceName}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Icon name="X" size={18} />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-[#edf7e8] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={32} className="text-[#3ca615]" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Заявка принята!</h3>
            <p className="text-gray-500 text-sm mb-6">Мы перезвоним вам в ближайшее время.</p>
            <button onClick={onClose}
              className="px-8 py-3 rounded-xl bg-[#3ca615] text-white font-semibold text-sm hover:bg-[#2d8a10] transition-colors">
              Закрыть
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Контактные данные */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ваше имя *</label>
              <input
                type="text" required value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Иван Иванов" autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Телефон *</label>
              <input
                type="tel" required value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Комментарий</label>
              <textarea
                rows={2} value={form.comment}
                onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                placeholder="Удобное время для звонка, уточнения по заказу..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 resize-none"
              />
            </div>

            {/* Способ оплаты */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Способ оплаты <span className="text-gray-300 font-normal">(необязательно)</span></label>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(pm => (
                  <button
                    key={pm.key}
                    type="button"
                    onClick={() => setPayment(payment === pm.key ? "" : pm.key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      payment === pm.key
                        ? "border-[#3ca615] bg-[#edf7e8]"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      payment === pm.key ? "bg-[#3ca615]" : "bg-gray-100"
                    }`}>
                      <Icon name={pm.icon as "Banknote"} size={17} className={payment === pm.key ? "text-white" : "text-gray-500"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${payment === pm.key ? "text-[#3ca615]" : "text-gray-900"}`}>{pm.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{pm.desc}</p>
                    </div>
                    {payment === pm.key && (
                      <Icon name="CheckCircle" size={16} className="text-[#3ca615] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
                <Icon name="AlertCircle" size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Галочка */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${agreed ? "bg-[#3ca615] border-[#3ca615]" : "border-gray-300 bg-white group-hover:border-[#3ca615]"}`}>
                  {agreed && <Icon name="Check" size={12} className="text-white" />}
                </div>
              </div>
              <span className="text-xs text-gray-500 leading-relaxed">
                Я согласен(а) с{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#3ca615] hover:underline">
                  политикой обработки персональных данных
                </a>
              </span>
            </label>

            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full py-3.5 rounded-xl bg-[#3ca615] text-white font-semibold text-sm hover:bg-[#2d8a10] transition-all shadow-lg shadow-green-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Icon name="Loader2" size={16} className="animate-spin" />Отправляем...</>
              ) : (
                <><Icon name="Zap" size={16} />Отправить заявку</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
