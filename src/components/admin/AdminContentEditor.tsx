import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchContent, saveContent, invalidateContent } from "@/lib/content-api";
import { ContentMap } from "./editor-shared";
import {
  HomeBlocksEditor,
  HeroEditor,
  CarouselEditor,
  ServicesEditor,
  OnecEditor,
  AboutEditor,
  ContactsEditor,
} from "./HomePageEditors";
import { NavbarEditor, PartnerEditor } from "./NavbarPartnerEditors";

// ── Константы табов ───────────────────────────────────────────────────────────

const TABS = [
  { key: "home",     label: "Главная страница", icon: "Home" },
  { key: "navbar",   label: "Навигация",        icon: "Menu" },
  { key: "partners", label: "Партнёры",         icon: "Handshake" },
] as const;

type TabKey = typeof TABS[number]["key"];

const HOME_SUBTABS = [
  { key: "blocks",   label: "Порядок блоков",   icon: "LayoutDashboard" },
  { key: "hero",     label: "Главный экран",    icon: "Home" },
  { key: "carousel", label: "Карусель",         icon: "Images" },
  { key: "services", label: "Услуги",           icon: "Wrench" },
  { key: "onec",     label: "Услуги 1С",        icon: "Monitor" },
  { key: "about",    label: "О компании",       icon: "Building2" },
  { key: "contacts", label: "Контакты и футер", icon: "Phone" },
] as const;

type HomeSubKey = typeof HOME_SUBTABS[number]["key"];

// ── Главный редактор ──────────────────────────────────────────────────────────

export default function AdminContentEditor() {
  const [tab, setTab] = useState<TabKey>("home");
  const [homeSubTab, setHomeSubTab] = useState<HomeSubKey>("blocks");
  const [content, setContent] = useState<ContentMap>({});
  const [pending, setPending] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    invalidateContent();
    fetchContent().then(c => { setContent(c); setLoading(false); });
  }, []);

  function handleChange(key: string, val: string) {
    setContent(prev => ({ ...prev, [key]: val }));
    setPending(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    if (!Object.keys(pending).length) return;
    setSaving(true);
    const ok = await saveContent(pending);
    setSaving(false);
    if (ok) { setPending({}); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  if (loading) return (
    <div className="p-6 text-center text-gray-400">
      <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
      Загрузка контента...
    </div>
  );

  const hasPending = Object.keys(pending).length > 0;

  return (
    <div className="p-3 sm:p-6">
      {/* Шапка */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Редактор сайта</h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 hidden sm:block">Изменения применяются сразу после сохранения</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href="/" target="_blank" className="flex items-center gap-1 p-2 sm:px-4 sm:py-2.5 rounded-xl border border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors">
            <Icon name="ExternalLink" size={15} />
            <span className="hidden sm:inline text-sm">Открыть сайт</span>
          </a>
          <button
            onClick={handleSave}
            disabled={saving || !hasPending}
            className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 ${saved ? "bg-green-500" : ""}`}
            style={saved ? {} : { background: "#3ca615" }}
          >
            <Icon name={saved ? "Check" : "Save"} size={15} />
            <span>{saving ? "Сохраняю..." : saved ? "Сохранено!" : "Сохранить"}</span>
          </button>
        </div>
      </div>

      {hasPending && (
        <div className="mb-3 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-2 text-xs text-orange-600 font-medium">
          <Icon name="AlertCircle" size={13} />
          Есть несохранённые изменения
        </div>
      )}

      {/* Мобильные табы верхнего уровня */}
      <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-3 px-3">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${tab === t.key ? "text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            style={tab === t.key ? {background:"#3ca615"} : {}}>
            <Icon name={t.icon as "Home"} size={13} />
            {t.label}
          </button>
        ))}
      </div>
      {/* Мобильные подтабы — только для Главной */}
      {tab === "home" && (
        <div className="md:hidden flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-3 px-3">
          {HOME_SUBTABS.map(t => (
            <button key={t.key} onClick={() => setHomeSubTab(t.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${homeSubTab === t.key ? "text-white" : "bg-gray-100 text-gray-500"}`}
              style={homeSubTab === t.key ? {background:"#3ca615"} : {}}>
              <Icon name={t.icon as "Home"} size={12} />
              {t.label}
              {Object.keys(pending).some(k => k.startsWith(`${t.key}.`)) && (
                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-5">
        {/* Боковое меню — только десктоп */}
        <aside className="w-52 shrink-0 hidden md:block space-y-1">
          {/* Главная страница с подпунктами */}
          <button onClick={() => setTab("home")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab === "home" ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
            style={tab === "home" ? {background:"#3ca615"} : {}}>
            <Icon name="Home" size={16} />
            Главная страница
          </button>
          {tab === "home" && (
            <div className="ml-3 pl-3 border-l-2 border-green-100 space-y-0.5 py-1">
              {HOME_SUBTABS.map(t => (
                <button key={t.key} onClick={() => setHomeSubTab(t.key)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${homeSubTab === t.key ? "bg-green-50 text-green-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                  <Icon name={t.icon as "Home"} size={14} />
                  {t.label}
                  {Object.keys(pending).some(k => k.startsWith(`${t.key}.`)) && (
                    <span className="ml-auto w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
          {/* Навигация */}
          <button onClick={() => setTab("navbar")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab === "navbar" ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
            style={tab === "navbar" ? {background:"#3ca615"} : {}}>
            <Icon name="Menu" size={16} />
            Навигация
            {Object.keys(pending).some(k => k.startsWith("navbar.")) && (
              <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full" />
            )}
          </button>
          {/* Партнёры */}
          <button onClick={() => setTab("partners")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab === "partners" ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
            style={tab === "partners" ? {background:"#3ca615"} : {}}>
            <Icon name="Handshake" size={16} />
            Партнёры
            {Object.keys(pending).some(k => k.startsWith("partner.")) && (
              <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full" />
            )}
          </button>
        </aside>

        {/* Контент */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 min-w-0">
          {tab === "home" && homeSubTab === "blocks"   && <HomeBlocksEditor content={content} onChange={handleChange} />}
          {tab === "home" && homeSubTab === "hero"     && <HeroEditor content={content} onChange={handleChange} />}
          {tab === "home" && homeSubTab === "carousel" && <CarouselEditor content={content} onChange={handleChange} />}
          {tab === "home" && homeSubTab === "services" && <ServicesEditor content={content} onChange={handleChange} />}
          {tab === "home" && homeSubTab === "onec"     && <OnecEditor content={content} onChange={handleChange} />}
          {tab === "home" && homeSubTab === "about"    && <AboutEditor content={content} onChange={handleChange} />}
          {tab === "home" && homeSubTab === "contacts" && <ContactsEditor content={content} onChange={handleChange} />}
          {tab === "navbar"   && <NavbarEditor content={content} onChange={handleChange} />}
          {tab === "partners" && <PartnerEditor content={content} onChange={handleChange} />}
        </div>
      </div>
    </div>
  );
}
