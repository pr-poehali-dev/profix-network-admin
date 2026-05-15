import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { reviewsApi, managerSession } from "@/lib/crm-api";
import { ContentMap, Field } from "./editor-shared";

const REVIEWS_URL = "https://functions.poehali.dev/f1f45bf4-6a46-4561-abf6-fedd584fbeec";

// ── Редактор отзывов ──────────────────────────────────────────────────────────

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  service?: string;
  created_at: string;
  is_published: boolean;
}

const EMPTY_REVIEW = { name: "", rating: 5, text: "", service: "" };

export function ReviewsEditor() {
  const token = managerSession.get()!;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newReview, setNewReview] = useState(EMPTY_REVIEW);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const res = await reviewsApi.getAll(token);
    if (res.reviews) setReviews(res.reviews);
    setLoading(false);
  }

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 2500);
  }

  async function handleCreate() {
    if (!newReview.name.trim() || !newReview.text.trim()) return;
    setSaving(true);
    const res = await fetch(REVIEWS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ action: "create", ...newReview, is_published: true }),
    }).then(r => r.json()).catch(() => ({ error: "Ошибка сети" }));
    setSaving(false);
    if (res.id || res.ok || res.created) {
      flash("Отзыв добавлен");
      setShowNew(false);
      setNewReview(EMPTY_REVIEW);
      load();
    } else flash(res.error || "Ошибка", false);
  }

  async function handlePublish(id: number, current: boolean) {
    await reviewsApi.publish(id, !current, token);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_published: !current } : r));
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить отзыв?")) return;
    await reviewsApi.delete(id, token);
    setReviews(prev => prev.filter(r => r.id !== id));
    flash("Удалён");
  }

  const stars = (rating: number, onChange?: (v: number) => void) =>
    Array.from({ length: 5 }, (_, i) => (
      <button key={i} type="button" onClick={() => onChange?.(i + 1)}
        className={onChange ? "cursor-pointer" : "cursor-default"}>
        <Icon name="Star" size={onChange ? 20 : 14}
          className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
      </button>
    ));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Отзывы на главной странице сайта</p>
        <button onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
          style={{ background: "#3ca615" }}>
          <Icon name="Plus" size={13} />Добавить отзыв
        </button>
      </div>

      {msg && (
        <div className={`px-3 py-2 rounded-xl text-xs font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {msg.text}
        </div>
      )}

      {/* Форма нового отзыва */}
      {showNew && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-gray-700">Новый отзыв</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Имя *</label>
              <input value={newReview.name} onChange={e => setNewReview(p => ({ ...p, name: e.target.value }))}
                placeholder="Иван Иванов"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Услуга</label>
              <input value={newReview.service} onChange={e => setNewReview(p => ({ ...p, service: e.target.value }))}
                placeholder="Ремонт ноутбука"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Оценка</label>
            <div className="flex gap-1">{stars(newReview.rating, v => setNewReview(p => ({ ...p, rating: v })))}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Текст отзыва *</label>
            <textarea value={newReview.text} onChange={e => setNewReview(p => ({ ...p, text: e.target.value }))}
              rows={3} placeholder="Отличный сервис, рекомендую!"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !newReview.name.trim() || !newReview.text.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50"
              style={{ background: "#3ca615" }}>
              {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Plus" size={13} />}
              Добавить
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-600">Отмена</button>
          </div>
        </div>
      )}

      {/* Список отзывов */}
      {loading ? (
        <div className="flex justify-center py-8"><Icon name="Loader2" size={22} className="animate-spin text-gray-300" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-8">Отзывов пока нет</p>
      ) : (
        <div className="space-y-2">
          {reviews.map(r => (
            <div key={r.id} className={`bg-white border rounded-2xl p-4 transition-opacity ${r.is_published ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className="flex gap-0.5">{stars(r.rating)}</div>
                    <span className="font-semibold text-sm text-gray-900">{r.name}</span>
                    {r.service && <span className="text-xs text-gray-400">{r.service}</span>}
                    <span className="text-xs text-gray-300">{new Date(r.created_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">«{r.text}»</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handlePublish(r.id, r.is_published)}
                    title={r.is_published ? "Снять с публикации" : "Опубликовать"}
                    className={`w-8 h-5 rounded-full transition-colors relative shrink-0 ${r.is_published ? "bg-green-500" : "bg-gray-300"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${r.is_published ? "translate-x-3.5" : "translate-x-0.5"}`} />
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Редактор карты / как нас найти ────────────────────────────────────────────

export function MapEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const mapUrl = content["contacts.map_url"] || "";
  const previewUrl = mapUrl.includes("yandex") && mapUrl.includes("ll=")
    ? mapUrl.replace("yandex.ru/maps/", "yandex.ru/map-widget/v1/?").split("?")[0] + "?" + mapUrl.split("?")[1]
    : mapUrl;

  return (
    <div className="space-y-5">
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Расположение на карте</p>
        <Field
          label="Ссылка для iframe (Яндекс.Карты)"
          value={content["contacts.map_url"] || ""}
          onChange={v => onChange("contacts.map_url", v)}
          hint="Яндекс.Карты → Поделиться → Код для вставки → скопируй значение src=&quot;...&quot;"
        />
        {mapUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 200 }}>
            <iframe src={mapUrl} width="100%" height="100%" frameBorder="0" allowFullScreen title="Предпросмотр карты" style={{ display: "block" }} />
          </div>
        )}
        <a href="https://yandex.ru/map-widget/v1/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
          <Icon name="ExternalLink" size={12} />Открыть конструктор Яндекс.Карт
        </a>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Контактная информация на карте</p>
        <Field label="Адрес" value={content["contacts.address"] || ""} onChange={v => onChange("contacts.address", v)}
          hint="Отображается под заголовком «Как нас найти» и в карточках контактов" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Телефон (отображаемый)" value={content["contacts.phone"] || ""} onChange={v => onChange("contacts.phone", v)} />
          <Field label="Телефон (href, для ссылки)" value={content["contacts.phone_href"] || ""} onChange={v => onChange("contacts.phone_href", v)}
            hint="Пример: tel:+79142727187" />
        </div>
        <Field label="Режим работы" value={content["contacts.hours"] || ""} onChange={v => onChange("contacts.hours", v)}
          hint="Пример: Пн–Пт: 9:00 – 18:00, Сб: 10:00 – 15:00" />
      </div>
    </div>
  );
}