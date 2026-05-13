import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { managerApi } from "@/lib/crm-api";

type Manager = { id: number; name: string; role: string };

interface Props {
  manager: Manager | null;
  onManagerUpdate: (m: Manager) => void;
  onBack: () => void;
}

export default function AdminProfile({ manager, onManagerUpdate, onBack }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(manager?.name || "");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      try {
        const res = await managerApi.updateProfile({ avatar_url: `data:${file.type};base64,${b64}` });
        if (res.updated && res.manager?.avatar_url) {
          setAvatarUrl(res.manager.avatar_url);
        }
      } catch { /* ignore */ }
      finally { setAvatarUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSave() {
    if (newPw && newPw !== newPw2) { setError("Пароли не совпадают"); return; }
    if (newPw && !curPw) { setError("Введите текущий пароль"); return; }
    setSaving(true); setError(""); setSuccess(false);
    try {
      const data: Record<string, string> = {};
      if (name.trim() && name.trim() !== manager?.name) data.name = name.trim();
      if (login.trim()) data.login = login.trim();
      if (email.trim()) data.email = email.trim();
      if (phone.trim()) data.phone = phone.trim();
      if (address.trim()) data.address = address.trim();
      if (newPw.trim()) { data.password = newPw.trim(); data.current_password = curPw.trim(); }
      if (!Object.keys(data).length) { setError("Нечего сохранять"); setSaving(false); return; }
      const res = await managerApi.updateProfile(data);
      if (res.updated) {
        setSuccess(true);
        if (res.manager) onManagerUpdate(res.manager);
        setLogin(""); setEmail(""); setPhone(""); setAddress("");
        setCurPw(""); setNewPw(""); setNewPw2("");
        setTimeout(() => setSuccess(false), 2500);
      } else setError(res.error || "Ошибка сохранения");
    } catch { setError("Ошибка соединения"); }
    finally { setSaving(false); }
  }

  const initials = manager?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "??";

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <Icon name="ChevronLeft" size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Мой профиль</h2>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
          <Icon name="AlertCircle" size={15} className="shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-green-700 text-sm">
          <Icon name="CheckCircle" size={15} className="shrink-0" />Изменения сохранены!
        </div>
      )}

      {/* Аватар */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3ca615] to-[#2d8a10] flex items-center justify-center overflow-hidden border-2 border-[#3ca615]/20">
              {avatarUrl
                ? <img src={avatarUrl} alt="Аватар" className="w-full h-full object-cover" />
                : <span className="font-oswald text-2xl font-bold text-white">{initials}</span>}
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                <Icon name="Loader2" size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{manager?.name}</p>
            <p className="text-sm text-gray-400 capitalize">{manager?.role === "admin" ? "Администратор" : "Менеджер"}</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
              className="mt-2 flex items-center gap-1.5 text-xs text-[#3ca615] hover:underline disabled:opacity-50">
              <Icon name="Upload" size={12} />
              {avatarUrl ? "Сменить фото" : "Загрузить фото"}
            </button>
          </div>
        </div>
      </div>

      {/* Основные данные */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
          <Icon name="User" size={15} className="text-[#3ca615]" />Основные данные
        </h3>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Имя</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder={manager?.name}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Новый логин <span className="font-normal text-gray-400">(оставьте пустым, чтобы не менять)</span></label>
          <input value={login} onChange={e => setLogin(e.target.value)}
            placeholder="Новый логин для входа"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Для восстановления пароля" type="email"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Телефон</label>
          <input value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="+7 (___) ___-__-__" type="tel"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Адрес</label>
          <input value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Рабочий или домашний адрес"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
        </div>
      </div>

      {/* Смена пароля */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2">
          <Icon name="KeyRound" size={15} className="text-[#3ca615]" />Сменить пароль
        </h3>
        <input value={curPw} onChange={e => setCurPw(e.target.value)}
          placeholder="Текущий пароль" type="password"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
        <div className="relative">
          <input value={newPw} onChange={e => setNewPw(e.target.value)}
            placeholder="Новый пароль (мин. 6 символов)"
            type={showPw ? "text" : "password"}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] pr-10" />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <Icon name={showPw ? "EyeOff" : "Eye"} size={16} />
          </button>
        </div>
        <input value={newPw2} onChange={e => setNewPw2(e.target.value)}
          placeholder="Повторите новый пароль"
          type={showPw ? "text" : "password"}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
        {newPw && newPw2 && newPw !== newPw2 && (
          <p className="text-xs text-red-500">Пароли не совпадают</p>
        )}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
        style={{ backgroundColor: "#3ca615" }}>
        {saving ? <><Icon name="Loader2" size={16} className="animate-spin" />Сохранение...</>
          : <><Icon name="Save" size={16} />Сохранить изменения</>}
      </button>
    </div>
  );
}
