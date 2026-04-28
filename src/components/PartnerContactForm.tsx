import { useState } from "react";
import Icon from "@/components/ui/icon";

const SEND_URL = "https://functions.poehali.dev/d9dfa652-a0b7-4233-ba59-2efd338c4f10";

const TOPICS = [
  "Торговое оборудование (ККТ, ТСД)",
  "Услуги по 1С",
  "Внедрение 1С",
  "Консультации по 1С",
  "Разработка в 1С",
  "Продажа программ 1С",
  "1С:ИТС",
  "Ремонт компьютеров",
  "Видеонаблюдение",
  "Монтаж сетей",
  "Заправка картриджей",
  "Другой вопрос",
];

interface Props {
  accentColor?: string;
  defaultTopic?: string;
}

const PartnerContactForm = ({ accentColor = "#3ca615", defaultTopic = "" }: Props) => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", topic: defaultTopic, problem: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(SEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Не удалось отправить. Попробуйте позже.");
      }
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const accent = accentColor;

  if (submitted) {
    return (
      <div className="bg-[#edf7e8] rounded-2xl p-10 text-center border border-green-100">
        <div className="w-16 h-16 rounded-full bg-[#3ca615] flex items-center justify-center mx-auto mb-4">
          <Icon name="CheckCircle" size={32} className="text-white" />
        </div>
        <h3 className="font-oswald text-2xl font-bold text-[#0D1B2A] mb-2">ЗАЯВКА ПРИНЯТА!</h3>
        <p className="text-[#6B7280] mb-6">Мы свяжемся с вами в ближайшее время.</p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: "", phone: "", email: "", topic: defaultTopic, problem: "" }); }}
          className="text-[#3ca615] font-medium hover:underline text-sm"
        >
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#F7F9FC] rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
            Имя <span className="text-red-400">*</span>
          </label>
          <input
            required
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ваше имя"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
            Телефон <span className="text-red-400">*</span>
          </label>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+7 (___) ___-__-__"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="your@email.ru"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-2 uppercase tracking-wide">
          Тема обращения <span className="text-red-400">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm({ ...form, topic: t })}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={
                form.topic === t
                  ? { backgroundColor: accent, color: "#fff", borderColor: accent }
                  : { backgroundColor: "#fff", color: "#374151", borderColor: "#e5e7eb" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
          Описание <span className="text-red-400">*</span>
        </label>
        <textarea
          required
          rows={4}
          value={form.problem}
          onChange={(e) => setForm({ ...form, problem: e.target.value })}
          placeholder="Опишите вашу задачу или вопрос..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm resize-none"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <Icon name="AlertCircle" size={16} className="text-red-500 shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !form.topic}
        className="w-full text-white py-4 rounded-xl font-semibold transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: accent }}
      >
        {loading ? (
          <Icon name="Loader2" size={18} className="animate-spin" />
        ) : (
          <Icon name="Send" size={18} />
        )}
        {loading ? "Отправляем..." : "Отправить заявку"}
      </button>
    </form>
  );
};

export default PartnerContactForm;
