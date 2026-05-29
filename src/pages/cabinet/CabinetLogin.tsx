import { onPhoneChange } from "@/lib/phone";
import Icon from "@/components/ui/icon";

interface Props {
  step: "phone" | "code";
  phone: string;
  setPhone: (v: string) => void;
  channel: "email" | "telegram";
  setChannel: (v: "email" | "telegram") => void;
  email: string;
  setEmail: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  loading: boolean;
  error: string;
  setStep: (s: "phone" | "code") => void;
  setCode2: (v: string) => void;
  setError: (v: string) => void;
  handleRequestOtp: () => void;
  handleVerifyOtp: () => void;
}

export function CabinetLogin({
  step, phone, setPhone, channel, setChannel, email, setEmail,
  code, setCode, loading, error, setStep, setCode2, setError,
  handleRequestOtp, handleVerifyOtp,
}: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex items-center justify-center px-4 font-golos">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-oswald text-xl font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
          </span>
        </div>
        <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-2">Личный кабинет</p>
        <h1 className="font-oswald text-3xl font-bold text-[#0D1B2A] mb-6">Личный кабинет</h1>
        <p className="text-sm text-gray-500 mb-6">Войдите по номеру телефона</p>

        {step === "phone" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Номер телефона</label>
              <input
                type="tel"
                value={phone}
                onFocus={e => { if (!e.target.value) setPhone("+7"); }}
                onChange={(e) => onPhoneChange(e.target.value, setPhone)}
                placeholder="+7 (999) 000-00-00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Способ получения кода</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                    channel === "email"
                      ? "border-[#3ca615] bg-[#3ca615]/5 text-[#3ca615]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon name="Mail" size={15} />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("telegram")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                    channel === "telegram"
                      ? "border-[#3ca615] bg-[#3ca615]/5 text-[#3ca615]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <Icon name="Send" size={15} />
                  Telegram
                </button>
              </div>
            </div>

            {channel === "email" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email адрес</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.ru"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}

            <button
              onClick={handleRequestOtp}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#3ca615] font-semibold text-white text-sm shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {loading ? "Отправка..." : "Получить код"}
            </button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-5">
            <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-800">
              Код отправлен на{" "}
              <span className="font-medium">
                {channel === "email" ? email || phone : "Telegram"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Код подтверждения</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#3ca615] font-semibold text-white text-sm shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {loading ? "Проверка..." : "Войти"}
            </button>

            <button
              onClick={() => { setStep("phone"); setCode2(""); setError(""); }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
            >
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
