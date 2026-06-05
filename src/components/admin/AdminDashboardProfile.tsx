import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { managerApi, managerSession } from "@/lib/crm-api";
import { tgStaffApi } from "@/lib/tg-staff-api";

interface Profile {
  id: number; role: string; name: string; login: string;
  email?: string; phone?: string; address?: string; avatar_url?: string; cover_url?: string;
  fixies_balance: number; tariff_name?: string;
  penalties: number; done_tickets: number;
}

interface Stats {
  total: number;
  by_status: Record<string, number>;
  clients: number;
  paid: number;
  revenue: number;
}

const ROLE_LABEL: Record<string, string> = { admin: "Администратор", manager: "Менеджер" };

function StatCard({
  label,
  value,
  color,
  borderColor,
  onClick,
}: {
  label: string;
  value: string | number;
  color: string;
  borderColor: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 border-l-4 ${borderColor} transition-transform duration-150 hover:scale-[1.02] ${onClick ? "cursor-pointer" : ""}`}
    >
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1 leading-tight">{label}</p>
    </div>
  );
}

export default function AdminDashboardProfile({ manager, onManagerUpdate, onSectionChange }: {
  manager: { id: number; name: string; role: string } | null;
  onManagerUpdate: (m: { id: number; name: string; role: string; avatar_url?: string }) => void;
  onSectionChange: (s: string) => void;
}) {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editOpen, setEditOpen]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [avatarUploading, setAU]  = useState(false);
  const [coverUploading, setCU]   = useState(false);
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Быстрое создание заявки
  const [showQuickTicket, setShowQuickTicket] = useState(false);
  const [quickTicket, setQuickTicket] = useState({ title: "", description: "", client_name: "", client_phone: "", priority: "normal" });
  const [creatingTicket, setCreatingTicket] = useState(false);

  // Быстрое создание клиента
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickClient, setQuickClient] = useState({ name: "", phone: "", email: "" });
  const [creatingClient, setCreatingClient] = useState(false);

  // Сообщение в групповой чат
  const [showGroupMsg, setShowGroupMsg] = useState(false);
  const [groupMsgText, setGroupMsgText] = useState("");
  const [sendingGroupMsg, setSendingGroupMsg] = useState(false);

  // Форма редактирования
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [phone, setPhone]     = useState("");
  const [address, setAddress] = useState("");
  const [curPw, setCurPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [newPw2, setNewPw2]   = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [profRes, statsRes] = await Promise.all([
      managerApi.getManagerProfile(),
      managerApi.getStats(),
    ]);
    if (profRes.profile) {
      setProfile(profRes.profile);
      setName(profRes.profile.name || "");
      setEmail(profRes.profile.email || "");
      setPhone(profRes.profile.phone || "");
      setAddress(profRes.profile.address || "");
    }
    if (statsRes.total !== undefined) setStats(statsRes);
    setLoading(false);
  }

  function flash(text: string, ok = true) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setAU(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      const res = await managerApi.updateProfile({ avatar_url: `data:${file.type};base64,${b64}` });
      if (res.updated && res.manager?.avatar_url) {
        setProfile(p => p ? { ...p, avatar_url: res.manager.avatar_url } : p);
        if (res.manager) onManagerUpdate(res.manager);
        flash("Фото обновлено");
      }
      setAU(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCU(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const dataUrl = ev.target?.result as string;
      const res = await managerApi.updateProfile({ cover_url: dataUrl });
      if (res.updated && res.manager?.cover_url) {
        setProfile(p => p ? { ...p, cover_url: res.manager.cover_url } : p);
        flash("Шапка обновлена");
      } else flash(res.error || "Ошибка загрузки", false);
      setCU(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleCoverReset() {
    setCU(true);
    const res = await managerApi.updateProfile({ cover_url: "" });
    if (res.updated) {
      setProfile(p => p ? { ...p, cover_url: undefined } : p);
      flash("Шапка сброшена");
    } else flash(res.error || "Ошибка", false);
    setCU(false);
  }

  async function handleSave() {
    if (newPw && newPw !== newPw2) { flash("Пароли не совпадают", false); return; }
    if (newPw && !curPw) { flash("Введите текущий пароль", false); return; }
    setSaving(true);
    const data: Record<string, string> = {};
    if (name.trim() && name !== profile?.name) data.name = name.trim();
    if (email.trim() && email !== profile?.email) data.email = email.trim();
    if (phone.trim() && phone !== profile?.phone) data.phone = phone.trim();
    if (address.trim() && address !== profile?.address) data.address = address.trim();
    if (newPw.trim()) { data.password = newPw.trim(); data.current_password = curPw.trim(); }
    if (!Object.keys(data).length) { flash("Нечего сохранять", false); setSaving(false); return; }
    const res = await managerApi.updateProfile(data);
    if (res.updated) {
      if (res.manager) onManagerUpdate(res.manager);
      flash("Сохранено!");
      setEditOpen(false);
      setCurPw(""); setNewPw(""); setNewPw2("");
      load();
    } else flash(res.error || "Ошибка", false);
    setSaving(false);
  }

  async function createQuickTicket() {
    if (!quickTicket.title || !quickTicket.client_phone) return;
    setCreatingTicket(true);
    const res = await managerApi.createTicket({
      title: quickTicket.title,
      description: quickTicket.description,
      priority: quickTicket.priority,
      client_name: quickTicket.client_name,
      client_phone: quickTicket.client_phone,
    });
    setCreatingTicket(false);
    if (res.id || res.ticket_id) {
      flash(`Заявка создана #${res.id || res.ticket_id}`);
      setShowQuickTicket(false);
      setQuickTicket({ title: "", description: "", client_name: "", client_phone: "", priority: "normal" });
      load();
    } else flash(res.error || "Ошибка", false);
  }

  async function createQuickClient() {
    if (!quickClient.name || !quickClient.phone) return;
    setCreatingClient(true);
    const res = await managerApi.createTicket({
      title: "Регистрация клиента",
      description: "Клиент добавлен из дашборда",
      client_name: quickClient.name,
      client_phone: quickClient.phone,
      client_email: quickClient.email,
      priority: "low",
    });
    setCreatingClient(false);
    if (res.id || res.ticket_id) {
      flash(`Клиент ${quickClient.name} добавлен`);
      setShowQuickClient(false);
      setQuickClient({ name: "", phone: "", email: "" });
    } else flash(res.error || "Ошибка", false);
  }

  async function sendGroupMessage() {
    if (!groupMsgText.trim()) return;
    setSendingGroupMsg(true);
    const token = managerSession.get()!;
    const res = await tgStaffApi.groupSend(token, groupMsgText.trim());
    setSendingGroupMsg(false);
    if (res.sent) {
      flash("Сообщение отправлено в групповой чат");
      setGroupMsgText("");
      setShowGroupMsg(false);
    } else flash(res.error || "Ошибка отправки", false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Icon name="Loader2" size={32} className="animate-spin text-gray-300" />
    </div>
  );

  const initials = profile?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "??";
  const isAdmin  = profile?.role === "admin";

  // Мини-диаграмма статусов
  const statusBars = stats ? [
    { key: "new",         label: "Новые",      color: "bg-blue-400",   value: stats.by_status?.new ?? 0 },
    { key: "in_progress", label: "В работе",   color: "bg-yellow-400", value: stats.by_status?.in_progress ?? 0 },
    { key: "done",        label: "Выполнено",  color: "bg-green-400",  value: stats.by_status?.done ?? 0 },
    { key: "cancelled",   label: "Отменено",   color: "bg-gray-300",   value: stats.by_status?.cancelled ?? 0 },
  ] : [];
  const statusTotal = statusBars.reduce((s, b) => s + b.value, 0) || 1;

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {msg.text}
        </div>
      )}

      {/* ── Карточка профиля ─────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden shadow-sm mb-5">
        {/* Шапка с градиентом или картинкой */}
        <div className="relative px-6 pt-6 pb-16"
          style={profile?.cover_url
            ? { backgroundImage: `url(${profile.cover_url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: isAdmin ? "linear-gradient(135deg,#e53e3e,#c53030)" : "linear-gradient(135deg,#3ca615,#2d8a10)" }}>
          {profile?.cover_url && <div className="absolute inset-0 bg-black/35" />}

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-xl font-bold text-white drop-shadow">{profile?.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {ROLE_LABEL[profile?.role || ""] || profile?.role}
                </span>
              </div>
              <p className="text-white/70 text-sm drop-shadow">@{profile?.login}</p>
            </div>
            <div className="flex items-center gap-2">
              <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
              <button onClick={() => coverRef.current?.click()} disabled={coverUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors disabled:opacity-50">
                <Icon name={coverUploading ? "Loader2" : "Image"} size={13} className={coverUploading ? "animate-spin" : ""} />
                {profile?.cover_url ? "Сменить фон" : "Фон"}
              </button>
              {profile?.cover_url && (
                <button onClick={handleCoverReset} disabled={coverUploading} title="Убрать картинку"
                  className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors disabled:opacity-50">
                  <Icon name="X" size={14} />
                </button>
              )}
              <button onClick={() => setEditOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors">
                <Icon name="Pencil" size={13} />Изменить
              </button>
            </div>
          </div>
          {!profile?.cover_url && <>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 right-20 w-24 h-24 rounded-full bg-white/5 translate-y-1/2" />
          </>}
        </div>

        {/* Аватар поверх */}
        <div className="bg-white px-6 pb-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white shadow-lg flex items-center justify-center"
                style={{ background: isAdmin ? "#e53e3e" : "#3ca615" }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="font-bold text-2xl text-white">{initials}</span>
                }
              </div>
              {avatarUploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <Icon name="Loader2" size={18} className="animate-spin text-white" />
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border-2 border-gray-100 shadow flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Icon name="Camera" size={11} className="text-gray-600" />
              </button>
            </div>

            {/* Контакты — таблетки */}
            <div className="flex flex-wrap gap-2 pb-1">
              {profile?.email && (
                <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-300 hover:bg-gray-100">
                  <Icon name="Mail" size={12} className="text-gray-400" />{profile.email}
                </span>
              )}
              {profile?.phone && (
                <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-300 hover:bg-gray-100">
                  <Icon name="Phone" size={12} className="text-gray-400" />{profile.phone}
                </span>
              )}
              {profile?.tariff_name && (
                <span className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-300 hover:bg-yellow-100">
                  <Icon name="Star" size={12} className="text-yellow-500" />{profile.tariff_name}
                </span>
              )}
            </div>
          </div>

          {/* Фиксики и штрафы */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center bg-green-50 rounded-2xl py-4 px-2">
              <div className="flex justify-center mb-1">
                <Icon name="Coins" size={16} className="text-[#3ca615]" />
              </div>
              <p className="text-3xl font-bold text-[#3ca615]">{profile?.fixies_balance ?? 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">Фиксиков</p>
            </div>
            <div className="text-center bg-red-50 rounded-2xl py-4 px-2">
              <div className="flex justify-center mb-1">
                <Icon name="AlertTriangle" size={16} className="text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-500">{profile?.penalties ?? 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">Штрафов</p>
            </div>
            <div className="text-center bg-gray-50 rounded-2xl py-4 px-2">
              <div className="flex justify-center mb-1">
                <Icon name="CheckCircle2" size={16} className="text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-gray-800">{profile?.done_tickets ?? 0}</p>
              <p className="text-[10px] text-gray-500 mt-1">Закрыто</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Форма редактирования ─────────────────────────────────────────── */}
      {editOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="Settings" size={15} className="text-gray-400" />Редактировать профиль</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[["Имя",name,setName],["Email",email,setEmail],["Телефон",phone,setPhone],["Адрес",address,setAddress]].map(([lbl, val, setter]) => (
              <div key={lbl as string}>
                <label className="text-xs text-gray-500 block mb-1">{lbl as string}</label>
                <input value={val as string} onChange={e => (setter as (v:string)=>void)(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
              </div>
            ))}
          </div>
          <div className="border-t border-gray-50 pt-4">
            <p className="text-xs font-bold text-gray-500 mb-3">Сменить пароль</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[["Текущий пароль",curPw,setCurPw],["Новый пароль",newPw,setNewPw],["Повторите новый",newPw2,setNewPw2]].map(([lbl, val, setter]) => (
                <div key={lbl as string}>
                  <label className="text-xs text-gray-500 block mb-1">{lbl as string}</label>
                  <input type="password" value={val as string} onChange={e => (setter as (v:string)=>void)(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "#3ca615" }}>
              {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Save" size={15} />}Сохранить
            </button>
            <button onClick={() => setEditOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* ── Быстрая статистика ───────────────────────────────────────────── */}
      {stats && (
        <>
          {/* StatCard-сетка 2x3 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <StatCard
              label="Всего заявок"
              value={stats.total}
              color="text-blue-600"
              borderColor="border-l-blue-400"
              onClick={() => onSectionChange("tickets")}
            />
            <StatCard
              label="Клиентов"
              value={stats.clients}
              color="text-purple-600"
              borderColor="border-l-purple-400"
              onClick={() => onSectionChange("clients")}
            />
            <StatCard
              label="Выполнено"
              value={stats.by_status?.done ?? 0}
              color="text-green-600"
              borderColor="border-l-green-400"
              onClick={() => onSectionChange("tickets")}
            />
            <StatCard
              label="Выручка"
              value={`${(stats.revenue || 0).toLocaleString("ru-RU")} ₽`}
              color="text-yellow-600"
              borderColor="border-l-yellow-400"
            />
            <StatCard
              label="В работе"
              value={stats.by_status?.in_progress ?? 0}
              color="text-orange-500"
              borderColor="border-l-orange-400"
              onClick={() => onSectionChange("tickets")}
            />
            <StatCard
              label="Новых"
              value={stats.by_status?.new ?? 0}
              color="text-indigo-600"
              borderColor="border-l-indigo-400"
              onClick={() => onSectionChange("tickets")}
            />
          </div>

          {/* Мини-диаграмма статусов */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <p className="text-sm font-bold text-gray-700 mb-4">Распределение заявок</p>
            <div className="space-y-3">
              {statusBars.map(bar => (
                <div key={bar.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-20 shrink-0">{bar.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color} transition-all duration-500`}
                      style={{ width: `${Math.round((bar.value / statusTotal) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right shrink-0">{bar.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Быстрые ссылки */}
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Перейти в раздел</h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-5">
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
              {[
                { label: "Заявки",      icon: "Ticket",      section: "tickets",   bg: "hover:bg-blue-50",   text: "text-blue-600" },
                { label: "Клиенты",     icon: "Users",       section: "clients",   bg: "hover:bg-purple-50", text: "text-purple-600" },
                { label: "Сотрудники",  icon: "Users2",      section: "tg-chat",   bg: "hover:bg-green-50",  text: "text-green-600" },
                { label: "Тарифы",      icon: "Star",        section: "tariffs",   bg: "hover:bg-yellow-50", text: "text-yellow-600" },
                { label: "Магазин",     icon: "ShoppingBag", section: "shop",      bg: "hover:bg-orange-50", text: "text-orange-500" },
                { label: "Блог",        icon: "BookOpen",    section: "blog",      bg: "hover:bg-indigo-50", text: "text-indigo-600" },
                { label: "Отзывы",      icon: "Star",        section: "reviews",   bg: "hover:bg-pink-50",   text: "text-pink-500" },
                { label: "Контент",     icon: "LayoutGrid",  section: "content",   bg: "hover:bg-teal-50",   text: "text-teal-600" },
              ].map(item => (
                <button
                  key={item.section}
                  onClick={() => onSectionChange(item.section)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors ${item.bg} group`}
                >
                  <Icon name={item.icon as "Ticket"} size={18} className={`${item.text} transition-transform duration-150 group-hover:scale-110`} />
                  <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-700 leading-tight text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Быстрые действия */}
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Быстрые действия</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <button onClick={() => { setShowQuickTicket(v => !v); setShowQuickClient(false); setShowGroupMsg(false); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${showQuickTicket ? "border-[#3ca615] bg-[#edf7e8] text-[#3ca615]" : "border-gray-200 bg-white text-gray-700 hover:border-[#3ca615] hover:text-[#3ca615]"}`}>
              <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0"><Icon name="FilePlus" size={16} className="text-white" /></div>
              Создать заявку
            </button>
            <button onClick={() => { setShowQuickClient(v => !v); setShowQuickTicket(false); setShowGroupMsg(false); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${showQuickClient ? "border-[#3ca615] bg-[#edf7e8] text-[#3ca615]" : "border-gray-200 bg-white text-gray-700 hover:border-[#3ca615] hover:text-[#3ca615]"}`}>
              <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center shrink-0"><Icon name="UserPlus" size={16} className="text-white" /></div>
              Добавить клиента
            </button>
            <button onClick={() => { setShowGroupMsg(v => !v); setShowQuickTicket(false); setShowQuickClient(false); }}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${showGroupMsg ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-600"}`}>
              <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0"><Icon name="Send" size={16} className="text-white" /></div>
              Написать в группу
            </button>
          </div>

          {/* Форма заявки */}
          {showQuickTicket && (
            <div className="bg-white rounded-2xl border border-[#3ca615]/30 shadow-sm p-5 mb-4 space-y-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="FilePlus" size={15} className="text-blue-500" />Новая заявка</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Тема заявки *</label>
                  <input value={quickTicket.title} onChange={e => setQuickTicket(p => ({...p, title: e.target.value}))}
                    placeholder="Краткое описание проблемы"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Приоритет</label>
                  <select value={quickTicket.priority} onChange={e => setQuickTicket(p => ({...p, priority: e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="low">Низкий</option><option value="normal">Обычный</option>
                    <option value="high">Высокий</option><option value="urgent">Срочный</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Имя клиента</label>
                  <input value={quickTicket.client_name} onChange={e => setQuickTicket(p => ({...p, client_name: e.target.value}))}
                    placeholder="Иван Иванов"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Телефон *</label>
                  <input value={quickTicket.client_phone} onChange={e => setQuickTicket(p => ({...p, client_phone: e.target.value}))}
                    placeholder="+7 999 000-00-00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                </div>
              </div>
              <textarea value={quickTicket.description} onChange={e => setQuickTicket(p => ({...p, description: e.target.value}))}
                placeholder="Подробное описание (необязательно)" rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] resize-none" />
              <div className="flex gap-2">
                <button onClick={createQuickTicket} disabled={creatingTicket || !quickTicket.title || !quickTicket.client_phone}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
                  style={{ background: "#3ca615" }}>
                  {creatingTicket ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Plus" size={14} />}Создать заявку
                </button>
                <button onClick={() => setShowQuickTicket(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
              </div>
            </div>
          )}

          {/* Форма клиента */}
          {showQuickClient && (
            <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-5 mb-4 space-y-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="UserPlus" size={15} className="text-purple-500" />Добавить клиента</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Имя *</label>
                  <input value={quickClient.name} onChange={e => setQuickClient(p => ({...p, name: e.target.value}))}
                    placeholder="Иван Иванов"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Телефон *</label>
                  <input value={quickClient.phone} onChange={e => setQuickClient(p => ({...p, phone: e.target.value}))}
                    placeholder="+7 999 000-00-00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Email</label>
                  <input value={quickClient.email} onChange={e => setQuickClient(p => ({...p, email: e.target.value}))}
                    placeholder="ivan@example.com"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createQuickClient} disabled={creatingClient || !quickClient.name || !quickClient.phone}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 bg-purple-500 hover:bg-purple-600 transition-colors">
                  {creatingClient ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="UserPlus" size={14} />}Добавить
                </button>
                <button onClick={() => setShowQuickClient(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
              </div>
            </div>
          )}

          {/* Форма группового сообщения */}
          {showGroupMsg && (
            <div className="bg-blue-50 rounded-2xl border border-blue-200 shadow-sm p-5 mb-4 space-y-3">
              <h4 className="font-bold text-gray-900 flex items-center gap-2"><Icon name="Send" size={15} className="text-blue-500" />Сообщение в Telegram-группу</h4>
              <textarea value={groupMsgText} onChange={e => setGroupMsgText(e.target.value)}
                placeholder="Напишите сообщение всем сотрудникам..."
                rows={3}
                className="w-full border border-blue-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 resize-none" />
              <div className="flex gap-2">
                <button onClick={sendGroupMessage} disabled={sendingGroupMsg || !groupMsgText.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 bg-blue-500 hover:bg-blue-600 transition-colors">
                  {sendingGroupMsg ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}Отправить всем
                </button>
                <button onClick={() => setShowGroupMsg(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}