import Icon from "@/components/ui/icon";
import TurnstileWidget from "@/components/TurnstileWidget";
import { onPhoneChange } from "@/lib/phone";
import { Role } from "./LoginTypes";

// ── 2FA менеджер ────────────────────────────────────────────────────────────

interface MfaProps {
  mfaEmailMasked: string;
  mfaCode: string;
  setMfaCode: (v: string) => void;
  mfaError: string;
  mfaLoading: boolean;
  handleMfaVerify: () => void;
  setScreen: (s: string) => void;
}

export function LoginMfaScreen({ mfaEmailMasked, mfaCode, setMfaCode, mfaError, mfaLoading, handleMfaVerify, setScreen }: MfaProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => setScreen("form")}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shrink-0">
          <Icon name="ShieldCheck" size={17} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Подтверждение входа</p>
          <p className="text-xs text-gray-400">Двухфакторная аутентификация</p>
        </div>
      </div>

      <div className="mb-5 p-4 bg-gray-50 rounded-xl flex items-start gap-3">
        <Icon name="Mail" size={18} className="text-gray-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-700">Код подтверждения отправлен на</p>
          <p className="text-sm font-semibold text-gray-900">{mfaEmailMasked}</p>
          <p className="text-xs text-gray-400 mt-1">Код действует 10 минут</p>
        </div>
      </div>

      {mfaError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <Icon name="AlertCircle" size={15} className="shrink-0" />
          {mfaError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Код из письма</label>
          <input
            type="text" value={mfaCode}
            onChange={e => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && handleMfaVerify()}
            placeholder="000000" maxLength={6} autoFocus
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400"
          />
        </div>
        <button onClick={handleMfaVerify} disabled={mfaLoading || mfaCode.length < 6}
          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {mfaLoading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
          {mfaLoading ? "Проверка..." : "Подтвердить и войти"}
        </button>
        <button onClick={() => setScreen("form")}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Вернуться к вводу пароля
        </button>
      </div>
    </div>
  );
}

// ── TOTP верификация ─────────────────────────────────────────────────────────

interface TotpProps {
  totpCode: string;
  setTotpCode: (v: string) => void;
  totpError: string;
  totpLoading: boolean;
  handleTotpVerify: () => void;
  setScreen: (s: string) => void;
  setTotpError: (v: string) => void;
}

export function LoginTotpScreen({ totpCode, setTotpCode, totpError, totpLoading, handleTotpVerify, setScreen, setTotpError }: TotpProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { setScreen("form"); setTotpCode(""); setTotpError(""); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3ca615] to-[#2d8a10] flex items-center justify-center shrink-0">
          <Icon name="Shield" size={17} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Двухфакторная аутентификация</p>
          <p className="text-xs text-gray-400">Google Authenticator</p>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-[#edf7e8] border border-green-100 rounded-xl px-4 py-3 mb-5">
        <Icon name="Smartphone" size={18} className="text-[#3ca615] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-gray-700">Откройте приложение аутентификатор</p>
          <p className="text-xs text-gray-400 mt-0.5">и введите 6-значный код для ПРОФИКС</p>
        </div>
      </div>

      {totpError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <Icon name="AlertCircle" size={15} className="shrink-0" />
          {totpError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Код из приложения</label>
          <input
            type="text" value={totpCode}
            onChange={e => { setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setTotpError(""); }}
            onKeyDown={e => e.key === "Enter" && handleTotpVerify()}
            placeholder="000000" maxLength={6} autoFocus
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615]"
          />
        </div>
        <button onClick={handleTotpVerify} disabled={totpLoading || totpCode.length < 6}
          className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "#3ca615" }}>
          {totpLoading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="LogIn" size={16} />}
          {totpLoading ? "Проверка..." : "Войти"}
        </button>
        <button onClick={() => { setScreen("form"); setTotpCode(""); setTotpError(""); }}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
          ← Вернуться к вводу пароля
        </button>
      </div>
    </div>
  );
}

// ── Регистрация клиента ──────────────────────────────────────────────────────

interface RegisterProps {
  regName: string; setRegName: (v: string) => void;
  regPhone: string; setRegPhone: (v: string) => void;
  regEmail: string; setRegEmail: (v: string) => void;
  regPdConsent: boolean; setRegPdConsent: (v: boolean) => void;
  regLoading: boolean;
  regError: string;
  cfToken: string;
  setCfToken: (v: string) => void;
  handleRegister: () => void;
  setScreen: (s: string) => void;
  setRegError: (v: string) => void;
}

export function LoginRegisterScreen({
  regName, setRegName, regPhone, setRegPhone, regEmail, setRegEmail,
  regPdConsent, setRegPdConsent, regLoading, regError,
  cfToken, setCfToken, handleRegister, setScreen, setRegError,
}: RegisterProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => { setScreen("roles"); setRegError(""); }}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
          <Icon name="UserPlus" size={17} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">Регистрация</p>
          <p className="text-xs text-gray-400">Личный кабинет клиента</p>
        </div>
      </div>

      {regError && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
          <Icon name="AlertCircle" size={15} className="shrink-0" />
          {regError}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Имя *</label>
          <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
            placeholder="Иван Иванов" autoFocus
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Телефон *</label>
          <input type="tel" value={regPhone}
            onFocus={e => { if (!e.target.value) setRegPhone("+7"); }}
            onChange={e => onPhoneChange(e.target.value, setRegPhone)}
            placeholder="+7 (999) 000-00-00"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email (необязательно)</label>
          <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400" />
        </div>

        {/* Согласие на обработку ПД */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input type="checkbox" checked={regPdConsent} onChange={e => setRegPdConsent(e.target.checked)} className="sr-only" />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${regPdConsent ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}>
              {regPdConsent && <Icon name="Check" size={12} className="text-white" />}
            </div>
          </div>
          <span className="text-xs text-gray-500 leading-relaxed">
            Я согласен(а) на{" "}
            <a href="/privacy" target="_blank" className="text-blue-600 underline hover:text-blue-800">
              обработку персональных данных
            </a>{" "}
            в соответствии с Федеральным законом №152-ФЗ
          </span>
        </label>

        <TurnstileWidget onVerify={setCfToken} onExpire={() => setCfToken("")} />

        <button onClick={handleRegister} disabled={regLoading || !cfToken || !regPdConsent}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {regLoading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
          {regLoading ? "Регистрация..." : "Создать аккаунт"}
        </button>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Уже есть аккаунт?{" "}
          <button onClick={() => { setScreen("form"); setRegError(""); }}
            className="text-blue-600 hover:underline">Войти</button>
        </p>
      </div>
    </div>
  );
}

// ── Успешная регистрация ─────────────────────────────────────────────────────

interface RegisterDoneProps {
  setScreen: (s: string) => void;
}

export function LoginRegisterDoneScreen({ setScreen }: RegisterDoneProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
      <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon name="CheckCircle" size={28} className="text-blue-600" />
      </div>
      <h2 className="font-bold text-gray-900 text-lg mb-2">Заявка принята!</h2>
      <p className="text-gray-500 text-sm mb-6">
        Ваша заявка на регистрацию отправлена. Менеджер свяжется с вами для подтверждения доступа.
      </p>
      <button onClick={() => setScreen("roles")}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
        <Icon name="LogIn" size={16} /> Перейти ко входу
      </button>
    </div>
  );
}

// ── Восстановление пароля ────────────────────────────────────────────────────

interface ForgotProps {
  forgotEmail: string;
  setForgotEmail: (v: string) => void;
  error: string;
  loading: boolean;
  handleForgot: () => void;
  setScreen: (s: string) => void;
  setError: (v: string) => void;
}

export function LoginForgotScreen({ forgotEmail, setForgotEmail, error, loading, handleForgot, setScreen, setError }: ForgotProps) {
  return (
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
  );
}

// ── Письмо отправлено ────────────────────────────────────────────────────────

interface ResetSentProps {
  setScreen: (s: string) => void;
  setError: (v: string) => void;
}

export function LoginResetSentScreen({ setScreen, setError }: ResetSentProps) {
  return (
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
  );
}

// ── Новый пароль (по ссылке из письма) ───────────────────────────────────────

interface ResetConfirmProps {
  newPassword: string; setNewPassword: (v: string) => void;
  newPasswordConfirm: string; setNewPasswordConfirm: (v: string) => void;
  showPass: boolean; setShowPass: (v: boolean) => void;
  error: string;
  loading: boolean;
  handleResetConfirm: () => void;
}

export function LoginResetConfirmScreen({
  newPassword, setNewPassword, newPasswordConfirm, setNewPasswordConfirm,
  showPass, setShowPass, error, loading, handleResetConfirm,
}: ResetConfirmProps) {
  return (
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
  );
}

// ── Пароль сброшен ───────────────────────────────────────────────────────────

interface ResetDoneProps {
  savedResetRole: Role;
  setScreen: (s: string) => void;
  setRole: (r: Role) => void;
  setMethod: (m: string) => void;
  setError: (v: string) => void;
}

export function LoginResetDoneScreen({ savedResetRole, setScreen, setRole, setMethod, setError }: ResetDoneProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 text-center">
      <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon name="CheckCircle" size={28} className="text-[#3ca615]" />
      </div>
      <h2 className="font-bold text-gray-900 text-lg mb-2">Пароль установлен!</h2>
      <p className="text-gray-500 text-sm mb-6">Теперь вы можете войти используя новый пароль.</p>
      <button onClick={() => { setScreen("form"); setRole(savedResetRole); setMethod("password"); setError(""); }}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{background:"#3ca615"}}>
        Войти с новым паролем
      </button>
    </div>
  );
}