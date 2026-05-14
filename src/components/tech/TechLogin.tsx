import { useState } from "react";
import Icon from "@/components/ui/icon";
import TurnstileWidget from "@/components/TurnstileWidget";

interface TechListItem { id: number; name: string; specialization?: string }

interface Props {
  step: "select" | "pin";
  techList: TechListItem[];
  pin: string;
  loading: boolean;
  error: string;
  isInstalled: boolean;
  installPrompt: Event | null;
  onSelectTech: (id: number) => void;
  onPinChange: (pin: string) => void;
  onLogin: () => void;
  onBack: () => void;
  onInstall: () => void;
  onNavigateHome: () => void;
}

export default function TechLogin({
  step, techList, pin, loading, error,
  isInstalled, installPrompt,
  onSelectTech, onPinChange, onLogin, onBack, onInstall, onNavigateHome,
}: Props) {
  const [cfToken, setCfToken] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-[#edf7e8] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="Wrench" size={28} className="text-[#3ca615]" />
          </div>
          <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-2">ProFiX</p>
          <h1 className="font-oswald text-3xl font-bold text-[#0D1B2A]">Портал специалиста</h1>
        </div>

        {!isInstalled && installPrompt && (
          <button
            onClick={onInstall}
            className="w-full flex items-center justify-center gap-2 bg-[#3ca615] text-white rounded-xl py-3 text-sm font-semibold mb-5 hover:bg-[#2d8a10] transition"
          >
            <Icon name="Download" size={16} />
            Установить приложение на телефон
          </button>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
            <Icon name="AlertCircle" size={16} className="text-red-500 shrink-0" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {step === "select" && (
          <>
            <div className="space-y-2 mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Выберите себя
              </label>
              {techList.map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelectTech(t.id)}
                  className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#3ca615] hover:bg-[#edf7e8] transition-all"
                >
                  <div className="w-10 h-10 bg-[#edf7e8] rounded-xl flex items-center justify-center shrink-0">
                    <Icon name="UserCheck" size={18} className="text-[#3ca615]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#111827]">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.specialization || "Специалист"}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 ml-auto" />
                </button>
              ))}
            </div>
            <button
              onClick={onNavigateHome}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← На главную
            </button>
          </>
        )}

        {step === "pin" && (
          <>
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
            >
              <Icon name="ChevronLeft" size={16} /> Назад
            </button>
            <p className="text-sm text-gray-500 mb-4">
              Введите PIN-код для входа
            </p>
            <input
              type="password"
              value={pin}
              onChange={e => onPinChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && cfToken && onLogin()}
              placeholder="PIN-код"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 mb-4"
            />
            <TurnstileWidget onVerify={setCfToken} onExpire={() => {}} />
            <button
              onClick={onLogin}
              disabled={loading || !pin.trim() || !cfToken}
              className="w-full bg-[#3ca615] text-white py-3 rounded-xl font-semibold shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-3"
            >
              {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="LogIn" size={18} />}
              Войти
            </button>
          </>
        )}
      </div>
    </div>
  );
}