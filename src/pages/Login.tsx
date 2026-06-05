import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  clientApi, clientSession,
  managerApi, managerSession,
  techApi, techSession,
  authApi, totpApi,
} from "@/lib/crm-api";

import { Role, AuthMethod, Screen, ROLES } from "./login/LoginTypes";
import { LoginFormScreen } from "./login/LoginFormScreen";
import {
  LoginMfaScreen,
  LoginTotpScreen,
  LoginRegisterScreen,
  LoginRegisterDoneScreen,
  LoginForgotScreen,
  LoginResetSentScreen,
  LoginResetConfirmScreen,
  LoginResetDoneScreen,
} from "./login/LoginSecondaryScreens";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resetToken = params.get("reset");
  const resetRole  = (params.get("role") || "client") as Role;

  const [savedResetToken] = useState<string | null>(resetToken);
  const [savedResetRole] = useState<Role>(resetRole);

  const [screen, setScreen] = useState<Screen>(resetToken ? "reset_confirm" : "roles");
  const [role, setRole] = useState<Role>(resetToken ? resetRole : "client");
  const [method, setMethod] = useState<AuthMethod>("otp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cfToken, setCfToken] = useState("");

  // Менеджер
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

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

  // 2FA менеджер
  const [mfaManagerId, setMfaManagerId] = useState<number | null>(null);
  const [mfaEmailMasked, setMfaEmailMasked] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState("");

  // TOTP — общий для всех ролей
  const [totpUserId, setTotpUserId] = useState<number | null>(null);
  const [totpRole, setTotpRole] = useState<"manager" | "technician" | "client">("manager");
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpError, setTotpError] = useState("");

  // Регистрация клиента
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPdConsent, setRegPdConsent] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");

  // Forgot / Reset
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Проверяем существующие сессии
  useEffect(() => {
    if (resetToken) return;
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

  // ── Менеджер — логин/пароль → шаг 1 ────────────────────────────────────
  async function handleManagerLogin() {
    if (!login.trim() || !password.trim()) { setError("Заполните логин и пароль"); return; }
    if (!cfToken) { setError("Пожалуйста, подождите проверку безопасности"); return; }
    setError(""); setLoading(true);
    try {
      const res = await managerApi.login(login.trim(), password.trim(), cfToken);
      if (res.totp_required) {
        setTotpUserId(res.manager_id); setTotpRole("manager"); setTotpCode(""); setTotpError("");
        setScreen("totp");
      } else if (res.mfa) {
        setMfaManagerId(res.manager_id); setMfaEmailMasked(res.email_masked); setMfaCode(""); setMfaError("");
        setScreen("mfa");
      } else if (res.token) { managerSession.set(res.token); navigate("/admin"); }
      else setError(res.error || "Неверный логин или пароль");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  // ── Менеджер — email/пароль → шаг 1 ─────────────────────────────────────
  async function handleManagerEmailLogin() {
    if (!login.trim() || !password.trim()) { setError("Заполните email и пароль"); return; }
    if (!cfToken) { setError("Пожалуйста, подождите проверку безопасности"); return; }
    setError(""); setLoading(true);
    try {
      const res = await managerApi.loginEmail(login.trim(), password.trim(), cfToken);
      if (res.totp_required) {
        setTotpUserId(res.manager_id); setTotpRole("manager"); setTotpCode(""); setTotpError("");
        setScreen("totp");
      } else if (res.mfa) {
        setMfaManagerId(res.manager_id); setMfaEmailMasked(res.email_masked); setMfaCode(""); setMfaError("");
        setScreen("mfa");
      } else if (res.token) { managerSession.set(res.token); navigate("/admin"); }
      else setError(res.error || "Неверный email или пароль");
    } catch { setError("Ошибка соединения"); }
    finally { setLoading(false); }
  }

  // ── Менеджер — шаг 2: проверка 2FA кода ─────────────────────────────────
  async function handleMfaVerify() {
    if (!mfaCode.trim() || mfaCode.length < 6) { setMfaError("Введите 6-значный код"); return; }
    setMfaError(""); setMfaLoading(true);
    try {
      const res = await managerApi.verify2fa(mfaManagerId!, mfaCode.trim());
      if (res.token) { managerSession.set(res.token); navigate("/admin"); }
      else setMfaError(res.error || "Неверный код");
    } catch { setMfaError("Ошибка соединения"); }
    finally { setMfaLoading(false); }
  }

  // ── Клиент OTP ──────────────────────────────────────────────────────────
  async function handleRequestOtp() {
    if (!phone.trim()) { setError("Введите номер телефона"); return; }
    if (channel === "email" && !email.trim()) { setError("Введите email"); return; }
    if (!cfToken) { setError("Пожалуйста, подождите проверку безопасности"); return; }
    setError(""); setLoading(true);
    try {
      await clientApi.requestOtp(phone.trim(), channel, email.trim() || undefined, cfToken);
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
      if (res.totp_required) {
        setTotpUserId(res.technician_id); setTotpRole("technician"); setTotpCode(""); setTotpError("");
        setScreen("totp");
      } else if (res.token) { techSession.set(res.token); navigate("/techportal"); }
      else setError(res.error || "Неверный email или пароль");
    } catch { setError("Ошибка входа"); }
    finally { setLoading(false); }
  }

  // ── TOTP верификация при входе ───────────────────────────────────────────
  async function handleTotpVerify() {
    if (!totpCode.trim() || totpCode.length < 6) { setTotpError("Введите 6-значный код"); return; }
    if (!totpUserId) return;
    setTotpError(""); setTotpLoading(true);
    try {
      const res = await totpApi.verifyLogin(totpRole, totpUserId, totpCode.trim());
      if (res.token) {
        if (totpRole === "manager") { managerSession.set(res.token); navigate("/admin"); }
        else if (totpRole === "technician") { techSession.set(res.token); navigate("/techportal"); }
        else { clientSession.set(res.token); navigate("/cabinet"); }
      } else setTotpError(res.error || "Неверный код");
    } catch { setTotpError("Ошибка соединения"); }
    finally { setTotpLoading(false); }
  }

  // ── Регистрация клиента ──────────────────────────────────────────────────
  async function handleRegister() {
    if (!regName.trim()) { setRegError("Введите имя"); return; }
    if (!regPhone.trim()) { setRegError("Введите телефон"); return; }
    if (!regPdConsent) { setRegError("Необходимо согласие на обработку персональных данных"); return; }
    if (!cfToken) { setRegError("Пожалуйста, подождите проверку безопасности"); return; }
    setRegError(""); setRegLoading(true);
    try {
      const res = await clientApi.register({
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim() || undefined,
        cf_token: cfToken,
      });
      if (res.ok || res.token) {
        if (res.token) { clientSession.set(res.token); navigate("/cabinet"); }
        else setScreen("register_done");
      } else {
        setRegError(res.error || "Ошибка регистрации. Попробуйте позже.");
      }
    } catch { setRegError("Ошибка соединения"); }
    finally { setRegLoading(false); }
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
      const apiRole = savedResetRole === "tech" ? "technician" : savedResetRole === "manager" ? "manager" : "client";
      const res = await authApi.resetConfirm(savedResetToken!, newPassword.trim(), apiRole);
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
            alt="ПРОФИКС" className="h-10 w-10 object-contain" />
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
            <div className="mt-5 pt-4 border-t border-gray-100 text-center space-y-2">
              <p className="text-xs text-gray-400">Ещё нет личного кабинета?</p>
              <button
                onClick={() => { setScreen("register"); setRegError(""); setCfToken(""); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-colors">
                <Icon name="UserPlus" size={15} />
                Зарегистрироваться
              </button>
              <p className="text-center text-xs text-gray-400 pt-1">
                <button onClick={() => navigate("/")} className="hover:text-[#3ca615] transition-colors">← Вернуться на сайт</button>
              </p>
            </div>
          </div>
        )}

        {/* ── Форма входа ── */}
        {screen === "form" && (
          <LoginFormScreen
            role={role} method={method} setMethod={setMethod}
            error={error} loading={loading} showPass={showPass} setShowPass={setShowPass}
            cfToken={cfToken} setCfToken={setCfToken} cr={cr}
            login={login} setLogin={setLogin} password={password} setPassword={setPassword}
            handleManagerLogin={handleManagerLogin} handleManagerEmailLogin={handleManagerEmailLogin}
            phone={phone} setPhone={setPhone} channel={channel} setChannel={setChannel}
            email={email} setEmail={setEmail} otpStep={otpStep} setOtpStep={setOtpStep}
            code={code} setCode={setCode} handleRequestOtp={handleRequestOtp} handleVerifyOtp={handleVerifyOtp}
            clientPasswordPhone={clientPasswordPhone} setClientPasswordPhone={setClientPasswordPhone}
            clientPassword={clientPassword} setClientPassword={setClientPassword}
            handleClientPasswordLogin={handleClientPasswordLogin}
            techList={techList} selectedTechId={selectedTechId} setSelectedTechId={setSelectedTechId}
            pin={pin} setPin={setPin} techStep={techStep} setTechStep={setTechStep}
            techEmail={techEmail} setTechEmail={setTechEmail}
            techPassword={techPassword} setTechPassword={setTechPassword}
            handleTechLogin={handleTechLogin} handleTechPasswordLogin={handleTechPasswordLogin}
            setError={setError} setScreen={setScreen} back={back}
          />
        )}

        {/* ── 2FA менеджер ── */}
        {screen === "mfa" && (
          <LoginMfaScreen
            mfaEmailMasked={mfaEmailMasked}
            mfaCode={mfaCode} setMfaCode={setMfaCode}
            mfaError={mfaError} mfaLoading={mfaLoading}
            handleMfaVerify={handleMfaVerify}
            setScreen={setScreen}
          />
        )}

        {/* ── TOTP верификация ── */}
        {screen === "totp" && (
          <LoginTotpScreen
            totpCode={totpCode} setTotpCode={setTotpCode}
            totpError={totpError} setTotpError={setTotpError}
            totpLoading={totpLoading}
            handleTotpVerify={handleTotpVerify}
            setScreen={setScreen}
          />
        )}

        {/* ── Регистрация клиента ── */}
        {screen === "register" && (
          <LoginRegisterScreen
            regName={regName} setRegName={setRegName}
            regPhone={regPhone} setRegPhone={setRegPhone}
            regEmail={regEmail} setRegEmail={setRegEmail}
            regPdConsent={regPdConsent} setRegPdConsent={setRegPdConsent}
            regLoading={regLoading} regError={regError} setRegError={setRegError}
            cfToken={cfToken} setCfToken={setCfToken}
            handleRegister={handleRegister}
            setScreen={setScreen}
          />
        )}

        {/* ── Успешная регистрация ── */}
        {screen === "register_done" && (
          <LoginRegisterDoneScreen setScreen={setScreen} />
        )}

        {/* ── Восстановление пароля ── */}
        {screen === "forgot" && (
          <LoginForgotScreen
            forgotEmail={forgotEmail} setForgotEmail={setForgotEmail}
            error={error} loading={loading}
            handleForgot={handleForgot}
            setScreen={setScreen} setError={setError}
          />
        )}

        {/* ── Письмо отправлено ── */}
        {screen === "reset_sent" && (
          <LoginResetSentScreen setScreen={setScreen} setError={setError} />
        )}

        {/* ── Новый пароль (по ссылке из письма) ── */}
        {screen === "reset_confirm" && (
          <LoginResetConfirmScreen
            newPassword={newPassword} setNewPassword={setNewPassword}
            newPasswordConfirm={newPasswordConfirm} setNewPasswordConfirm={setNewPasswordConfirm}
            showPass={showPass} setShowPass={setShowPass}
            error={error} loading={loading}
            handleResetConfirm={handleResetConfirm}
          />
        )}

        {/* ── Пароль сброшен ── */}
        {screen === "reset_done" && (
          <LoginResetDoneScreen
            savedResetRole={savedResetRole}
            setScreen={setScreen} setRole={setRole}
            setMethod={setMethod} setError={setError}
          />
        )}

      </div>
    </div>
  );
}