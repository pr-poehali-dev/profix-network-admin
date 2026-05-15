import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { managerSession } from "@/lib/crm-api";

const REVIEWS_URL = "https://functions.poehali.dev/f1f45bf4-6a46-4561-abf6-fedd584fbeec";

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  service?: string;
  created_at: string;
  published: boolean;
}

const EMPTY = { name: "", rating: 5, text: "", service: "" };

function Stars({ rating, onChange }: { rating: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <button key={i} type="button" onClick={() => onChange?.(i + 1)}
          className={onChange ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}>
          <Icon name="Star" size={onChange ? 22 : 14}
            className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
        </button>
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const token = managerSession.get()!;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "published" | "hidden">("all");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editName, setEditName] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function api(method: string, body?: object, qs = "") {
    const url = qs ? `${REVIEWS_URL}?${qs}` : REVIEWS_URL;
    return fetch(url, {
      method,
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }).then(r => r.json()).catch(() => ({ error: "Ошибка сети" }));
  }

  async function load() {
    setLoading(true);
    const res = await api("GET", undefined, "action=all");
    if (res.reviews) setReviews(res.reviews);
    setLoading(false);
  }

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleCreate() {
    if (!form.name.trim() || !form.text.trim()) return;
    setSaving(true);
    const res = await api("POST", { action: "create_by_manager", ...form, is_published: true });
    setSaving(false);
    if (res.id || res.created) {
      flash("Отзыв добавлен и опубликован");
      setShowNew(false);
      setForm(EMPTY);
      load();
    } else flash(res.error || "Ошибка при добавлении", false);
  }

  async function handleTogglePublish(id: number, current: boolean) {
    await api("PUT", { action: "publish", id, published: !current });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, published: !current } : r));
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить отзыв навсегда?")) return;
    await api("DELETE", { action: "delete", id });
    setReviews(prev => prev.filter(r => r.id !== id));
    flash("Отзыв удалён");
  }

  function openEdit(r: Review) {
    setEditId(r.id); setEditText(r.text); setEditName(r.name); setEditRating(r.rating);
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setEditSaving(true);
    const res = await api("POST", { action: "update", id: editId, text: editText, rating: editRating, client_name: editName });
    setEditSaving(false);
    if (res.updated) {
      setReviews(prev => prev.map(r => r.id === editId ? { ...r, text: editText, rating: editRating, name: editName } : r));
      setEditId(null);
      flash("Сохранено");
    } else flash(res.error || "Ошибка", false);
  }

  const filtered = reviews.filter(r =>
    filter === "all" ? true : filter === "published" ? r.published : !r.published
  );
  const pubCount = reviews.filter(r => r.published).length;
  const avg = pubCount
    ? (reviews.filter(r => r.published).reduce((s, r) => s + r.rating, 0) / pubCount).toFixed(1)
    : "—";

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Отзывы клиентов</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {pubCount} опубликованных · средняя {avg} ⭐ · всего {reviews.length}
          </p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shrink-0"
          style={{ background: "#3ca615" }}>
          <Icon name="Plus" size={15} />Добавить отзыв
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {msg.text}
        </div>
      )}

      {showNew && (
        <div className="bg-white rounded-2xl border border-[#3ca615]/30 shadow-sm p-5 mb-5 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Icon name="Plus" size={15} className="text-[#3ca615]" />Новый отзыв
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Имя клиента *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Иван Иванов"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Услуга</label>
              <input value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                placeholder="Ремонт ноутбука"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Оценка</label>
            <Stars rating={form.rating} onChange={v => setForm(p => ({ ...p, rating: v }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Текст отзыва *</label>
            <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
              rows={3} placeholder="Отличный сервис, всё сделали быстро!"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.text.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "#3ca615" }}>
              {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Save" size={15} />}
              Добавить и опубликовать
            </button>
            <button onClick={() => { setShowNew(false); setForm(EMPTY); }}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {([["all","Все"], ["published","Опубликованные"], ["hidden","Скрытые"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${filter === k ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}
            style={filter === k ? { background: "#3ca615" } : {}}>
            {l} {k === "all" ? reviews.length : k === "published" ? pubCount : reviews.length - pubCount}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Icon name="Loader2" size={28} className="animate-spin text-gray-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Icon name="MessageSquare" size={32} className="mx-auto mb-3 text-gray-200" />
          <p className="text-sm">{filter === "all" ? "Отзывов нет. Добавьте первый!" : "Нет отзывов в этой категории"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id}
              className={`bg-white rounded-2xl border shadow-sm p-4 transition-opacity ${r.published ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
              {editId === r.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Имя</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Оценка</label>
                      <Stars rating={editRating} onChange={setEditRating} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Текст</label>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615] resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} disabled={editSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-50"
                      style={{ background: "#3ca615" }}>
                      {editSaving ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Save" size={13} />}
                      Сохранить
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs text-gray-600">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#edf7e8] flex items-center justify-center shrink-0 font-bold text-[#3ca615] text-base">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{r.name}</span>
                      {r.service && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{r.service}</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.published ? "Опубликован" : "Скрыт"}
                      </span>
                      <span className="text-xs text-gray-300 ml-auto shrink-0">
                        {new Date(r.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <Stars rating={r.rating} />
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">«{r.text}»</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => handleTogglePublish(r.id, r.published)}
                      title={r.published ? "Скрыть с сайта" : "Опубликовать на сайте"}
                      className={`w-10 h-6 rounded-full transition-colors relative ${r.published ? "bg-green-500" : "bg-gray-300"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-transform ${r.published ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                    <button onClick={() => openEdit(r)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Редактировать">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Удалить">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
