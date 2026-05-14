import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import {
  SiteTheme,
  DEFAULT_THEME,
  PRESETS,
  HOLIDAYS,
  hexToHsl,
  loadTheme,
  applyTheme,
  saveThemeToServer,
} from "@/hooks/useTheme";

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
  // Все хуки — всегда наверху, без условий
  const [saved, setSaved]         = useState<SiteTheme>(loadTheme);
  const [draft, setDraft]         = useState<SiteTheme>(loadTheme);
  const [draftHex, setDraftHex]   = useState(() => loadTheme().primaryHex);
  const [activeTab, setActiveTab] = useState<"presets" | "custom" | "holidays">("presets");
  const [saving, setSaving]       = useState(false);
  const [saveOk, setSaveOk]       = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Следим за hex в draft
  useEffect(() => { setDraftHex(draft.primaryHex); }, [draft.primaryHex]);

  // Применяем draft к DOM текущей вкладки для предпросмотра «в реальном времени»
  useEffect(() => { applyTheme(draft); }, [draft]);

  // При unmount — восстанавливаем сохранённую тему
  useEffect(() => {
    return () => { applyTheme(saved); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const updateDraft = useCallback((partial: Partial<SiteTheme>) => {
    setDraft(prev => ({ ...prev, ...partial }));
  }, []);

  async function handleSave() {
    setSaving(true);
    await saveThemeToServer(draft);
    setSaved(draft);
    setSaving(false);
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 2500);
  }

  function handleReset() {
    setDraft(DEFAULT_THEME);
    setDraftHex(DEFAULT_THEME.primaryHex);
  }

  function handleDiscard() {
    setDraft(saved);
    setDraftHex(saved.primaryHex);
  }

  function pickPreset(key: string) {
    const p = PRESETS[key];
    if (!p) return;
    updateDraft({ ...p });
  }

  function pickColor(hex: string) {
    setDraftHex(hex);
    const hsl = hexToHsl(hex);
    updateDraft({ primaryColor: hsl, primaryHex: hex, accentColor: hsl, preset: "custom" });
  }

  const activeHoliday = HOLIDAYS.find(h => h.key === draft.holiday) || HOLIDAYS[0];

  return (
    <div className="flex flex-col h-full">
      {/* ── Шапка ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Тема сайта</h2>
          <p className="text-xs text-gray-400 mt-0.5">Цвет, стиль и праздничные эффекты</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${showPreview ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Icon name="Monitor" size={13} />
            {showPreview ? "Скрыть" : "Предпросмотр"}
          </button>
          {isDirty && (
            <button onClick={handleDiscard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              <Icon name="X" size={13} />Отменить
            </button>
          )}
          <button onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors">
            <Icon name="RotateCcw" size={13} />Сбросить
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all shadow-sm"
            style={{ background: isDirty ? draft.primaryHex : "#9ca3af" }}
          >
            {saving
              ? <><Icon name="Loader2" size={13} className="animate-spin" />Сохраняю...</>
              : saveOk
              ? <><Icon name="CheckCircle" size={13} />Применено!</>
              : <><Icon name="Save" size={13} />Сохранить и применить</>
            }
          </button>
        </div>
      </div>

      {/* ── Несохранённые изменения ─────────────────────────────────────────── */}
      {isDirty && (
        <div className="mx-4 sm:mx-6 mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
          <Icon name="AlertCircle" size={13} />
          Есть несохранённые изменения — нажмите «Сохранить и применить»
        </div>
      )}

      <div className={`flex gap-4 p-4 sm:p-6 flex-1 ${showPreview ? "flex-row" : "flex-col max-w-2xl"}`}>
        {/* ── Левая панель редактора ─────────────────────────────────────────── */}
        <div className={`space-y-4 ${showPreview ? "w-72 shrink-0 overflow-y-auto" : "w-full"}`}>

          {/* Текущий вид */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Текущий вид</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl shadow-md shrink-0 flex items-center justify-center"
                style={{ background: draft.primaryHex }}>
                <Icon name="Palette" size={18} className="text-white" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2 flex-wrap">
                  <button className="px-3 py-1 text-white text-[11px] font-bold shadow-sm"
                    style={{ background: draft.primaryHex, borderRadius: `${draft.radius}rem` }}>
                    Кнопка
                  </button>
                  <button className="px-3 py-1 text-[11px] font-bold border-2"
                    style={{ borderColor: draft.primaryHex, color: draft.primaryHex, borderRadius: `${draft.radius}rem` }}>
                    Контур
                  </button>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-white rounded-full"
                    style={{ background: draft.primaryHex }}>Бейдж</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]" style={{ color: draft.primaryHex }}>● Активная ссылка</span>
                  {activeHoliday.key !== "none" && (
                    <span className="text-xs ml-auto">{activeHoliday.icon}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Табы */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { k: "presets" as const, l: "Шаблоны", icon: "Layers" },
              { k: "custom" as const, l: "Цвет", icon: "Palette" },
              { k: "holidays" as const, l: "Праздники", icon: "Sparkles" },
            ].map(t => (
              <button key={t.k} onClick={() => setActiveTab(t.k)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-colors ${activeTab === t.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Icon name={t.icon as "Layers"} size={12} />{t.l}
              </button>
            ))}
          </div>

          {/* ── Шаблоны ── */}
          {activeTab === "presets" && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRESETS).map(([key, p]) => (
                <button key={key} onClick={() => pickPreset(key)}
                  className={`relative p-3 rounded-2xl border-2 text-left transition-all ${draft.preset === key && draft.primaryHex === p.primaryHex ? "border-gray-900 shadow-md" : "border-gray-100 bg-white hover:border-gray-300"}`}>
                  {draft.preset === key && draft.primaryHex === p.primaryHex && (
                    <div className="absolute top-2 right-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                      <Icon name="Check" size={9} className="text-white" />
                    </div>
                  )}
                  <div className="flex gap-1 mb-2">
                    <div className="h-5 flex-1 rounded" style={{ background: p.primaryHex }} />
                    <div className="h-5 w-3 rounded" style={{ background: p.primaryHex, opacity: 0.35 }} />
                    <div className="h-5 w-3 rounded bg-gray-100" />
                  </div>
                  <div className="h-4 rounded mb-2 text-white text-[8px] font-bold flex items-center justify-center"
                    style={{ background: p.primaryHex, borderRadius: `${p.radius}rem` }}>
                    Кнопка
                  </div>
                  <p className="text-[11px] font-bold text-gray-900">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* ── Цвет и форма ── */}
          {activeTab === "custom" && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Основной цвет</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {QUICK_COLORS.map(hex => (
                    <button key={hex} onClick={() => pickColor(hex)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${draft.primaryHex === hex ? "border-gray-900 scale-110" : "border-white shadow-sm"}`}
                      style={{ background: hex }} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={draftHex}
                    onChange={e => setDraftHex(e.target.value)}
                    onBlur={e => pickColor(e.target.value)}
                    className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 shrink-0" />
                  <input type="text" value={draftHex}
                    onChange={e => {
                      const v = e.target.value;
                      setDraftHex(v);
                      if (/^#[0-9a-fA-F]{6}$/.test(v)) pickColor(v);
                    }}
                    placeholder="#3ca615"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-gray-400" />
                  <button onClick={() => pickColor(draftHex)}
                    className="px-3 py-2 rounded-xl text-white text-xs font-semibold shrink-0"
                    style={{ background: draftHex }}>OK</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Скруглённость</p>
                <div className="grid grid-cols-3 gap-2">
                  {RADIUS_OPTIONS.map(r => (
                    <button key={r.v} onClick={() => updateDraft({ radius: r.v })}
                      className={`py-2.5 flex flex-col items-center gap-1 border-2 transition-colors ${draft.radius === r.v ? "border-gray-900" : "border-gray-100 bg-white hover:border-gray-300"}`}
                      style={{ borderRadius: `${Math.min(Number(r.v), 1)}rem` }}>
                      <div className="w-5 h-5 border-2 border-current"
                        style={{ borderRadius: `${Math.min(Number(r.v) * 4, 16)}px` }} />
                      <span className="text-[9px] font-medium text-gray-600">{r.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Праздники ── */}
          {activeTab === "holidays" && (
            <div className="space-y-2">
              {HOLIDAYS.map(h => {
                const active = draft.holiday === h.key;
                return (
                  <button key={h.key} onClick={() => updateDraft({ holiday: h.key })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${active ? "border-gray-900 bg-gray-50" : "border-gray-100 bg-white hover:border-gray-200"}`}>
                    <span className="text-2xl leading-none">{h.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-900">{h.label}</p>
                      <p className="text-[10px] text-gray-400">{h.key === "none" ? "Без эффектов" : "Падающие частицы"}</p>
                    </div>
                    {active && <Icon name="Check" size={14} className="text-gray-900 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Live-превью сайта ──────────────────────────────────────────────── */}
        {showPreview && (
          <div className="flex-1 min-w-0 rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-[#F7F9FC] flex flex-col" style={{ minHeight: 500 }}>
            {/* Адресная строка */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-lg px-3 py-1 text-[11px] text-gray-400 font-mono border border-gray-200">
                it-profix.ru
              </div>
            </div>
            {/* Превью контента */}
            <div className="flex-1 overflow-y-auto text-[10px]" style={{ zoom: 0.65 }}>
              {/* Navbar */}
              <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ background: draft.primaryHex }}>P</div>
                  <span className="font-bold text-gray-900 text-sm">ProFiX</span>
                </div>
                <div className="flex gap-4 text-gray-600 text-xs">
                  {["Услуги","Магазин","О нас","Контакты"].map(l => <span key={l}>{l}</span>)}
                </div>
                <button className="px-4 py-1.5 text-white text-xs font-bold rounded-lg" style={{ background: draft.primaryHex, borderRadius: `${draft.radius}rem` }}>Заявка</button>
              </div>
              {/* Hero */}
              <div className="px-6 py-10 flex gap-8 items-center" style={{ background: `linear-gradient(135deg, ${draft.primaryHex}18, #F7F9FC)` }}>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mb-4" style={{ background: draft.primaryHex + "20", color: draft.primaryHex }}>
                    📍 г. Якутск
                  </div>
                  <div className="text-3xl font-bold text-gray-900 leading-tight mb-3">IT-ПОДДЕРЖКА<br/><span style={{ color: draft.primaryHex }}>ДЛЯ БИЗНЕСА</span><br/>И ЧАСТНЫХ ЛИЦ</div>
                  <p className="text-gray-500 text-sm mb-5">Ремонт компьютеров, видеонаблюдение, сети, 1С и заправка картриджей.</p>
                  <div className="flex gap-3">
                    <button className="px-5 py-2 text-white text-xs font-bold" style={{ background: draft.primaryHex, borderRadius: `${draft.radius}rem` }}>Оставить заявку</button>
                    <button className="px-5 py-2 text-xs font-bold border-2" style={{ borderColor: draft.primaryHex, color: draft.primaryHex, borderRadius: `${draft.radius}rem` }}>Услуги</button>
                  </div>
                </div>
                <div className="w-48 h-40 rounded-2xl bg-gray-200 overflow-hidden shrink-0">
                  <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/ad49d25f-c346-44dc-a332-4aa4552ce177.jpg" className="w-full h-full object-cover" alt="" />
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 text-center py-4 bg-white border-y border-gray-100">
                {[["1000+","клиентов"],["15+","лет опыта"],["100%","гарантия"]].map(([v,l]) => (
                  <div key={l}><div className="text-xl font-bold" style={{ color: draft.primaryHex }}>{v}</div><div className="text-gray-500">{l}</div></div>
                ))}
              </div>
              {/* Services */}
              <div className="px-6 py-8">
                <div className="text-xl font-bold text-gray-900 mb-5">Наши услуги</div>
                <div className="grid grid-cols-3 gap-3">
                  {[["💻","Ремонт ПК","Быстро и с гарантией"],["📷","Видеонаблюдение","Монтаж и обслуживание"],["🖨️","Заправка картриджей","Лазерные и струйные"]].map(([ico,t,d]) => (
                    <div key={t} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2" style={{ background: draft.primaryHex + "20" }}>{ico}</div>
                      <div className="font-bold text-gray-900 text-xs">{t}</div>
                      <div className="text-gray-400 mt-1">{d}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Кнопка CTA */}
              <div className="px-6 pb-8 text-center">
                <div className="rounded-2xl py-8 px-6" style={{ background: draft.primaryHex }}>
                  <div className="text-white font-bold text-lg mb-2">Нужна помощь?</div>
                  <p className="text-white/80 text-sm mb-4">Оставьте заявку — перезвоним в течение 15 минут</p>
                  <button className="bg-white font-bold px-6 py-2 text-sm" style={{ color: draft.primaryHex, borderRadius: `${draft.radius}rem` }}>Оставить заявку</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}