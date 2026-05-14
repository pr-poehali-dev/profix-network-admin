import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { useSiteTheme, PRESETS, HOLIDAYS, SiteTheme, DEFAULT_THEME } from "@/hooks/useTheme";

// Конвертация HEX → HSL строка для отображения
function hexToHsl(hex: string): string {
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

const RADIUS_OPTIONS = [
  { v: "0",    l: "Острые" },
  { v: "0.25", l: "Мягкие" },
  { v: "0.5",  l: "Стандарт" },
  { v: "0.75", l: "Округлые" },
  { v: "1",    l: "Большие" },
  { v: "1.5",  l: "Пилюли" },
];

const QUICK_COLORS = [
  "#3ca615", "#0d6efd", "#ff6600", "#7c3aed",
  "#e91e63", "#00bcd4", "#ff1744", "#795548",
  "#009688", "#f57c00", "#1a237e", "#2e7d32",
];

export default function AdminTheme() {
  const { theme, update } = useSiteTheme();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "holidays">("presets");

  // Локальный preview цвета до применения
  const [draftHex, setDraftHex] = useState(theme.primaryHex);

  useEffect(() => { setDraftHex(theme.primaryHex); }, [theme.primaryHex]);

  function applyPreset(key: string) {
    const p = PRESETS[key];
    if (!p) return;
    update({ ...p });
    setDraftHex(p.primaryHex);
    flash();
  }

  function applyColor(hex: string) {
    setDraftHex(hex);
    const hsl = hexToHsl(hex);
    update({ primaryColor: hsl, primaryHex: hex, accentColor: hsl, preset: "custom" });
    flash();
  }

  function applyRadius(v: string) {
    update({ radius: v });
    flash();
  }

  function applyHoliday(key: string) {
    update({ holiday: key });
    flash();
  }

  function flash() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function resetTheme() {
    update(DEFAULT_THEME);
    setDraftHex(DEFAULT_THEME.primaryHex);
    flash();
  }

  const activeHoliday = HOLIDAYS.find(h => h.key === theme.holiday) || HOLIDAYS[0];

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Тема сайта</h2>
          <p className="text-sm text-gray-400 mt-0.5">Цвет, стиль и праздничные эффекты</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl">
              <Icon name="Check" size={13} />Применено
            </span>
          )}
          <button onClick={resetTheme}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
            <Icon name="RotateCcw" size={13} />Сбросить
          </button>
        </div>
      </div>

      {/* Текущая тема — превью */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Текущий вид</p>
        <div className="flex items-center gap-4">
          {/* Цветовой кружок */}
          <div className="w-14 h-14 rounded-2xl shadow-md shrink-0 flex items-center justify-center"
            style={{ background: theme.primaryHex }}>
            <Icon name="Palette" size={22} className="text-white drop-shadow" />
          </div>
          {/* Превью кнопок */}
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <button className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-sm"
                style={{ background: theme.primaryHex, borderRadius: `${theme.radius}rem` }}>
                Кнопка
              </button>
              <button className="px-4 py-1.5 text-xs font-semibold border-2"
                style={{ borderColor: theme.primaryHex, color: theme.primaryHex, borderRadius: `${theme.radius}rem` }}>
                Контур
              </button>
              <span className="px-2 py-1 text-[10px] font-bold rounded-full text-white"
                style={{ background: theme.primaryHex }}>
                Бейдж
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <div className="w-4 h-4 rounded border-2 flex items-center justify-center"
                style={{ borderColor: theme.primaryHex, background: theme.primaryHex }}>
                <Icon name="Check" size={10} className="text-white" />
              </div>
              <span className="text-xs" style={{ color: theme.primaryHex }}>Активная ссылка</span>
              {activeHoliday.key !== "none" && (
                <span className="text-xs ml-auto">{activeHoliday.icon} {activeHoliday.label}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5">
        {[
          { k: "presets" as const, l: "Шаблоны", icon: "Layers" },
          { k: "custom" as const, l: "Цвет и форма", icon: "Palette" },
          { k: "holidays" as const, l: "Праздники", icon: "Sparkles" },
        ].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === t.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon name={t.icon as "Layers"} size={13} />
            {t.l}
          </button>
        ))}
      </div>

      {/* ── Шаблоны ─────────────────────────────────────────────────────── */}
      {activeTab === "presets" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button key={key} onClick={() => applyPreset(key)}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all group ${theme.preset === key ? "border-gray-900 shadow-md" : "border-gray-100 hover:border-gray-300"}`}>
              {theme.preset === key && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                  <Icon name="Check" size={11} className="text-white" />
                </div>
              )}
              {/* Цветовая полоска */}
              <div className="flex gap-1 mb-3">
                <div className="h-6 flex-1 rounded-md shadow-sm" style={{ background: p.primaryHex }} />
                <div className="h-6 w-4 rounded-md" style={{ background: p.primaryHex, opacity: 0.4 }} />
                <div className="h-6 w-4 rounded-md bg-gray-100" />
              </div>
              {/* Мини превью */}
              <div className="space-y-1.5 mb-3">
                <div className="h-2 rounded-full w-3/4 bg-gray-200" />
                <div className="h-2 rounded-full w-1/2 bg-gray-100" />
                <div className="mt-2 h-5 rounded text-white text-[9px] font-bold flex items-center justify-center"
                  style={{ background: p.primaryHex, borderRadius: `${p.radius}rem` }}>
                  Кнопка
                </div>
              </div>
              <p className="text-xs font-bold text-gray-900">{p.name}</p>
              <p className="text-[10px] text-gray-400">{p.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Цвет и форма ─────────────────────────────────────────────────── */}
      {activeTab === "custom" && (
        <div className="space-y-5">
          {/* Основной цвет */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Основной цвет</p>
            {/* Быстрые цвета */}
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_COLORS.map(hex => (
                <button key={hex} onClick={() => applyColor(hex)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${theme.primaryHex === hex ? "border-gray-900 scale-110" : "border-white shadow-sm"}`}
                  style={{ background: hex }}
                  title={hex} />
              ))}
            </div>
            {/* Пикер */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={draftHex}
                  onChange={e => setDraftHex(e.target.value)}
                  onBlur={e => applyColor(e.target.value)}
                  className="w-12 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5"
                  title="Выбрать произвольный цвет"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={draftHex}
                  onChange={e => {
                    const v = e.target.value;
                    setDraftHex(v);
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) applyColor(v);
                  }}
                  placeholder="#3ca615"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400"
                />
              </div>
              <button onClick={() => applyColor(draftHex)}
                className="px-4 py-2 rounded-xl text-white text-xs font-semibold"
                style={{ background: draftHex }}>
                Применить
              </button>
            </div>
          </div>

          {/* Скруглённость */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Скруглённость углов</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {RADIUS_OPTIONS.map(r => (
                <button key={r.v} onClick={() => applyRadius(r.v)}
                  className={`py-3 flex flex-col items-center gap-1.5 border-2 transition-colors ${theme.radius === r.v ? "border-gray-900" : "border-gray-100 hover:border-gray-300"}`}
                  style={{ borderRadius: `${Math.min(Number(r.v), 1)}rem` }}>
                  {/* Иконка */}
                  <div className="w-6 h-6 border-2 border-current"
                    style={{ borderRadius: `${Math.min(Number(r.v) * 4, 16)}px` }} />
                  <span className="text-[10px] font-medium text-gray-600">{r.l}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Живой предпросмотр */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Предпросмотр элементов</p>
            <div className="space-y-3">
              {/* Кнопки */}
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 text-white text-sm font-semibold shadow-sm"
                  style={{ background: theme.primaryHex, borderRadius: `${theme.radius}rem` }}>
                  Основная кнопка
                </button>
                <button className="px-4 py-2 text-sm font-semibold border-2"
                  style={{ borderColor: theme.primaryHex, color: theme.primaryHex, borderRadius: `${theme.radius}rem` }}>
                  Контурная
                </button>
              </div>
              {/* Карточка */}
              <div className="border p-3 shadow-sm" style={{ borderRadius: `${theme.radius}rem` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 flex items-center justify-center text-white shrink-0"
                    style={{ background: theme.primaryHex, borderRadius: `${theme.radius}rem` }}>
                    <Icon name="Wrench" size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Карточка услуги</div>
                    <div className="text-xs text-gray-500">Описание услуги</div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3" style={{ background: theme.primaryHex }} />
                </div>
              </div>
              {/* Бейджи */}
              <div className="flex flex-wrap gap-2">
                {["Активный", "Статус", "Новый"].map(l => (
                  <span key={l} className="text-xs font-semibold px-2.5 py-1 text-white"
                    style={{ background: theme.primaryHex, borderRadius: `${theme.radius}rem` }}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Праздники ─────────────────────────────────────────────────────── */}
      {activeTab === "holidays" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Включите праздничный эффект — частицы будут падать по всему сайту для посетителей.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HOLIDAYS.map(h => {
              const active = theme.holiday === h.key;
              return (
                <button key={h.key} onClick={() => applyHoliday(h.key)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${active ? "border-gray-900 bg-gray-50 shadow-md" : "border-gray-100 hover:border-gray-300 bg-white"}`}>
                  <span className="text-3xl leading-none">{h.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{h.label}</p>
                    {h.key === "none"
                      ? <p className="text-xs text-gray-400">Эффекты отключены</p>
                      : <p className="text-xs text-gray-400">Падающие частицы</p>
                    }
                  </div>
                  {active && (
                    <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
                      <Icon name="Check" size={12} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {theme.holiday !== "none" && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <Icon name="Info" size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Эффект включён: {activeHoliday.label} {activeHoliday.icon}</p>
                <p className="text-xs text-amber-600 mt-1">Частицы отображаются у всех посетителей сайта поверх контента. Не влияет на производительность.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
