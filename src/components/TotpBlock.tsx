import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { totpApi } from "@/lib/crm-api";

type Role = "client" | "manager" | "technician";

interface Props {
  role: Role;
}

export default function TotpBlock({ role }: Props) {
  const [enabled, setEnabled]     = useState(false);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState<"idle" | "qr" | "verify" | "disable">("idle");
  const [uri, setUri]             = useState("");
  const [secret, setSecret]       = useState("");
  const [code, setCode]           = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    totpApi.status(role).then(r => {
      setEnabled(!!r.totp_enabled);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [role]);

  async function handleGenerate() {
    setError(""); setSuccess("");
    const r = await totpApi.generate(role);
    if (r.uri) {
      setUri(r.uri);
      setSecret(r.secret || "");
      setStep("qr");
    } else {
      setError(r.error || "Ошибка генерации");
    }
  }

  async function handleEnable() {
    if (!code.trim()) { setError("Введите код из приложения"); return; }
    setError("");
    const r = await totpApi.enable(role, code.trim());
    if (r.enabled) {
      setEnabled(true);
      setStep("idle");
      setCode("");
      setSuccess("Аутентификатор подключён!");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(r.error || "Неверный код");
    }
  }

  async function handleDisable() {
    if (!code.trim()) { setError("Введите код для подтверждения"); return; }
    setError("");
    const r = await totpApi.disable(role, code.trim());
    if (r.disabled) {
      setEnabled(false);
      setStep("idle");
      setCode("");
      setSuccess("Аутентификатор отключён");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(r.error || "Неверный код");
    }
  }

  // QR через Google Charts API
  const qrUrl = uri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uri)}`
    : "";

  if (loading) return null;

  return (
    <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${enabled ? "bg-[#edf7e8]" : "bg-gray-100"}`}>
            <Icon name="Shield" size={16} className={enabled ? "text-[#3ca615]" : "text-gray-400"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Google Authenticator</p>
            <p className="text-xs text-gray-400">{enabled ? "Подключён — вход через приложение" : "Не подключён — вход через Email"}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${enabled ? "bg-[#edf7e8] text-[#3ca615]" : "bg-gray-100 text-gray-500"}`}>
          {enabled ? "Включён" : "Выключен"}
        </span>
      </div>

      {success && <p className="text-sm text-[#3ca615] font-medium flex items-center gap-1"><Icon name="CheckCircle" size={14} />{success}</p>}
      {error   && <p className="text-sm text-red-500 flex items-center gap-1"><Icon name="AlertCircle" size={14} />{error}</p>}

      {/* Шаг: показать QR */}
      {step === "qr" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            1. Установите <b>Google Authenticator</b> или <b>Яндекс Ключ</b><br/>
            2. Отсканируйте QR-код или введите секрет вручную<br/>
            3. Введите 6-значный код из приложения
          </p>
          <div className="flex justify-center">
            <img src={qrUrl} alt="QR" className="rounded-xl border border-gray-100" width={200} height={200} />
          </div>
          {secret && (
            <div className="bg-gray-50 rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-gray-400 mb-1">Или введите секрет вручную:</p>
              <p className="font-mono text-sm font-bold text-gray-800 tracking-widest break-all">{secret}</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Код из приложения *</label>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000"
              maxLength={6}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest focus:outline-none focus:border-green-400"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleEnable} disabled={code.length < 6}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#3ca615", color: "#fff" }}>
              Подтвердить и включить
            </button>
            <button onClick={() => { setStep("idle"); setCode(""); setError(""); }}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Шаг: отключить */}
      {step === "disable" && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">Введите код из приложения для подтверждения отключения:</p>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
            placeholder="000000"
            maxLength={6}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono text-center tracking-widest focus:outline-none focus:border-green-400"
          />
          <div className="flex gap-2">
            <button onClick={handleDisable} disabled={code.length < 6}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 disabled:opacity-50">
              Отключить
            </button>
            <button onClick={() => { setStep("idle"); setCode(""); setError(""); }}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Кнопки в состоянии idle */}
      {step === "idle" && (
        <div>
          {!enabled ? (
            <button onClick={handleGenerate}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#3ca615", color: "#fff" }}>
              Подключить аутентификатор
            </button>
          ) : (
            <button onClick={() => { setStep("disable"); setCode(""); setError(""); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50">
              Отключить аутентификатор
            </button>
          )}
        </div>
      )}
    </div>
  );
}
