import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  clientApi, clientSession,
  managerApi, managerSession,
  techApi, techSession,
  authApi,
} from "@/lib/crm-api";

type Role = "manager" | "client" | "tech";
type AuthMethod = "otp" | "password";
type Screen = "roles" | "form" | "forgot" | "reset_sent" | "reset_confirm" | "reset_done";

const ROLES = [
  {
    key: "client" as Role,
    label: "Личный кабинет",
    desc: "Клиент — заявки, чат с менеджером",
    icon: "User",
    grad: "from-blue-500 to-blue-600",
    accent: "border-blue-400 bg-blue-50 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700",
  },
  {
    key: "tech" as Role,
    label: "Портал специалиста",
    desc: "Технический специалист — управление заявками",
    icon: "Wrench",
    grad: "from-[#3ca615] to-[#2d8a10]",
    accent: "border-green-400 bg-green-50 text-green-700",
    btn: "bg-[#3ca615] hover:bg-[#2d8a10]",
  },
  {
    key: "manager" as Role,
    label: "Панель управления",
    desc: "Менеджер или администратор — полный CRM",
    icon: "LayoutDashboard",
    grad: "from-gray-700 to-gray-900",
    accent: "border-gray-400 bg-gray-50 text-gray-700",
    btn: "bg-gray-800 hover:bg-gray-900",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resetToken = params.get("reset");
  const resetRole  = (params.get("role") || "client") as Role;

  const [screen, setScreen] = useState<Screen>(resetToken ? "reset_confirm" : "roles");
  const [role, setRole] = useState<Role>(resetRole);
  const [method, setMethod] = useState<AuthMethod>("otp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Менеджер
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  // Клиент OTP
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"email" | "telegram">("email");
  const [email, setEmail] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");

  // Клиент пароль
  const [clientPasswordPhone, setClientPasswordPhone] = useState("");
  const [clientPassword, setClientPassword] = useState("");

  // Техник
  const [techList, setTechList] = useState<{id:number;name:string;specialization?:string}[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [techStep, setTechStep] = useState<"select" | "pin">("select");
  const [techEmail, setTechEmail] = useState("");
  const [techPassword, setTechPassword] = useState("");

  // Forgot / Reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Проверяем существующие сессии
  useEffect(() => {
    if (resetToken) return; // не редиректим если пришли сбросить пароль
    const mt = managerSession.get();
    const ct = clientSession.get();
    const tt = techSession.get();
    if (mt) managerApi.verifyToken(mt).then(r => { if (r.valid) navigate("/admin"); }).catch(() => {});
    if (ct) clientApi.verifyToken(ct).then(r => { if (r.valid) navigate("/cabinet"); }).catch(() => {});
    if (tt) techApi.verifyToken(tt).then(r => { if (r.valid) navigate("/techportal"); }).catch(() => {});
  }, [navigate, resetToken]);

  useEffect(() => {
    if (role === "tech") {
      techApi.getTechniciansList().then(r => { if (r.technicians) setTechList(r.technicians); });
    }
  }, [role]);

  const cr = ROLES.find(r => r.key === role)!;

  function goRole(r: Role) {
    setRole(r); setError("");
    setOtpStep("phone"); setTechStep("select");
    setMethod("otp");
    setScreen("form");
  }

  function back() {
    setScreen("roles"); setError("");
    setOtpStep("phone"); setTechStep("select");
    setLogin(""); setPassword(""); setPhone(""); setCode(""); setPin("");
    setClientPasswordPhone(""); setClientPassword(""); setTechEmail(""); setTechPassword("");
  }

  // ── Менеджер — логин/пароль ─────────────────────────────────────────────
  async function handleManagerLogin() {
    if (!login.trim() || !password.trim()) { setError("Заполните логин и пароль"); return; }
    setError(""); setLoading(true);
    try {
      const res = await managerApi.login(login.trim(), password.trim());
      if (res.token) { managerSession.set(res.token); navigate("/admin"); }
      else setError(res.error || "Неверный логин или пароль");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  // ── Менеджер — email/пароль ─────────────────────────────────────────────
  async function handleManagerEmailLogin() {
    if (!managerEmail.trim() || !password.trim()) { setError("Заполните email и пароль"); return; }
    setError(""); setLoading(true);
    try {
      const res = await managerApi.loginEmail(managerEmail.trim(), password.trim());
      if (res.token) { managerSession.set(res.token); navigate("/admin"); }
      else setError(res.error || "Неверный email или пароль");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  // ── Клиент OTP ──────────────────────────────────────────────────────────
  async function handleRequestOtp() {
    if (!phone.trim()) { setError("Введите номер телефона"); return; }
    if (channel === "email" && !email.trim()) { setError("Введите email"); return; }
    setError(""); setLoading(true);
    try {
      await clientApi.requestOtp(phone.trim(), channel, email.trim() || undefined);
      setOtpStep("code");
    } catch { setError("Ошибка отправки кода"); }
    finally { setLoading(false); }
  }

  async function handleVerifyOtp() {
    if (!code.trim()) { setError("Введите код"); return; }
    setError(""); setLoading(true);
    try {
      const res = await clientApi.verifyOtp(phone.trim(), code.trim());
      if (res.token) { clientSession.set(res.token); navigate("/cabinet"); }
      else setError(res.error || "Неверный код");
    } catch { setError("Ошибка проверки кода"); }
    finally { setLoading(false); }
  }

  // ── Клиент — пароль ─────────────────────────────────────────────────────
  async function handleClientPasswordLogin() {
    if (!clientPasswordPhone.trim() || !clientPassword.trim()) { setError("Введите телефон и пароль"); return; }
    setError(""); setLoading(true);
    try {
      const res = await clientApi.loginPassword(clientPasswordPhone.trim(), clientPassword.trim());
      if (res.token) { clientSession.set(res.token); navigate("/cabinet"); }
      else setError(res.error || "Неверный телефон или пароль");
    } catch { setError("Ошибка входа"); }
    finally { setLoading(false); }
  }

  // ── Техник — PIN ─────────────────────────────────────────────────────────
  async function handleTechLogin() {
    if (!selectedTechId || !pin.trim()) return;
    setError(""); setLoading(true);
    try {
      const res = await techApi.login(selectedTechId, pin.trim());
      if (res.token) { techSession.set(res.token); navigate("/techportal"); }
      else setError(res.error || "Неверный PIN");
    } catch { setError("Ошибка входа"); }
    finally { setLoading(false); }
  }

  // ── Техник — email/пароль ────────────────────────────────────────────────
  async function handleTechPasswordLogin() {
    if (!techEmail.trim() || !techPassword.trim()) { setError("Введите email и пароль"); return; }
    setError(""); setLoading(true);
    try {
      const res = await techApi.loginPassword(techEmail.trim(), techPassword.trim());
      if (res.token) { techSession.set(res.token); navigate("/techportal"); }
      else setError(res.error || "Неверный email или пароль");
    } catch { setError("Ошибка входа"); }
    finally { setLoading(false); }
  }

  // ── Сброс пароля: запрос ─────────────────────────────────────────────────
  async function handleForgot() {
    if (!forgotEmail.trim()) { setError("Введите email"); return; }
    setError(""); setLoading(true);
    try {
      const apiRole = role === "tech" ? "technician" : role === "manager" ? "manager" : "client";
      await authApi.resetRequest(forgotEmail.trim(), apiRole);
      setScreen("reset_sent");
    } catch { setError("Ошибка отправки"); }
    finally { setLoading(false); }
  }

  // ── Сброс пароля: подтверждение ──────────────────────────────────────────
  async function handleResetConfirm() {
    if (!newPassword.trim() || newPassword !== newPasswordConfirm) {
      setError("Пароли не совпадают или слишком короткие"); return;
    }
    if (newPassword.length < 6) { setError("Минимум 6 символов"); return; }
    setError(""); setLoading(true);
    try {
      const apiRole = resetRole === "tech" ? "technician" : resetRole === "manager" ? "manager" : "client";
      const res = await authApi.resetConfirm(resetToken!, newPassword.trim(), apiRole);
      if (res.reset) setScreen("reset_done");
      else setError(res.error || "Ошибка сброса пароля");
    } catch { setError("Ошибка"); }
    finally { setLoading(false); }
  }

  // ── Рендер ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex flex-col items-center justify-center px-4 font-golos">
      {/* Логотип */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
            alt="ProFiX" className="h-10 w-10 object-contain" />
          <span className="font-oswald text-2xl font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
          </span>
        </div>
        <p className="text-gray-400 text-sm">IT-сервис и автоматизация бизнеса</p>
      </div>

      <div className="w-full max-w-md">

        {/* ── Выбор роли ── */}
        {screen === "roles" && (
          <div className="space-y-3">
            <h1 className="font-oswald text-2xl font-bold text-gray-900 text-center mb-6">Войти в систему</h1>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => goRole(r.key)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group text-left">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.grad} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon name={r.icon as "User"} size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
                </div>
                <Icon name="ChevronRight" size={18} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
              </button>
            ))}
            <p className="text-center text-xs text-gray-400 mt-4">
              <button onClick={() => navigate("/")} className="hover:text-[#3ca615] transition-colors">← Вернуться на сайт</button>
            </p>
          </div>
        )}

        {/* ── Форма входа ── */}
        {screen === "form" && (
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
                {/* Переключатель метода */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  {[{v:"login",l:"Логин"},{v:"email",l:"Email"}].map(m => (
                    <button key={m.v} onClick={() => { setMethod(m.v as AuthMethod); setError(""); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${method === m.v ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                      {m.l}
                    </button>
                  ))}
                </div>
                {method === "login" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Логин</label>
                      <input type="text" value={login} onChange={e => setLogin(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleManagerLogin()}
                        placeholder="Введите логин" autoFocus
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Пароль</label>
                      <div className="relative">
                        <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleManagerLogin()}
                          placeholder="Введите пароль"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 pr-10" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                        </button>
                      </div>
                    </div>
                    <button onClick={handleManagerLogin} disabled={loading}
                      className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${cr.btn}`}>
                      {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                      {loading ? "Вход..." : "Войти"}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
                      <input type="email" value={managerEmail} onChange={e => setManagerEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleManagerEmailLogin()}
                        placeholder="your@email.com" autoFocus
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Пароль</label>
                      <div className="relative">
                        <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleManagerEmailLogin()}
                          placeholder="Введите пароль"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 pr-10" />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                        </button>
                      </div>
                    </div>
                    <button onClick={handleManagerEmailLogin} disabled={loading}
                      className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 ${cr.btn}`}>
                      {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                      {loading ? "Вход..." : "Войти"}
                    </button>
                  </>
                )}
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
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
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
                    <button onClick={handleRequestOtp} disabled={loading}
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
                      <input type="tel" value={clientPasswordPhone} onChange={e => setClientPasswordPhone(e.target.value)}
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
                    <button onClick={handleTechLogin} disabled={loading || !pin.trim()}
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
                    <button onClick={handleTechPasswordLogin} disabled={loading}
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
        )}

        {/* ── Восстановление пароля ── */}
        {screen === "forgot" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => { setScreen("form"); setError(""); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Icon name="ChevronLeft" size={18} />
              </button>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Восстановление пароля</p>
                <p className="text-xs text-gray-400">Ссылка придёт на email</p>
              </div>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={15} className="shrink-0" />{error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email аккаунта</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgot()}
                  placeholder="your@email.com" autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615]" />
              </div>
              <button onClick={handleForgot} disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2" style={{background:"#3ca615"}}>
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Mail" size={16} />}
                {loading ? "Отправка..." : "Отправить ссылку"}
              </button>
            </div>
          </div>
        )}

        {/* ── Письмо отправлено ── */}
        {screen === "reset_sent" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="Mail" size={28} className="text-[#3ca615]" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Письмо отправлено</h2>
            <p className="text-gray-500 text-sm mb-6">Проверьте почту и перейдите по ссылке для сброса пароля. Ссылка действует 30 минут.</p>
            <button onClick={() => { setScreen("form"); setError(""); }}
              className="text-sm text-[#3ca615] hover:underline">
              ← Вернуться ко входу
            </button>
          </div>
        )}

        {/* ── Новый пароль (по ссылке из письма) ── */}
        {screen === "reset_confirm" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#3ca615] flex items-center justify-center shrink-0">
                <Icon name="KeyRound" size={17} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Новый пароль</p>
                <p className="text-xs text-gray-400">Придумайте надёжный пароль</p>
              </div>
            </div>
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={15} className="shrink-0" />{error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Новый пароль</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Минимум 6 символов" autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615] pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Повторите пароль</label>
                <input type={showPass ? "text" : "password"} value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleResetConfirm()}
                  placeholder="Повторите пароль"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615]" />
              </div>
              {newPassword && newPasswordConfirm && newPassword !== newPasswordConfirm && (
                <p className="text-xs text-red-500">Пароли не совпадают</p>
              )}
              <button onClick={handleResetConfirm} disabled={loading || newPassword !== newPasswordConfirm || newPassword.length < 6}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2" style={{background:"#3ca615"}}>
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
                {loading ? "Сохранение..." : "Установить пароль"}
              </button>
            </div>
          </div>
        )}

        {/* ── Пароль сброшен ── */}
        {screen === "reset_done" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={28} className="text-[#3ca615]" />
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-2">Пароль установлен!</h2>
            <p className="text-gray-500 text-sm mb-6">Теперь вы можете войти используя новый пароль.</p>
            <button onClick={() => { setScreen("form"); setError(""); }}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{background:"#3ca615"}}>
              Войти
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
