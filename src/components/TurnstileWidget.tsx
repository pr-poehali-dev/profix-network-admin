import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import Icon from "@/components/ui/icon";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADOkb3vHlBsjRfj6";
const DELAY = 4;

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
      {!verified ? (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Icon name="ShieldCheck" size={13} className="shrink-0 text-gray-300" />
          <span>
            Проверка безопасности…{" "}
            <span className="font-medium text-gray-500">
              кнопка будет доступна через {countdown} сек.
            </span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <Icon name="ShieldCheck" size={13} className="shrink-0" />
          <span>Проверка пройдена</span>
        </div>
      )}
    </div>
  );
}
