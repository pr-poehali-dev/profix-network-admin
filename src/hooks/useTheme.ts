import { useState, useEffect } from "react";
import { fetchContent, saveContent } from "@/lib/content-api";

export interface SiteTheme {
  primaryColor: string;
  primaryHex: string;
  accentColor: string;
  radius: string;
  fontHeading: string;
  preset: string;
  holiday: string;
}

export const DEFAULT_THEME: SiteTheme = {
  primaryColor: "109 62% 43%",
  primaryHex: "#3ca615",
  accentColor: "109 62% 43%",
  radius: "0.5",
  fontHeading: "Oswald",
  preset: "profix",
  holiday: "none",
};

export const PRESETS: Record<string, SiteTheme & { name: string; desc: string }> = {
  profix: {
    name: "ProFiX",      desc: "Фирменный зелёный",
    primaryColor: "109 62% 43%", primaryHex: "#3ca615", accentColor: "109 62% 43%",
    radius: "0.5", fontHeading: "Oswald", preset: "profix", holiday: "none",
  },
  ocean: {
    name: "Синий океан", desc: "Доверие и надёжность",
    primaryColor: "213 90% 40%", primaryHex: "#0d6efd", accentColor: "213 90% 40%",
    radius: "0.75", fontHeading: "Oswald", preset: "ocean", holiday: "none",
  },
  sunset: {
    name: "Закат",       desc: "Тёплые оранжевые тона",
    primaryColor: "25 100% 50%", primaryHex: "#ff6600", accentColor: "25 100% 50%",
    radius: "0.75", fontHeading: "Oswald", preset: "sunset", holiday: "none",
  },
  violet: {
    name: "Фиолет",      desc: "Современный и стильный",
    primaryColor: "258 90% 60%", primaryHex: "#7c3aed", accentColor: "258 90% 60%",
    radius: "1", fontHeading: "Oswald", preset: "violet", holiday: "none",
  },
  dark: {
    name: "Тёмная",      desc: "Чёрная с акцентом",
    primaryColor: "0 0% 20%", primaryHex: "#333333", accentColor: "0 0% 20%",
    radius: "0.25", fontHeading: "Oswald", preset: "dark", holiday: "none",
  },
  rose: {
    name: "Розовый",     desc: "Мягкий и элегантный",
    primaryColor: "340 82% 52%", primaryHex: "#e91e63", accentColor: "340 82% 52%",
    radius: "1.25", fontHeading: "Oswald", preset: "rose", holiday: "none",
  },
};

export const HOLIDAYS = [
  { key: "none",      label: "Без праздника",   icon: "🌐" },
  { key: "newyear",  label: "Новый год",         icon: "🎄" },
  { key: "march8",   label: "8 марта",           icon: "🌸" },
  { key: "feb23",    label: "23 февраля",        icon: "🎖️" },
  { key: "may9",     label: "День Победы",       icon: "🎗️" },
  { key: "halloween",label: "Хэллоуин",          icon: "🎃" },
  { key: "birthday", label: "День рождения",     icon: "🎂" },
];

const STORAGE_KEY = "profix_site_theme";
const CONTENT_THEME_KEY = "site.theme";
const STYLE_ID = "profix-theme-inject";

// ── Hex ↔ HSL утилиты ────────────────────────────────────────────────────────
export function hexToHsl(hex: string): string {
  const { h, s, l } = hexToHslObj(hex);
  return `${h} ${s}% ${l}%`;
}

