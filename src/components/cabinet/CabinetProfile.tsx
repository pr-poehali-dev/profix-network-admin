import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { clientApi } from "@/lib/crm-api";

const BOT_USERNAME = "ProFiXBot";

type Client = {
  id: number;
  name?: string;
  phone: string;
  email?: string;
  telegram_id?: number | null;
  avatar_url?: string | null;
  delivery_address?: string | null;
  socials?: Record<string, string>;
};

interface Props {
  client: Client;
  onBack: () => void;
  onClientUpdate: (c: Client) => void;
}

const SOCIAL_OPTIONS = [
  { key: "vk",       label: "ВКонтакте",  icon: "Globe",      placeholder: "https://vk.com/username" },
  { key: "telegram", label: "Telegram",   icon: "Send",        placeholder: "@username" },
  { key: "whatsapp", label: "WhatsApp",   icon: "MessageCircle", placeholder: "+7 999 000-00-00" },
  { key: "instagram",label: "Instagram",  icon: "Camera",      placeholder: "@username" },
];

export default function CabinetProfile({ client, onBack, onClientUpdate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Основные данные
  const [name, setName] = useState(client.name || "");
  const [deliveryAddress, setDeliveryAddress] = useState(client.delivery_address || "");
  const [socials, setSocials] = useState<Record<string, string>>(client.socials || {});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Аватар
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(client.avatar_url || "");

  // Смена пароля
  const [pwStep, setPwStep] = useState<"idle"|"sent"|"confirm">("idle");
  const [pwCode, setPwCode] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Смена email
  const [emailStep, setEmailStep] = useState<"idle"|"sent"|"confirm">("idle");
  const [emailNew, setEmailNew] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Смена телефона
  const [phoneStep, setPhoneStep] = useState<"idle"|"sent"|"confirm">("idle");
  const [phoneNew, setPhoneNew] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState(false);

  // ── Аватар ──────────────────────────────────────────────────────────────
  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      try {
        const res = await clientApi.uploadAvatar(b64, file.type);
        if (res.avatar_url) {
          setAvatarUrl(res.avatar_url);
          onClientUpdate({ ...client, avatar_url: res.avatar_url });
        }
      } catch { /* ignore */ }
      finally { setAvatarUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // ── Сохранение основных данных ───────────────────────────────────────────
  async function handleSave() {
    setSaving(true); setSaveError(""); setSaveSuccess(false);
    try {
      const res = await clientApi.updateProfile({
        name: name.trim() || undefined,
        delivery_address: deliveryAddress.trim() || null,
        socials,
      });
      if (res.client) {
        onClientUpdate({ ...client, ...res.client });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else setSaveError(res.error || "Ошибка сохранения");
    } catch { setSaveError("Ошибка соединения"); }
    finally { setSaving(false); }
  }

  // ── Смена пароля ─────────────────────────────────────────────────────────
  async function handlePwRequest() {
    setPwLoading(true); setPwError("");
    try {
      const res = await clientApi.changePasswordRequest();
      if (res.sent) setPwStep("sent");
      else setPwError(res.error || "Ошибка отправки");
    } catch { setPwError("Ошибка соединения"); }
    finally { setPwLoading(false); }
  }

  async function handlePwConfirm() {
    if (pwNew !== pwNew2) { setPwError("Пароли не совпадают"); return; }
    if (pwNew.length < 6) { setPwError("Минимум 6 символов"); return; }
    setPwLoading(true); setPwError("");
    try {
      const res = await clientApi.changePasswordConfirm(pwCode, pwNew);
      if (res.changed) {
        setPwSuccess(true); setPwStep("idle");
        setPwCode(""); setPwNew(""); setPwNew2("");
      } else setPwError(res.error || "Неверный код");
    } catch { setPwError("Ошибка"); }
    finally { setPwLoading(false); }
  }

  // ── Смена email ───────────────────────────────────────────────────────────
  async function handleEmailRequest() {
    if (!emailNew.trim()) { setEmailError("Введите новый email"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await clientApi.changeEmailRequest(emailNew.trim());
      if (res.sent) setEmailStep("sent");
      else setEmailError(res.error || "Ошибка отправки");
    } catch { setEmailError("Ошибка соединения"); }
    finally { setEmailLoading(false); }
  }

  async function handleEmailConfirm() {
    if (!emailCode.trim()) { setEmailError("Введите код"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await clientApi.changeEmailConfirm(emailCode, emailNew.trim());
      if (res.changed) {
        onClientUpdate({ ...client, email: emailNew.trim() });
        setEmailSuccess(true); setEmailStep("idle"); setEmailNew(""); setEmailCode("");
        setTimeout(() => setEmailSuccess(false), 2500);
      } else setEmailError(res.error || "Неверный код");
    } catch { setEmailError("Ошибка"); }
    finally { setEmailLoading(false); }
  }

  // ── Смена телефона ────────────────────────────────────────────────────────
  async function handlePhoneRequest() {
    if (!phoneNew.trim()) { setPhoneError("Введите новый телефон"); return; }
    setPhoneLoading(true); setPhoneError("");
    try {
      const res = await clientApi.changePhoneRequest(phoneNew.trim());
      if (res.sent) setPhoneStep("sent");
      else setPhoneError(res.error || "Ошибка отправки");
    } catch { setPhoneError("Ошибка соединения"); }
    finally { setPhoneLoading(false); }
  }

  async function handlePhoneConfirm() {
    if (!phoneCode.trim()) { setPhoneError("Введите код"); return; }
    setPhoneLoading(true); setPhoneError("");
    try {
      const res = await clientApi.changePhoneConfirm(phoneCode, phoneNew.trim());
      if (res.changed) {
        onClientUpdate({ ...client, phone: phoneNew.trim() });
        setPhoneSuccess(true); setPhoneStep("idle"); setPhoneNew(""); setPhoneCode("");
        setTimeout(() => setPhoneSuccess(false), 2500);
      } else setPhoneError(res.error || "Неверный код");
    } catch { setPhoneError("Ошибка"); }
    finally { setPhoneLoading(false); }
  }

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3ca615] transition-colors">
          <Icon name="ChevronLeft" size={16} /> Назад
        </button>
        <h2 className="font-oswald text-xl font-bold text-[#111827]">Мой профиль</h2>
      </div>

      {/* ── Аватар ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-[#edf7e8] overflow-hidden flex items-center justify-center border-2 border-[#3ca615]/20">
              {avatarUrl
                ? <img src={avatarUrl} alt="Аватар" className="w-full h-full object-cover" />
                : <Icon name="User" size={32} className="text-[#3ca615]" />
              }
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                <Icon name="Loader2" size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{client.name || "Без имени"}</p>
            <p className="text-sm text-gray-400">{client.phone}</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
              className="mt-2 flex items-center gap-1.5 text-xs text-[#3ca615] hover:underline transition-colors disabled:opacity-50">
              <Icon name="Upload" size={13} />
              {avatarUrl ? "Сменить фото" : "Загрузить фото"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Основные данные ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-oswald text-base font-bold text-gray-700 flex items-center gap-2">
          <Icon name="User" size={16} className="text-[#3ca615]" />
          Основная информация
        </h3>

        {saveError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-600 text-sm">
            <Icon name="AlertCircle" size={14} className="shrink-0" />{saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-green-700 text-sm">
            <Icon name="CheckCircle" size={14} className="shrink-0" />Сохранено!
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Имя</label>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Как к вам обращаться?"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615]" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Адрес доставки</label>
          <textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)}
            rows={2} placeholder="Улица, дом, квартира, город"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615] resize-none" />
        </div>

        {/* Социальные сети */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Социальные сети <span className="text-gray-400 font-normal">(по желанию)</span></label>
          <div className="space-y-2">
            {SOCIAL_OPTIONS.map(s => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon name={s.icon as "Globe"} size={15} className="text-gray-500" />
                </div>
                <input
                  value={socials[s.key] || ""}
                  onChange={e => setSocials(prev => ({ ...prev, [s.key]: e.target.value }))}
                  placeholder={s.placeholder}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
              </div>
            ))}
          </div>
        </div>

        {/* Telegram */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
            <Icon name="Send" size={12} className="text-blue-400" />
            Telegram для уведомлений
          </label>
          {client.telegram_id ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <Icon name="CheckCircle" size={15} className="text-green-600 shrink-0" />
              <span className="text-sm text-green-700 font-medium">Telegram привязан</span>
              <a href={`https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(client.phone)}`}
                target="_blank" rel="noopener noreferrer"
                className="ml-auto text-xs text-gray-400 underline hover:text-gray-600">
                Переподключить
              </a>
            </div>
          ) : (
            <a href={`https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(client.phone)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#2AABEE] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#1e96d6] transition w-full">
              <Icon name="Send" size={15} />
              Привязать Telegram
            </a>
          )}
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition flex items-center justify-center gap-2"
          style={{ backgroundColor: "#3ca615" }}>
          {saving ? <><Icon name="Loader2" size={14} className="animate-spin" />Сохранение...</>
            : saveSuccess ? <><Icon name="Check" size={14} />Сохранено!</>
            : "Сохранить изменения"}
        </button>
      </div>

      {/* ── Контактные данные (только просмотр + изменение) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="font-oswald text-base font-bold text-gray-700 flex items-center gap-2">
          <Icon name="Phone" size={16} className="text-[#3ca615]" />
          Контактные данные
        </h3>

        {/* Телефон */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-500">Телефон</label>
            <span className="text-xs text-gray-400 font-mono">{client.phone}</span>
          </div>
          {phoneSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-green-700 text-xs mb-2">
              <Icon name="CheckCircle" size={13} />Телефон изменён!
            </div>
          )}
          {phoneError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-600 text-xs mb-2">
              <Icon name="AlertCircle" size={13} />{phoneError}
            </div>
          )}
          {phoneStep === "idle" && (
            <div className="flex gap-2">
              <input type="tel" value={phoneNew} onChange={e => setPhoneNew(e.target.value)}
                placeholder="Новый номер телефона"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
              <button onClick={handlePhoneRequest} disabled={phoneLoading}
                className="px-3 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60 flex items-center gap-1"
                style={{ backgroundColor: "#3ca615" }}>
                {phoneLoading ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Send" size={13} />}
                Код
              </button>
            </div>
          )}
          {phoneStep === "sent" && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Код отправлен на email. Новый номер: <b>{phoneNew}</b></p>
              <input type="text" value={phoneCode} onChange={e => setPhoneCode(e.target.value)}
                placeholder="Код из письма"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
              <div className="flex gap-2">
                <button onClick={() => { setPhoneStep("idle"); setPhoneCode(""); setPhoneError(""); }}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">Отмена</button>
                <button onClick={handlePhoneConfirm} disabled={phoneLoading}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: "#3ca615" }}>Подтвердить</button>
              </div>
            </div>
          )}
        </div>

        {/* Email */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-500">Email</label>
            <span className="text-xs text-gray-400">{client.email || "не указан"}</span>
          </div>
          {emailSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-green-700 text-xs mb-2">
              <Icon name="CheckCircle" size={13} />Email изменён!
            </div>
          )}
          {emailError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-600 text-xs mb-2">
              <Icon name="AlertCircle" size={13} />{emailError}
            </div>
          )}
          {emailStep === "idle" && (
            <div className="flex gap-2">
              <input type="email" value={emailNew} onChange={e => setEmailNew(e.target.value)}
                placeholder="Новый email"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
              <button onClick={handleEmailRequest} disabled={emailLoading}
                className="px-3 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60 flex items-center gap-1"
                style={{ backgroundColor: "#3ca615" }}>
                {emailLoading ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Send" size={13} />}
                Код
              </button>
            </div>
          )}
          {emailStep === "sent" && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Код отправлен на <b>{emailNew}</b></p>
              <input type="text" value={emailCode} onChange={e => setEmailCode(e.target.value)}
                placeholder="Код из письма"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
              <div className="flex gap-2">
                <button onClick={() => { setEmailStep("idle"); setEmailCode(""); setEmailError(""); }}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-500">Отмена</button>
                <button onClick={handleEmailConfirm} disabled={emailLoading}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: "#3ca615" }}>Подтвердить</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Безопасность ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h3 className="font-oswald text-base font-bold text-gray-700 flex items-center gap-2">
          <Icon name="KeyRound" size={16} className="text-[#3ca615]" />
          Безопасность
        </h3>

        {/* Логин (телефон) — только просмотр */}
        <div className="flex items-center justify-between py-2 border-b border-gray-50">
          <span className="text-sm text-gray-500">Логин (телефон)</span>
          <span className="text-sm font-mono font-medium text-gray-700">{client.phone}</span>
        </div>

        {pwSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-green-700 text-sm">
            <Icon name="CheckCircle" size={14} />Пароль изменён!
          </div>
        )}
        {pwError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-600 text-sm">
            <Icon name="AlertCircle" size={14} />{pwError}
          </div>
        )}
        {pwStep === "idle" && (
          <button onClick={handlePwRequest} disabled={pwLoading || !client.email}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-[#3ca615] hover:text-[#3ca615] transition flex items-center justify-center gap-2 disabled:opacity-50">
            {pwLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Mail" size={14} />}
            {pwLoading ? "Отправка..." : client.email ? "Сменить пароль (код на email)" : "Сначала добавьте email"}
          </button>
        )}
        {pwStep === "sent" && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Код отправлен на {client.email}</p>
            <input type="text" value={pwCode} onChange={e => setPwCode(e.target.value)}
              placeholder="Код из письма"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={pwNew} onChange={e => setPwNew(e.target.value)}
                placeholder="Новый пароль (мин. 6 символов)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] pr-9" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Icon name={showPw ? "EyeOff" : "Eye"} size={15} />
              </button>
            </div>
            <input type={showPw ? "text" : "password"} value={pwNew2} onChange={e => setPwNew2(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handlePwConfirm()}
              placeholder="Повторите новый пароль"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            {pwNew && pwNew2 && pwNew !== pwNew2 && (
              <p className="text-xs text-red-500">Пароли не совпадают</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => { setPwStep("idle"); setPwCode(""); setPwNew(""); setPwNew2(""); setPwError(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">Отмена</button>
              <button onClick={handlePwConfirm} disabled={pwLoading || pwNew !== pwNew2 || pwNew.length < 6}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                style={{ backgroundColor: "#3ca615" }}>
                {pwLoading ? <Icon name="Loader2" size={13} className="animate-spin mx-auto" /> : "Сохранить"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
