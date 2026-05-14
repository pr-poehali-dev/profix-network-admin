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
    name: "ProFiX",
    desc: "Фирменный зелёный",
    primaryColor: "109 62% 43%",
    primaryHex: "#3ca615",
    accentColor: "109 62% 43%",
    radius: "0.5",
    fontHeading: "Oswald",
    preset: "profix",
    holiday: "none",
  },
  ocean: {
    name: "Синий океан",
    desc: "Доверие и надёжность",
    primaryColor: "213 90% 40%",
    primaryHex: "#0d6efd",
    accentColor: "213 90% 40%",
    radius: "0.75",
    fontHeading: "Oswald",
    preset: "ocean",
    holiday: "none",
  },
  sunset: {
    name: "Закат",
    desc: "Тёплые оранжевые тона",
    primaryColor: "25 100% 50%",
    primaryHex: "#ff6600",
    accentColor: "25 100% 50%",
    radius: "0.75",
    fontHeading: "Oswald",
    preset: "sunset",
    holiday: "none",
  },
  violet: {
    name: "Фиолет",
    desc: "Современный и стильный",
    primaryColor: "258 90% 60%",
    primaryHex: "#7c3aed",
    accentColor: "258 90% 60%",
    radius: "1",
    fontHeading: "Oswald",
    preset: "violet",
    holiday: "none",
  },
  dark: {
    name: "Тёмная",
    desc: "Чёрная с акцентом",
    primaryColor: "0 0% 95%",
    primaryHex: "#f0f0f0",
    accentColor: "0 0% 95%",
    radius: "0.25",
    fontHeading: "Oswald",
    preset: "dark",
    holiday: "none",
  },
  rose: {
    name: "Розовый",
    desc: "Мягкий и элегантный",
    primaryColor: "340 82% 52%",
    primaryHex: "#e91e63",
    accentColor: "340 82% 52%",
    radius: "1.25",
    fontHeading: "Oswald",
    preset: "rose",
    holiday: "none",
  },
};

export const HOLIDAYS = [
  { key: "none",       label: "Без праздника",  icon: "🌐" },
  { key: "newyear",   label: "Новый год",        icon: "🎄" },
  { key: "march8",    label: "8 марта",          icon: "🌸" },
  { key: "feb23",     label: "23 февраля",       icon: "🎖️" },
  { key: "may9",      label: "День Победы",      icon: "🎗️" },
  { key: "halloween", label: "Хэллоуин",         icon: "🎃" },
  { key: "birthday",  label: "День рождения",    icon: "🎂" },
];

const STORAGE_KEY = "profix_site_theme";
const CONTENT_THEME_KEY = "site.theme";

// ── Hex → HSL ────────────────────────────────────────────────────────────────
export function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ── Применить тему к DOM ──────────────────────────────────────────────────────
export function applyTheme(theme: SiteTheme) {
  const root = document.documentElement;
  const hsl = hexToHsl(theme.primaryHex);
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
  root.style.setProperty("--accent", hsl);
  root.style.setProperty("--radius", `${theme.radius}rem`);
  root.style.setProperty("--profix-color", theme.primaryHex);
  (window as Record<string, unknown>).__PROFIX_PRIMARY = theme.primaryHex;
}

// ── Локальный кэш ─────────────────────────────────────────────────────────────
export function loadTheme(): SiteTheme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_THEME;
}

function cacheTheme(theme: SiteTheme) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

// ── Загрузить из content API (для всех посетителей) ──────────────────────────
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

// ── Сохранить в content API (только из админки) ───────────────────────────────
export async function saveThemeToServer(theme: SiteTheme): Promise<void> {
  cacheTheme(theme);
  applyTheme(theme);
  // Отправляем на сервер — применится у всех при следующей загрузке
  await saveContent({ [CONTENT_THEME_KEY]: JSON.stringify(theme) });
  // BroadcastChannel — применить мгновенно в других вкладках
  try {
    const bc = new BroadcastChannel("profix_theme");
    bc.postMessage(theme);
    bc.close();
  } catch { /* ignore */ }
}

// ── Хук для AdminTheme (с сохранением на сервер) ─────────────────────────────
export function useSiteTheme() {
  const [theme, setTheme] = useState<SiteTheme>(() => {
    const t = loadTheme();
    applyTheme(t);
    return t;
  });
  const [saving, setSaving] = useState(false);

  // Слушаем BroadcastChannel — мгновенная синхронизация вкладок
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
    applyTheme(next); // мгновенно в DOM
    setSaving(true);
    await saveThemeToServer(next);
    setSaving(false);
  }

  return { theme, update, saving };
}

// ── Хук для обычных страниц (только чтение) ──────────────────────────────────
export function useAppliedTheme() {
  useEffect(() => {
    // Загружаем с сервера при маунте, применяем к DOM
    loadThemeFromServer().then(t => {
      applyTheme(t);
    });

    // Слушаем BroadcastChannel — если в другой вкладке открыта админка
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
