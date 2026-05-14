import { useEffect, useRef, useState } from "react";
import { loadTheme } from "@/hooks/useTheme";

const PARTICLE_COUNT = 60;

interface Particle {
  id: number;
  x: number;
  speed: number;
  size: number;
  opacity: number;
  swing: number;
  swingSpeed: number;
  delay: number;
  char: string;
}

function makeParticles(chars: string[]): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    speed: 1.5 + Math.random() * 3,
    size: 10 + Math.random() * 18,
    opacity: 0.5 + Math.random() * 0.5,
    swing: Math.random() * 60 - 30,
    swingSpeed: 2 + Math.random() * 4,
    delay: Math.random() * 10,
    char: chars[Math.floor(Math.random() * chars.length)],
  }));
}

const EFFECTS: Record<string, { chars: string[]; bg?: string }> = {
  newyear:   { chars: ["❄️","⛄","🎄","✨","🌟","❅","❆","🎁","🔔"] },
  march8:    { chars: ["🌸","🌷","🌺","💐","🌹","🌼","💗","🦋"] },
  feb23:     { chars: ["⭐","🎖️","🎗️","🚀","✈️","🛡️","💪"] },
  may9:      { chars: ["🎗️","🌹","⭐","🕊️","🔥","🎇"] },
  halloween: { chars: ["🎃","👻","🕷️","🕸️","🦇","💀","🌙","🔮"] },
  birthday:  { chars: ["🎂","🎈","🎉","🎊","🎁","✨","🥳","⭐"] },
};

export default function HolidayEffects() {
  const [holiday, setHoliday] = useState(() => loadTheme().holiday);
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "profix_site_theme") {
        try {
          const t = JSON.parse(e.newValue || "{}");
          if (t.holiday !== undefined) setHoliday(t.holiday);
        } catch { /* ignore */ }
      }
    }
    window.addEventListener("storage", onStorage);

    // Polling для обновления внутри вкладки
    const iv = setInterval(() => {
      const t = loadTheme();
      setHoliday(t.holiday);
    }, 1000);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(iv); };
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
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 select-none"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: `fall-${p.id % 5} ${p.speed + 6}s linear ${p.delay}s infinite`,
            willChange: "transform",
          }}
        >
          {p.char}
        </div>
      ))}
      <style>{`
        @keyframes fall-0 { 0% { transform: translateY(-60px) rotate(0deg) translateX(0); } 100% { transform: translateY(110vh) rotate(360deg) translateX(40px); } }
        @keyframes fall-1 { 0% { transform: translateY(-60px) rotate(0deg) translateX(0); } 100% { transform: translateY(110vh) rotate(-280deg) translateX(-50px); } }
        @keyframes fall-2 { 0% { transform: translateY(-60px) rotate(0deg) translateX(0); } 100% { transform: translateY(110vh) rotate(200deg) translateX(30px); } }
        @keyframes fall-3 { 0% { transform: translateY(-60px) rotate(0deg) translateX(0); } 100% { transform: translateY(110vh) rotate(-180deg) translateX(-35px); } }
        @keyframes fall-4 { 0% { transform: translateY(-60px) rotate(0deg) translateX(0); } 100% { transform: translateY(110vh) rotate(320deg) translateX(55px); } }
      `}</style>
    </div>
  );
}
