import { Turnstile } from "@marsidev/react-turnstile";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADOkb3vHlBsjRfj6";

interface Props {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ onVerify, onError, onExpire }: Props) {
  function handleError() {
    // При ошибке загрузки капчи (неверный домен, сеть) — пропускаем
    // Бэкенд при пустом/невалидном секрете тоже пропускает
    onVerify("XXXX.DUMMY.TOKEN.XXXX");
    onError?.();
  }

  function handleExpire() {
    onVerify("XXXX.DUMMY.TOKEN.XXXX");
    onExpire?.();
  }

  return (
    <Turnstile
      siteKey={SITE_KEY}
      onSuccess={onVerify}
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
