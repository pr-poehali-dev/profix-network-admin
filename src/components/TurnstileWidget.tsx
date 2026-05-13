import { Turnstile } from "@marsidev/react-turnstile";

// Тестовый ключ Cloudflare (всегда проходит) — замените на реальный из dash.cloudflare.com → Turnstile
// Реальный Site Key добавьте в src/lib/config.ts после получения в Cloudflare
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

interface Props {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export default function TurnstileWidget({ onVerify, onError, onExpire }: Props) {
  return (
    <Turnstile
      siteKey={SITE_KEY}
      onSuccess={onVerify}
      onError={onError}
      onExpire={onExpire}
      options={{
        theme: "light",
        language: "ru",
        size: "normal",
      }}
    />
  );
}
