import { useEffect, useRef, useState } from "react";
import { loadTheme, SiteTheme } from "@/hooks/useTheme";

const PARTICLE_COUNT = 60;

interface Particle {
  id: number;
  x: number;
  speed: number;
  size: number;
  opacity: number;
  delay: number;
  char: string;
  variantIdx: number;
}

function makeParticles(chars: string[]): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    speed: 5 + Math.random() * 5,
    size: 10 + Math.random() * 18,
    opacity: 0.5 + Math.random() * 0.5,
    delay: Math.random() * 12,
    char: chars[Math.floor(Math.random() * chars.length)],
    variantIdx: i % 5,
  }));
}

const EFFECTS: Record<string, { chars: string[] }> = {
  newyear:   { chars: ["❄️","⛄","🎄","✨","🌟","❅","❆","🎁","🔔"] },
  march8:    { chars: ["🌸","🌷","🌺","💐","🌹","🌼","💗","🦋"] },
  feb23:     { chars: ["⭐","🎖️","🎗️","🚀","✈️","🛡️","💪"] },
  may9:      { chars: ["🎗️","🌹","⭐","🕊️","🔥","🎇"] },
  halloween: { chars: ["🎃","👻","🕷️","🕸️","🦇","💀","🌙","🔮"] },
  birthday:  { chars: ["🎂","🎈","🎉","🎊","🎁","✨","🥳","⭐"] },
};

const FALL_VARIANTS = [
  "translateY(110vh) rotate(360deg) translateX(40px)",
  "translateY(110vh) rotate(-280deg) translateX(-50px)",
  "translateY(110vh) rotate(200deg) translateX(30px)",
  "translateY(110vh) rotate(-180deg) translateX(-35px)",
  "translateY(110vh) rotate(320deg) translateX(55px)",
];

export default function HolidayEffects() {
  const [holiday, setHoliday] = useState<string>(() => loadTheme().holiday);
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // BroadcastChannel — мгновенная реакция внутри браузера (другие вкладки и та же вкладка)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("profix_theme");
      bc.onmessage = (e: MessageEvent<SiteTheme>) => {
        setHoliday(e.data.holiday ?? "none");
      };
    } catch { /* ignore */ }

    // Storage event — реакция на изменение localStorage из другой вкладки
    function onStorage(e: StorageEvent) {
      if (e.key === "profix_site_theme") {
        try {
          const t = JSON.parse(e.newValue || "{}");
          if (t.holiday !== undefined) setHoliday(t.holiday);
        } catch { /* ignore */ }
      }
    }
    window.addEventListener("storage", onStorage);

    return () => {
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const eff = EFFECTS[holiday];
    if (!eff) { setParticles([]); return; }
    setParticles(makeParticles(eff.chars));
  }, [holiday]);

  if (!particles.length || !EFFECTS[holiday]) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      <style>{`
        ${FALL_VARIANTS.map((to, i) => `
          @keyframes pfall-${i} {
            0%   { transform: translateY(-80px) rotate(0deg) translateX(0); }
            100% { transform: ${to}; }
          }
        `).join("")}
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 select-none"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: `pfall-${p.variantIdx} ${p.speed}s linear ${p.delay}s infinite`,
            willChange: "transform",
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
}
