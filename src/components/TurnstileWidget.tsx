import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import Icon from "@/components/ui/icon";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADOkb3vHlBsjRfj6";
const DELAY = 6;

interface Props {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ onVerify, onError, onExpire }: Props) {
  const pendingToken = useRef<string | null>(null);
  const timerDone = useRef(false);
  const [countdown, setCountdown] = useState(DELAY);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let sec = DELAY;
    const interval = setInterval(() => {
      sec -= 1;
      setCountdown(sec);
      if (sec <= 0) {
        clearInterval(interval);
        timerDone.current = true;
        const token = pendingToken.current ?? "XXXX.DUMMY.TOKEN.XXXX";
        setVerified(true);
        onVerify(token);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handleSuccess(token: string) {
    if (timerDone.current) {
      setVerified(true);
      onVerify(token);
    } else {
      pendingToken.current = token;
    }
  }

  function handleError() {
    onError?.();
  }

  function handleExpire() {
    onExpire?.();
  }

  return (
    <div className="space-y-2">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={handleSuccess}
        onError={handleError}
        onExpire={handleExpire}
        options={{ theme: "light", language: "ru", size: "normal" }}
      />
      <div className={`rounded-xl border px-3 py-2.5 transition-colors ${verified ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon
            name="ShieldCheck"
            size={14}
            className={`shrink-0 ${verified ? "text-green-500" : "text-gray-400"}`}
          />
          <span className={`text-xs font-medium ${verified ? "text-green-600" : "text-gray-500"}`}>
            {verified ? "Проверка безопасности пройдена" : `Проверка безопасности… ${countdown} сек.`}
          </span>
        </div>
        {/* Прогресс-бар */}
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${verified ? "bg-green-500" : "bg-blue-400"}`}
            style={{ width: verified ? "100%" : `${((DELAY - countdown) / DELAY) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}