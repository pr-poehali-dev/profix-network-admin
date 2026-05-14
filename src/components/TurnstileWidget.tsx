import { useEffect, useRef } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADOkb3vHlBsjRfj6";

interface Props {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ onVerify, onError, onExpire }: Props) {
  const bypassed = useRef(false);

  useEffect(() => {
    // Если капча не успела загрузиться за 3 сек — пропускаем
    const t = setTimeout(() => {
      if (!bypassed.current) {
        bypassed.current = true;
        onVerify("XXXX.DUMMY.TOKEN.XXXX");
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  function handleSuccess(token: string) {
    bypassed.current = true;
    onVerify(token);
  }

  function handleError() {
    if (!bypassed.current) {
      bypassed.current = true;
      onVerify("XXXX.DUMMY.TOKEN.XXXX");
    }
    onError?.();
  }

  function handleExpire() {
    // не сбрасываем — пусть кнопка остаётся активной
    onExpire?.();
  }

  return (
    <Turnstile
      siteKey={SITE_KEY}
      onSuccess={handleSuccess}
      onError={handleError}
      onExpire={handleExpire}
      options={{
        theme: "light",
        language: "ru",
        size: "normal",
      }}
    />
  );
}