function hexToHslObj(hex: string): { h: number; s: number; l: number } {
  let r = 0, g = 0, b = 0;
  const h6 = hex.replace("#", "");
  if (h6.length === 6) {
    r = parseInt(h6.slice(0, 2), 16) / 255;
    g = parseInt(h6.slice(2, 4), 16) / 255;
    b = parseInt(h6.slice(4, 6), 16) / 255;
  }
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, ss = 0;
  const ll = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    ss = ll > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: hh = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: hh = ((b - r) / d + 2) / 6; break;
      case b: hh = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(hh * 360), s: Math.round(ss * 100), l: Math.round(ll * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function darken(hex: string, amount = 10): string {
  const { h, s, l } = hexToHslObj(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

function lighten(hex: string, amount = 35): string {
  const { h, s, l } = hexToHslObj(hex);
  return hslToHex(h, Math.max(10, s - 20), Math.min(97, l + amount));
}

function alpha(hex: string, a: number): string {
  // returns rgba string
  const h6 = hex.replace("#", "");
  const r = parseInt(h6.slice(0, 2), 16);
  const g = parseInt(h6.slice(2, 4), 16);
  const b = parseInt(h6.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Генерация глобального CSS который заменяет жёсткие цвета ────────────────
function buildThemeCSS(hex: string, radius: string): string {
  const hover = darken(hex, 10);
  const light = lighten(hex);
  const veryLight = lighten(hex, 50);
  const hsl = hexToHsl(hex);
  const a10 = alpha(hex, 0.10);
  const a20 = alpha(hex, 0.20);
  const a30 = alpha(hex, 0.30);
  const r = `${radius}rem`;

  return `
/* ── ProFiX Dynamic Theme ── */
:root {
  --primary: ${hsl};
  --ring: ${hsl};
  --accent: ${hsl};
  --radius: ${r};
  --profix-color: ${hex};
  --profix-hover: ${hover};
  --profix-light: ${light};
  --profix-vlight: ${veryLight};
}

/* Backgrounds */
.bg-\\[\\#3ca615\\], [class*="bg-[#3ca615"]  { background-color: ${hex} !important; }
[style*="background: #3ca615"], [style*="background:#3ca615"],
[style*="background-color: #3ca615"], [style*="background-color:#3ca615"] { background-color: ${hex} !important; }
[style*="background: rgb(60, 166, 21)"] { background-color: ${hex} !important; }

/* Hover backgrounds */
.hover\\:bg-\\[\\#3ca615\\]:hover { background-color: ${hex} !important; }
.hover\\:bg-\\[\\#2d8a10\\]:hover, [class*="hover:bg-[#2d8a10]"] { background-color: ${hover} !important; }

/* Text */
.text-\\[\\#3ca615\\] { color: ${hex} !important; }
.hover\\:text-\\[\\#3ca615\\]:hover { color: ${hex} !important; }

/* Borders */
.border-\\[\\#3ca615\\] { border-color: ${hex} !important; }
.hover\\:border-\\[\\#3ca615\\]:hover { border-color: ${hex} !important; }
.ring-\\[\\#3ca615\\] { --tw-ring-color: ${hex} !important; }
.ring-2.ring-\\[\\#3ca615\\] { --tw-ring-color: ${hex} !important; }

/* Light green bg */
.bg-\\[\\#edf7e8\\] { background-color: ${veryLight} !important; }
.from-\\[\\#edf7e8\\] { --tw-gradient-from: ${veryLight} !important; }
.to-\\[\\#d4f0c8\\]  { --tw-gradient-to:   ${lighten(hex, 40)} !important; }
.hover\\:bg-\\[\\#edf7e8\\]:hover { background-color: ${veryLight} !important; }

/* Gradients */
.from-\\[\\#3ca615\\] { --tw-gradient-from: ${hex} !important; }
.to-\\[\\#2d8a10\\]   { --tw-gradient-to:   ${hover} !important; }

/* Opacity variants */
.bg-\\[\\#3ca615\\]\\/10 { background-color: ${a10} !important; }
.bg-\\[\\#3ca615\\]\\/20 { background-color: ${a20} !important; }
.bg-\\[\\#3ca615\\]\\/30 { background-color: ${a30} !important; }

/* Shadow green */
.shadow-green-200 { --tw-shadow-color: ${a20} !important; }
.shadow-green-300 { --tw-shadow-color: ${a30} !important; }
.hover\\:shadow-green-300:hover { --tw-shadow-color: ${a30} !important; }

/* Green-50/100 utility overrides */
.bg-green-50  { background-color: ${veryLight} !important; }
.text-green-600, .text-green-700 { color: ${darken(hex, 5)} !important; }
.border-green-200 { border-color: ${lighten(hex, 25)} !important; }
.bg-green-100 { background-color: ${lighten(hex, 40)} !important; }

/* Sidebar active item */
[style*="background: #3ca615"], [style*="background:#3ca615"] { background: ${hex} !important; }

/* Inline style overrides via attribute selector */
[style*="#3ca615"] { 
  --profix-inline: ${hex};
}

/* Border radius global */
.rounded-xl { border-radius: calc(${r} + 0.25rem) !important; }
.rounded-2xl { border-radius: calc(${r} + 0.75rem) !important; }
.rounded-lg  { border-radius: ${r} !important; }
`;
}

// ── Патч inline-стилей через MutationObserver ────────────────────────────────
const INLINE_COLORS = ["#3ca615", "#2d8a10", "#edf7e8"];
let _activeHex = DEFAULT_THEME.primaryHex;
let _activeRadius = DEFAULT_THEME.radius;
let _observer: MutationObserver | null = null;

function patchElement(el: Element, hex: string) {
  const h = el as HTMLElement;
  if (!h.style) return;
  // background / backgroundColor
  for (const prop of ["background", "backgroundColor"] as const) {
    const v = h.style[prop];
    if (!v) continue;
    for (const orig of INLINE_COLORS) {
      if (v.toLowerCase().includes(orig)) {
        const replacement = orig === "#3ca615" ? hex
          : orig === "#2d8a10" ? darken(hex, 10)
          : lighten(hex, 50);
        if (!v.includes("gradient")) {
          h.style[prop] = v.replace(new RegExp(orig, "gi"), replacement);
        }
      }
    }
  }
  // borderColor
  if (h.style.borderColor?.toLowerCase().includes("#3ca615")) {
    h.style.borderColor = hex;
  }
  // color
  if (h.style.color?.toLowerCase().includes("#3ca615")) {
    h.style.color = hex;
  }
  // boxShadow
  if (h.style.boxShadow?.toLowerCase().includes("#3ca615")) {
    h.style.boxShadow = h.style.boxShadow.replace(/#3ca615/gi, hex);
  }
}

function patchAllInline(hex: string) {
  document.querySelectorAll<HTMLElement>("[style]").forEach(el => patchElement(el, hex));
}

function startObserver(hex: string) {
  if (_observer) _observer.disconnect();
  _observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "style") {
        patchElement(m.target as Element, _activeHex);
      }
      if (m.type === "childList") {
        m.addedNodes.forEach(n => {
          if (n.nodeType === Node.ELEMENT_NODE) {
            patchElement(n as Element, _activeHex);
            (n as Element).querySelectorAll<HTMLElement>("[style]")
              .forEach(c => patchElement(c, _activeHex));
          }
        });
      }
    }
  });
  _observer.observe(document.body, {
    attributes: true, attributeFilter: ["style"],
    childList: true, subtree: true,
  });
  void hex;
}

// ── Применить тему к DOM ──────────────────────────────────────────────────────
export function applyTheme(theme: SiteTheme) {
  _activeHex = theme.primaryHex;
  _activeRadius = theme.radius;

  // 1. style-тег с Tailwind-классами
  const css = buildThemeCSS(theme.primaryHex, theme.radius);
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;

  // 2. CSS custom properties на :root
  const root = document.documentElement;
  const hsl = hexToHsl(theme.primaryHex);
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--accent", hsl);
  root.style.setProperty("--radius", `${theme.radius}rem`);
  root.style.setProperty("--profix-color", theme.primaryHex);
  (window as Record<string, unknown>).__PROFIX_PRIMARY = theme.primaryHex;

  // 3. Патч inline-стилей + observer
  const run = () => {
    patchAllInline(theme.primaryHex);
    startObserver(theme.primaryHex);
  };
  if (document.body) run();
  else document.addEventListener("DOMContentLoaded", run, { once: true });

  void _activeRadius;
}

// ── Локальный кэш ─────────────────────────────────────────────────────────────
export function loadTheme(): SiteTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}

export function cacheTheme(theme: SiteTheme) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

// ── Загрузить с сервера ───────────────────────────────────────────────────────
export async function loadThemeFromServer(): Promise<SiteTheme> {
  try {
    const content = await fetchContent();
    const raw = content[CONTENT_THEME_KEY];
    if (raw) {
      const t: SiteTheme = { ...DEFAULT_THEME, ...JSON.parse(raw) };
      cacheTheme(t);
      return t;
    }
  } catch { /* ignore */ }
  return loadTheme();
}

// ── Сохранить на сервер ───────────────────────────────────────────────────────
export async function saveThemeToServer(theme: SiteTheme): Promise<void> {
  cacheTheme(theme);
  applyTheme(theme);
  await saveContent({ [CONTENT_THEME_KEY]: JSON.stringify(theme) });
  try {
    const bc = new BroadcastChannel("profix_theme");
    bc.postMessage(theme);
    bc.close();
  } catch { /* ignore */ }
}

// ── Хук для AdminTheme ────────────────────────────────────────────────────────
export function useSiteTheme() {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    const t = loadTheme();
    return t;
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("profix_theme");
      bc.onmessage = (e: MessageEvent<SiteTheme>) => {
        setTheme(e.data);
        applyTheme(e.data);
      };
    } catch { /* ignore */ }
    return () => bc?.close();
  }, []);

  async function update(partial: Partial<SiteTheme>) {
    const next = { ...theme, ...partial };
    setTheme(next);
    applyTheme(next);
    setSaving(true);
    await saveThemeToServer(next);
    setSaving(false);
  }

  return { theme, update, saving };
}

// ── Хук для всех страниц (чтение + BroadcastChannel) ─────────────────────────
export function useAppliedTheme() {
  useEffect(() => {
    loadThemeFromServer().then(t => applyTheme(t));

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("profix_theme");
      bc.onmessage = (e: MessageEvent<SiteTheme>) => {
        applyTheme(e.data);
        cacheTheme(e.data);
      };
    } catch { /* ignore */ }
    return () => bc?.close();
  }, []);
}