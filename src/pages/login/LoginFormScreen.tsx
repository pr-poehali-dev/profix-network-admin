import Icon from "@/components/ui/icon";
import TurnstileWidget from "@/components/TurnstileWidget";
import { onPhoneChange } from "@/lib/phone";
import { Role, AuthMethod } from "./LoginTypes";

interface Props {
  role: Role;
  method: AuthMethod;
  setMethod: (m: AuthMethod) => void;
  error: string;
  loading: boolean;
  showPass: boolean;
  setShowPass: (v: boolean) => void;
  cfToken: string;
  setCfToken: (t: string) => void;

  // Роль текущая (для стилей)
  cr: { label: string; icon: string; grad: string; btn: string };

  // Менеджер
  login: string;
  setLogin: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  handleManagerLogin: () => void;
  handleManagerEmailLogin: () => void;

  // Клиент OTP
  phone: string;
  setPhone: (v: string) => void;
  channel: "email" | "telegram";
  setChannel: (v: "email" | "telegram") => void;
  email: string;
  setEmail: (v: string) => void;
  otpStep: "phone" | "code";
  setOtpStep: (v: "phone" | "code") => void;
  code: string;
  setCode: (v: string) => void;
  handleRequestOtp: () => void;
  handleVerifyOtp: () => void;

  // Клиент пароль
  clientPasswordPhone: string;
  setClientPasswordPhone: (v: string) => void;
  clientPassword: string;
  setClientPassword: (v: string) => void;
  handleClientPasswordLogin: () => void;

  // Техник
  techList: { id: number; name: string; specialization?: string }[];
  selectedTechId: number | null;
  setSelectedTechId: (id: number | null) => void;
  pin: string;
  setPin: (v: string) => void;
  techStep: "select" | "pin";
  setTechStep: (v: "select" | "pin") => void;
  techEmail: string;
  setTechEmail: (v: string) => void;
  techPassword: string;
  setTechPassword: (v: string) => void;
  handleTechLogin: () => void;
  handleTechPasswordLogin: () => void;

  setError: (v: string) => void;
  setScreen: (s: string) => void;
  back: () => void;
}

