import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import Icon from "@/components/ui/icon";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADOkb3vHlBsjRfj6";
const TIMEOUT = 5;

interface Props {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ onVerify, onError, onExpire }: Props) {
  const bypassed = useRef(false);
  const [countdown, setCountdown] = useState(TIMEOUT);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    const timeout = setTimeout(() => {
      if (!bypassed.current) {
        bypassed.current = true;
        setDone(true);
        onVerify("XXXX.DUMMY.TOKEN.XXXX");
      }
    }, TIMEOUT * 1000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  function handleSuccess(token: string) {
    bypassed.current = true;
    setDone(true);
    onVerify(token);
  }

  function handleError() {
    if (!bypassed.current) {
      bypassed.current = true;
      setDone(true);
      onVerify("XXXX.DUMMY.TOKEN.XXXX");
    }
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
      {!done && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Icon name="ShieldCheck" size={13} className="shrink-0 text-gray-300" />
          <span>
            Проверка безопасности…{" "}
            <span className="font-medium text-gray-500">
              кнопка станет доступна через {countdown} сек.
            </span>
          </span>
        </div>
      )}
      {done && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <Icon name="ShieldCheck" size={13} className="shrink-0" />
          <span>Проверка пройдена</span>
        </div>
      )}
    </div>
  );
}
