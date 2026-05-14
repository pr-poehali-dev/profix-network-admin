import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { managerApi, managerSession } from "@/lib/crm-api";

interface Manager {
  id: number; login: string; name: string; role: string;
  email?: string; phone?: string; avatar_url?: string;
  fixies_balance?: number; is_active?: boolean;
}

interface Tech {
  id: number; name: string; phone?: string; email?: string;
  specialization?: string; is_active: boolean;
  avatar_url?: string; fixies_balance?: number;
  tg_username?: string; active_tickets?: number;
}

const ROLE_LABEL: Record<string, string> = { admin: "Администратор", manager: "Менеджер" };
const ROLE_COLOR: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border border-red-100",
  manager: "bg-blue-50 text-blue-700 border border-blue-100",
};

function Avatar({ name, url, size = 10 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const cls = `w-${size} h-${size} rounded-2xl flex items-center justify-center overflow-hidden shrink-0`;
  return (
    <div className={cls} style={{ background: "#3ca615" }}>
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" />
        : <span className="text-white font-bold text-lg">{initials}</span>
      }
    </div>
  );
}

export default function AdminUsers({ currentManagerRole }: { currentManagerRole?: string }) {
  const token = managerSession.get()!;
  const isAdmin = currentManagerRole === "admin";

  const [tab, setTab] = useState<"managers" | "techs">("managers");
  const [managers, setManagers] = useState<Manager[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Формы создания
  const [showNewMgr, setShowNewMgr] = useState(false);
  const [showNewTech, setShowNewTech] = useState(false);
  const [newMgr, setNewMgr] = useState({ login: "", password: "", name: "", role: "manager" });
  const [newTech, setNewTech] = useState({ name: "", phone: "", email: "", specialization: "", pin: "" });
  const [creating, setCreating] = useState(false);

  // Редактирование
  const [editUser, setEditUser] = useState<Manager | Tech | null>(null);
  const [editType, setEditType] = useState<"manager" | "tech">("manager");
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<{ b64: string; mime: string; preview: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    if (tab === "managers") {
      const res = await managerApi.getManagers();
      if (res.managers) setManagers(res.managers);
    } else {
      const res = await managerApi.getTechnicians(true);
      if (res.technicians) setTechs(res.technicians);
    }
    setLoading(false);
  }

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  }

  // ── Менеджеры ──────────────────────────────────────────────────────────────
  async function createManager() {
    if (!newMgr.login || !newMgr.password || !newMgr.name) return;
    setCreating(true);
    const res = await managerApi.createManager(newMgr);
    setCreating(false);
    if (res.created || res.id) {
      setShowNewMgr(false);
      setNewMgr({ login: "", password: "", name: "", role: "manager" });
      flash("Менеджер создан");
      load();
    } else flash(res.error || "Ошибка", false);
  }

  async function deleteManager(id: number, name: string) {
    if (!confirm(`Деактивировать ${name}? Войти они не смогут.`)) return;
    const res = await managerApi.deleteManager(id);
    if (res.deleted) { flash("Менеджер деактивирован"); load(); }
    else flash(res.error || "Ошибка", false);
  }

  // ── Специалисты ────────────────────────────────────────────────────────────
  async function createTech() {
    if (!newTech.name) return;
    setCreating(true);
    const res = await managerApi.createTechnician(newTech);
    setCreating(false);
    if (res.created || res.id) {
      setShowNewTech(false);
      setNewTech({ name: "", phone: "", email: "", specialization: "", pin: "" });
      flash("Специалист добавлен");
      load();
    } else flash(res.error || "Ошибка", false);
  }

  async function deleteTech(id: number, name: string) {
    if (!confirm(`Деактивировать ${name}?`)) return;
    const res = await managerApi.deleteTechnician(id);
    if (res.deleted) { flash("Специалист деактивирован"); load(); }
    else flash(res.error || "Ошибка", false);
  }

  // ── Редактирование ─────────────────────────────────────────────────────────
  function openEdit(user: Manager | Tech, type: "manager" | "tech") {
    setEditUser(user); setEditType(type); setPendingAvatar(null);
    const d: Record<string, string> = { name: user.name };
    if (type === "manager") {
      const m = user as Manager;
      d.email = m.email || ""; d.phone = m.phone || "";
    } else {
      const t = user as Tech;
      d.phone = t.phone || ""; d.email = t.email || "";
      d.specialization = t.specialization || "";
    }
    setEditData(d);
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const b64 = dataUrl.split(",")[1];
      setPendingAvatar({ b64, mime: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function saveEdit() {
    if (!editUser) return;
    setEditSaving(true);
    if (editType === "tech") {
      const body: Record<string, unknown> = { id: editUser.id, ...editData };
      if (pendingAvatar) { body.avatar_b64 = pendingAvatar.b64; body.avatar_mime = pendingAvatar.mime; }
      const res = await managerApi.updateTechnician(body);
      if (res.updated) { flash("Сохранено"); setEditUser(null); setPendingAvatar(null); load(); }
      else flash(res.error || "Ошибка", false);
    } else {
      // Для менеджеров — updateProfile не подходит (чужой), используем admin-эндпоинт
      // Пока только показываем инфо
      flash("Редактирование менеджеров доступно через их личный кабинет");
    }
    setEditSaving(false);
  }

  const avatarPreview = pendingAvatar?.preview || (editUser as Tech)?.avatar_url;

  return (
    <div className="p-4 sm:p-6">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Управление пользователями</h2>
          <p className="text-sm text-gray-400 mt-0.5">Менеджеры, администраторы и технические специалисты</p>
        </div>
        <button
          onClick={() => tab === "managers" ? setShowNewMgr(v => !v) : setShowNewTech(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shrink-0"
          style={{ background: "#3ca615" }}>
          <Icon name="Plus" size={15} />
          {tab === "managers" ? "Новый менеджер" : "Новый специалист"}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {msg.text}
        </div>
      )}

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {[["managers","Менеджеры и Админы","UserCheck"],["techs","Тех специалисты","Wrench"]].map(([k,l,icon]) => (
          <button key={k} onClick={() => setTab(k as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${tab===k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon name={icon as "Wrench"} size={13} />{l}
          </button>
        ))}
      </div>

      {/* ── Форма нового менеджера ── */}
      {showNewMgr && tab === "managers" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Новый менеджер / администратор</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Имя *</label>
              <input value={newMgr.name} onChange={e => setNewMgr(p => ({...p, name: e.target.value}))}
                placeholder="Иван Иванов" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Логин *</label>
              <input value={newMgr.login} onChange={e => setNewMgr(p => ({...p, login: e.target.value}))}
                placeholder="login" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Пароль *</label>
              <input type="password" value={newMgr.password} onChange={e => setNewMgr(p => ({...p, password: e.target.value}))}
                placeholder="Минимум 6 символов" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Роль</label>
              <select value={newMgr.role} onChange={e => setNewMgr(p => ({...p, role: e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={createManager} disabled={creating || !newMgr.name || !newMgr.login || !newMgr.password}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "#3ca615" }}>
              {creating ? <Icon name="Loader2" size={15} className="animate-spin inline-block" /> : "Создать"}
            </button>
            <button onClick={() => setShowNewMgr(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
          </div>
        </div>
      )}

      {/* ── Форма нового специалиста ── */}
      {showNewTech && tab === "techs" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3">
          <h3 className="font-bold text-gray-900 text-sm">Новый технический специалист</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[["Имя *","name","Иван Иванов"],["Телефон","phone","+7 999 000-00-00"],["Email","email","ivan@example.com"],["Специализация","specialization","Ремонт техники"],["PIN (4-6 цифр)","pin","1234"]].map(([label, field, ph]) => (
              <div key={field}>
                <label className="text-xs text-gray-500 block mb-1">{label}</label>
                <input value={newTech[field as keyof typeof newTech]}
                  onChange={e => setNewTech(p => ({...p, [field]: e.target.value}))}
                  placeholder={ph}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={createTech} disabled={creating || !newTech.name}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "#3ca615" }}>
              {creating ? <Icon name="Loader2" size={15} className="animate-spin inline-block" /> : "Добавить"}
            </button>
            <button onClick={() => setShowNewTech(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
          </div>
        </div>
      )}

      {/* ── Список ── */}
      {loading ? (
        <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gray-300" /></div>
      ) : tab === "managers" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {managers.map(m => (
            <div key={m.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${m.is_active === false ? "opacity-50" : "hover:shadow-md border-gray-100"}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
                  style={{ background: m.role === "admin" ? "#e53e3e" : "#3ca615" }}>
                  {m.avatar_url
                    ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-xl">{m.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400 truncate">@{m.login}</p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLOR[m.role] || "bg-gray-100 text-gray-500"}`}>
                    {ROLE_LABEL[m.role] || m.role}
                  </span>
                </div>
              </div>
              {m.email && <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Icon name="Mail" size={11} />{m.email}</p>}
              {m.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Icon name="Phone" size={11} />{m.phone}</p>}
              {m.fixies_balance !== undefined && (
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-2">
                  <span className="text-xs font-bold text-[#3ca615]">💰 {m.fixies_balance} фикс.</span>
                </div>
              )}
              {isAdmin && m.is_active !== false && (
                <button onClick={() => deleteManager(m.id, m.name)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 text-red-500 text-xs font-medium hover:bg-red-50 transition-colors">
                  <Icon name="UserX" size={13} />Деактивировать
                </button>
              )}
            </div>
          ))}
          {managers.length === 0 && <p className="col-span-3 text-center text-gray-400 py-10">Нет менеджеров</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {techs.map(t => (
            <div key={t.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!t.is_active ? "opacity-50" : "hover:shadow-md border-gray-100"}`}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "#3ca615" }}>
                  {t.avatar_url
                    ? <img src={t.avatar_url} alt={t.name} className="w-full h-full object-cover" />
                    : <span className="text-white font-bold text-xl">{t.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{t.name}</p>
                  {t.specialization && <p className="text-xs text-gray-400 truncate">{t.specialization}</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    {!t.is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Неактивен</span>}
                    {t.tg_username && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">TG</span>}
                    {t.active_tickets ? <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">{t.active_tickets} заявок</span> : null}
                  </div>
                </div>
              </div>
              {t.phone && <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Icon name="Phone" size={11} />{t.phone}</p>}
              {t.email && <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Icon name="Mail" size={11} />{t.email}</p>}
              <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs font-bold text-[#3ca615]">💰 {t.fixies_balance ?? 0} фикс.</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(t, "tech")}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors">
                  <Icon name="Pencil" size={13} />Редактировать
                </button>
                {t.is_active && (
                  <button onClick={() => deleteTech(t.id, t.name)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-100 text-red-500 text-xs hover:bg-red-50 transition-colors">
                    <Icon name="UserX" size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {techs.length === 0 && <p className="col-span-3 text-center text-gray-400 py-10">Нет специалистов</p>}
        </div>
      )}

      {/* ── Модал редактирования специалиста ── */}
      {editUser && editType === "tech" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Редактировать специалиста</h3>
              <button onClick={() => { setEditUser(null); setPendingAvatar(null); }} className="text-gray-400"><Icon name="X" size={18} /></button>
            </div>

            {/* Аватар */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "#3ca615" }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-xl">{editUser.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</span>
                }
              </div>
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                  className="flex items-center gap-1.5 text-xs text-[#3ca615] hover:underline">
                  <Icon name="Upload" size={12} />{avatarPreview ? "Сменить фото" : "Загрузить фото"}
                </button>
                {pendingAvatar && <p className="text-[10px] text-amber-600 mt-1">Будет сохранено при нажатии «Сохранить»</p>}
              </div>
            </div>

            {[["Имя","name"],["Телефон","phone"],["Email","email"],["Специализация","specialization"]].map(([lbl, fld]) => (
              <div key={fld}>
                <label className="text-xs text-gray-500 block mb-1">{lbl}</label>
                <input value={editData[fld] || ""}
                  onChange={e => setEditData(p => ({...p, [fld]: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Новый PIN (оставьте пустым чтобы не менять)</label>
              <input value={editData.pin || ""} onChange={e => setEditData(p => ({...p, pin: e.target.value}))}
                placeholder="4-6 цифр" maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEdit} disabled={editSaving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#3ca615" }}>
                {editSaving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Save" size={15} />}Сохранить
              </button>
              <button onClick={() => { setEditUser(null); setPendingAvatar(null); }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}