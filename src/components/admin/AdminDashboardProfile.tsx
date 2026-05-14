import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { managerApi, managerSession } from "@/lib/crm-api";

interface Profile {
  id: number; role: string; name: string; login: string;
  email?: string; phone?: string; address?: string; avatar_url?: string;
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

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
        <Icon name={icon as "Eye"} size={17} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminDashboardProfile({ manager, onManagerUpdate, onSectionChange }: {
  manager: { id: number; name: string; role: string } | null;
  onManagerUpdate: (m: { id: number; name: string; role: string }) => void;
  onSectionChange: (s: string) => void;
}) {
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [stats, setStats]         = useState<Stats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [editOpen, setEditOpen]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [avatarUploading, setAU]  = useState(false);
  const [msg, setMsg]             = useState<{ text: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
        flash("Фото обновлено");
      }
      setAU(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Icon name="Loader2" size={32} className="animate-spin text-gray-300" />
    </div>
  );

  const initials = profile?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "??";
  const isAdmin  = profile?.role === "admin";

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      {msg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${msg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {msg.text}
        </div>
      )}

      {/* ── Карточка профиля ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Аватар */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center border-2"
              style={{ borderColor: "#3ca615", background: "#3ca615" }}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                : <span className="font-bold text-3xl text-white">{initials}</span>
              }
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                <Icon name="Loader2" size={22} className="animate-spin text-white" />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Icon name="Camera" size={13} className="text-gray-600" />
            </button>
          </div>

          {/* Инфо */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">{profile?.name}</h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${isAdmin ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100"}`}>
                {ROLE_LABEL[profile?.role || ""] || profile?.role}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-3">@{profile?.login}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs text-gray-500">
              {profile?.email && <span className="flex items-center gap-1"><Icon name="Mail" size={11} />{profile.email}</span>}
              {profile?.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={11} />{profile.phone}</span>}
              {profile?.address && <span className="flex items-center gap-1"><Icon name="MapPin" size={11} />{profile.address}</span>}
              {profile?.tariff_name && <span className="flex items-center gap-1"><Icon name="Star" size={11} className="text-yellow-500" />{profile.tariff_name}</span>}
            </div>
          </div>

          <button onClick={() => setEditOpen(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors shrink-0">
            <Icon name="Pencil" size={14} />Редактировать
          </button>
        </div>

        {/* Фиксики и штрафы */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#3ca615]">{profile?.fixies_balance ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">💰 Фиксиков</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-2xl font-bold text-red-500">{profile?.penalties ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">⚠️ Штрафов</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{profile?.done_tickets ?? 0}</p>
            <p className="text-xs text-gray-400 mt-0.5">✅ Закрыто заявок</p>
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
            <button onClick={() => setEditOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
          </div>
        </div>
      )}

      {/* ── Быстрая статистика ───────────────────────────────────────────── */}
      {stats && (
        <>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Общая статистика CRM</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatCard label="Всего заявок" value={stats.total} icon="Ticket" color="bg-blue-50 text-blue-600" />
            <StatCard label="Клиентов" value={stats.clients} icon="Users" color="bg-purple-50 text-purple-600" />
            <StatCard label="Выполнено" value={stats.by_status?.done ?? 0} icon="CheckCircle" color="bg-green-50 text-green-600" />
            <StatCard label="Выручка" value={`${(stats.revenue || 0).toLocaleString("ru-RU")} ₽`} icon="Banknote" color="bg-yellow-50 text-yellow-600" />
          </div>

          {/* Быстрые ссылки */}
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Быстрые действия</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Заявки", icon: "Ticket", section: "tickets", color: "bg-blue-500" },
              { label: "Клиенты", icon: "Users", section: "clients", color: "bg-purple-500" },
              { label: "Сотрудники", icon: "Users2", section: "tg-chat", color: "bg-[#3ca615]" },
              { label: "Тарификация", icon: "Star", section: "tariffs", color: "bg-yellow-500" },
            ].map(item => (
              <button key={item.section} onClick={() => onSectionChange(item.section)}
                className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <Icon name={item.icon as "Ticket"} size={18} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
