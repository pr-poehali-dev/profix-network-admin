import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  clientApi, clientSession,
  managerApi, managerSession,
  techApi, techSession,
} from "@/lib/crm-api";

type Role = "manager" | "client" | "tech";

const ROLES = [
  {
    key: "client" as Role,
    label: "Личный кабинет",
    desc: "Клиент — отслеживайте заявки, общайтесь с менеджером",
    icon: "User",
    color: "from-blue-500 to-blue-600",
    light: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    key: "tech" as Role,
    label: "Портал специалиста",
    desc: "Технический специалист — управляйте своими заявками",
    icon: "Wrench",
    color: "from-[#3ca615] to-[#2d8a10]",
    light: "bg-green-50 border-green-200 text-green-700",
  },
  {
    key: "manager" as Role,
    label: "Панель управления",
    desc: "Менеджер или администратор — полный доступ к CRM",
    icon: "LayoutDashboard",
    color: "from-gray-700 to-gray-900",
    light: "bg-gray-50 border-gray-200 text-gray-700",
  },
];

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Manager
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  // Client OTP
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"email" | "telegram">("email");
  const [email, setEmail] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");

  // Tech
  const [techList, setTechList] = useState<{id:number;name:string;specialization?:string}[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [techStep, setTechStep] = useState<"select" | "pin">("select");

  // Проверяем существующие сессии
  useEffect(() => {
    const mt = managerSession.get();
    const ct = clientSession.get();
    const tt = techSession.get();
    if (mt) managerApi.verifyToken(mt).then(r => { if (r.valid) navigate("/admin"); }).catch(() => {});
    if (ct) clientApi.verifyToken(ct).then(r => { if (r.valid) navigate("/cabinet"); }).catch(() => {});
    if (tt) techApi.verifyToken(tt).then(r => { if (r.valid) navigate("/techportal"); }).catch(() => {});
  }, [navigate]);

  // Загружаем список техников при выборе роли
  useEffect(() => {
    if (role === "tech") {
      techApi.getTechniciansList().then(r => { if (r.technicians) setTechList(r.technicians); });
    }
  }, [role]);

  function back() {
    setRole(null);
    setError("");
    setOtpStep("phone");
    setTechStep("select");
    setLogin(""); setPassword(""); setPhone(""); setCode(""); setPin("");
  }

  // ── Менеджер ─────────────────────────────────────────────────────────────
  async function handleManagerLogin() {
    if (!login.trim() || !password.trim()) { setError("Заполните логин и пароль"); return; }
    setError(""); setLoading(true);
    try {
      const res = await managerApi.login(login.trim(), password.trim());
      if (res.token) {
        managerSession.set(res.token);
        navigate("/admin");
      } else {
        setError(res.error || "Неверный логин или пароль");
      }
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  // ── Клиент OTP ───────────────────────────────────────────────────────────
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
      if (res.token) {
        clientSession.set(res.token);
        navigate("/cabinet");
      } else {
        setError(res.error || "Неверный код");
      }
    } catch { setError("Ошибка проверки кода"); }
    finally { setLoading(false); }
  }

  // ── Техник ───────────────────────────────────────────────────────────────
  async function handleTechLogin() {
    if (!selectedTechId || !pin.trim()) return;
    setError(""); setLoading(true);
    try {
      const res = await techApi.login(selectedTechId, pin.trim());
      if (res.token) {
        techSession.set(res.token);
        navigate("/techportal");
      } else {
        setError(res.error || "Неверный PIN");
      }
    } catch { setError("Ошибка входа"); }
    finally { setLoading(false); }
  }

  const currentRole = ROLES.find(r => r.key === role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex flex-col items-center justify-center px-4 font-golos">

      {/* Логотип */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img
            src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
            alt="ProFiX" className="h-10 w-10 object-contain"
          />
          <span className="font-oswald text-2xl font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
          </span>
        </div>
        <p className="text-gray-500 text-sm">IT-сервис и автоматизация бизнеса</p>
      </div>

      <div className="w-full max-w-md">

        {/* ── Выбор роли ── */}
        {!role && (
          <div className="space-y-3">
            <h1 className="font-oswald text-2xl font-bold text-gray-900 text-center mb-6">Выберите способ входа</h1>
            {ROLES.map(r => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group text-left"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon name={r.icon as "User"} size={22} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{r.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{r.desc}</p>
                </div>
                <Icon name="ChevronRight" size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </button>
            ))}
            <p className="text-center text-xs text-gray-400 mt-4">
              <button onClick={() => navigate("/")} className="hover:text-[#3ca615] transition-colors">← Вернуться на сайт</button>
            </p>
          </div>
        )}

        {/* ── Форма входа ── */}
        {role && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
            {/* Шапка формы */}
            <div className="flex items-center gap-3 mb-5">
              <button onClick={back} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Icon name="ChevronLeft" size={18} />
              </button>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${currentRole!.color} flex items-center justify-center shrink-0`}>
                <Icon name={currentRole!.icon as "User"} size={17} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm leading-none">{currentRole!.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {role === "client" && otpStep === "code" ? "Введите код подтверждения" :
                   role === "tech" && techStep === "pin" ? "Введите PIN-код" :
                   "Войдите в свой аккаунт"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={15} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Менеджер */}
            {role === "manager" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Логин</label>
                  <input type="text" value={login} onChange={e => setLogin(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleManagerLogin()}
                    placeholder="Введите логин" autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Пароль</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleManagerLogin()}
                    placeholder="Введите пароль"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/20 focus:border-[#3ca615]" />
                </div>
                <button onClick={handleManagerLogin} disabled={loading}
                  className="w-full py-3 rounded-xl bg-[#111827] text-white font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                  {loading ? "Вход..." : "Войти"}
                </button>
              </div>
            )}

            {/* Клиент — шаг телефон */}
            {role === "client" && otpStep === "phone" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Номер телефона</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleRequestOtp()}
                    placeholder="+7 (999) 000-00-00" autoFocus
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">Способ получения кода</label>
                  <div className="flex gap-2">
                    {(["email", "telegram"] as const).map(ch => (
                      <button key={ch} onClick={() => setChannel(ch)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition ${
                          channel === ch ? "border-blue-400 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}>
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
                      onKeyDown={e => e.key === "Enter" && handleRequestOtp()}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                )}
                <button onClick={handleRequestOtp} disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
                  {loading ? "Отправка..." : "Получить код"}
                </button>
              </div>
            )}

            {/* Клиент — шаг код */}
            {role === "client" && otpStep === "code" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Код отправлен {channel === "email" ? `на ${email}` : "в Telegram"}
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Код подтверждения</label>
                  <input type="text" value={code} onChange={e => setCode(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                    placeholder="Введите код" autoFocus maxLength={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center text-xl tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                </div>
                <button onClick={handleVerifyOtp} disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                  {loading ? "Проверка..." : "Войти"}
                </button>
                <button onClick={() => { setOtpStep("phone"); setCode(""); setError(""); }}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
                  ← Изменить номер
                </button>
              </div>
            )}

            {/* Техник — выбор */}
            {role === "tech" && techStep === "select" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Выберите себя</p>
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
              </div>
            )}

            {/* Техник — PIN */}
            {role === "tech" && techStep === "pin" && (
              <div className="space-y-4">
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
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "#3ca615" }}>
                  {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
                  {loading ? "Вход..." : "Войти"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