export function LoginFormScreen({
  role, method, setMethod, error, loading, showPass, setShowPass,
  cfToken, setCfToken, cr,
  login, setLogin, password, setPassword, handleManagerLogin, handleManagerEmailLogin,
  phone, setPhone, channel, setChannel, email, setEmail,
  otpStep, setOtpStep, code, setCode, handleRequestOtp, handleVerifyOtp,
  clientPasswordPhone, setClientPasswordPhone, clientPassword, setClientPassword, handleClientPasswordLogin,
  techList, selectedTechId, setSelectedTechId, pin, setPin,
  techStep, setTechStep, techEmail, setTechEmail, techPassword, setTechPassword,
  handleTechLogin, handleTechPasswordLogin,
  setError, setScreen, back,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
      {/* Шапка */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={back} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cr.grad} flex items-center justify-center shrink-0`}>
          <Icon name={cr.icon as "User"} size={17} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{cr.label}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <Icon name="AlertCircle" size={15} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── МЕНЕДЖЕР ── */}
      {role === "manager" && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Логин или Email</label>
            <div className="relative">
              <input
                type="text" value={login} onChange={e => setLogin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (login.includes("@") ? handleManagerEmailLogin() : handleManagerLogin())}
                placeholder="Логин или email" autoFocus
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 pr-10" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                <Icon name={login.includes("@") ? "Mail" : "User"} size={16} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {login.includes("@") ? "Будет выполнен вход по email" : "Будет выполнен вход по логину"}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Пароль</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (login.includes("@") ? handleManagerEmailLogin() : handleManagerLogin())}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
              </button>
            </div>
          </div>
          <TurnstileWidget onVerify={setCfToken} onExpire={() => setCfToken("")} />
          <button
            onClick={() => login.includes("@") ? handleManagerEmailLogin() : handleManagerLogin()}
            disabled={loading || !cfToken}
            className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${cr.btn}`}>
            {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
            {loading ? "Вход..." : "Войти"}
          </button>
          <button onClick={() => { setScreen("forgot"); setError(""); }}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Забыли пароль?
          </button>
        </div>
      )}

      {/* ── КЛИЕНТ ── */}
      {role === "client" && (
        <div className="space-y-4">
          {/* Переключатель метода */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {[{v:"otp",l:"Код по SMS/Email"},{v:"password",l:"Пароль"}].map(m => (
              <button key={m.v} onClick={() => { setMethod(m.v as AuthMethod); setError(""); setOtpStep("phone"); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === m.v ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                {m.l}
              </button>
            ))}
          </div>

          {method === "otp" && otpStep === "phone" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Телефон</label>
                <input type="tel" value={phone}
                  onFocus={e => { if (!e.target.value) setPhone("+7"); }}
                  onChange={e => onPhoneChange(e.target.value, setPhone)}
                  onKeyDown={e => e.key === "Enter" && handleRequestOtp()}
                  placeholder="+7 (999) 000-00-00" autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Способ получения кода</label>
                <div className="flex gap-2">
                  {(["email","telegram"] as const).map(ch => (
                    <button key={ch} onClick={() => setChannel(ch)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition ${channel === ch ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <Icon name={ch === "email" ? "Mail" : "Send"} size={15} />
                      {ch === "email" ? "Email" : "Telegram"}
                    </button>
                  ))}
                </div>
              </div>
              {channel === "email" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
                </div>
              )}
              <TurnstileWidget onVerify={setCfToken} onExpire={() => setCfToken("")} />
              <button onClick={handleRequestOtp} disabled={loading || !cfToken}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                {loading ? "Отправка..." : "Получить код"}
              </button>
            </>
          )}

          {method === "otp" && otpStep === "code" && (
            <>
              <p className="text-sm text-gray-500">Код отправлен {channel === "email" ? `на ${email}` : "в Telegram"}</p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Код подтверждения</label>
                <input type="text" value={code} onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                  placeholder="Введите код" autoFocus maxLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center text-xl tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
              </div>
              <button onClick={handleVerifyOtp} disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                {loading ? "Проверка..." : "Войти"}
              </button>
              <button onClick={() => { setOtpStep("phone"); setCode(""); setError(""); }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← Изменить номер
              </button>
            </>
          )}

          {method === "password" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Телефон</label>
                <input type="tel" value={clientPasswordPhone}
                  onFocus={e => { if (!e.target.value) setClientPasswordPhone("+7"); }}
                  onChange={e => onPhoneChange(e.target.value, setClientPasswordPhone)}
                  placeholder="+7 (999) 000-00-00" autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Пароль</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={clientPassword} onChange={e => setClientPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleClientPasswordLogin()}
                    placeholder="Введите пароль"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                  </button>
                </div>
              </div>
              <button onClick={handleClientPasswordLogin} disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                {loading ? "Вход..." : "Войти"}
              </button>
              <button onClick={() => { setScreen("forgot"); setError(""); }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Забыли пароль?
              </button>
            </>
          )}
        </div>
      )}

      {/* ── ТЕХНИК ── */}
      {role === "tech" && (
        <div className="space-y-4">
          {/* Переключатель метода */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            {[{v:"otp",l:"PIN-код"},{v:"password",l:"Пароль"}].map(m => (
              <button key={m.v} onClick={() => { setMethod(m.v as AuthMethod); setError(""); setTechStep("select"); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === m.v ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                {m.l}
              </button>
            ))}
          </div>

          {method === "otp" && techStep === "select" && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Выберите себя</p>
              {techList.length === 0 && (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <Icon name="Loader2" size={24} className="animate-spin mx-auto mb-2" />
                  Загрузка...
                </div>
              )}
              {techList.map(t => (
                <button key={t.id}
                  onClick={() => { setSelectedTechId(t.id); setTechStep("pin"); setError(""); }}
                  className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#3ca615] hover:bg-[#edf7e8] transition-all">
                  <div className="w-10 h-10 bg-[#edf7e8] rounded-xl flex items-center justify-center shrink-0">
                    <Icon name="UserCheck" size={18} className="text-[#3ca615]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.specialization || "Специалист"}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 ml-auto" />
                </button>
              ))}
            </>
          )}

          {method === "otp" && techStep === "pin" && (
            <>
              <button onClick={() => { setTechStep("select"); setPin(""); setError(""); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <Icon name="ChevronLeft" size={16} /> Назад к выбору
              </button>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">PIN-код</label>
                <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleTechLogin()}
                  placeholder="••••••" maxLength={6} autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20" />
              </div>
              <TurnstileWidget onVerify={setCfToken} onExpire={() => {}} />
              <button onClick={handleTechLogin} disabled={loading || !pin.trim() || !cfToken}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${cr.btn}`}>
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                {loading ? "Вход..." : "Войти"}
              </button>
            </>
          )}

          {method === "password" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                <input type="email" value={techEmail} onChange={e => setTechEmail(e.target.value)}
                  placeholder="your@email.com" autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Пароль</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={techPassword} onChange={e => setTechPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleTechPasswordLogin()}
                    placeholder="Введите пароль"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615] pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                  </button>
                </div>
              </div>
              <TurnstileWidget onVerify={setCfToken} onExpire={() => {}} />
              <button onClick={handleTechPasswordLogin} disabled={loading || !cfToken}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${cr.btn}`}>
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                {loading ? "Вход..." : "Войти"}
              </button>
              <button onClick={() => { setScreen("forgot"); setError(""); }}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
                Забыли пароль?
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
