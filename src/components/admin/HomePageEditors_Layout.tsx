import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ContentMap } from "./editor-shared";

// ── Константы ─────────────────────────────────────────────────────────────────

const HOME_BLOCKS = [
  { key: "hero",     label: "Главный экран",    icon: "Home" },
  { key: "carousel", label: "Карусель услуг",   icon: "Images" },
  { key: "services", label: "Услуги",           icon: "Wrench" },
  { key: "onec",     label: "Услуги 1С",        icon: "Monitor" },
  { key: "partners", label: "Партнёры",         icon: "Handshake" },
  { key: "about",    label: "О компании",       icon: "Building2" },
  { key: "reviews",  label: "Отзывы",           icon: "Star" },
  { key: "map",      label: "Карта / Контакты", icon: "MapPin" },
];

const HERO_SIZES = [
  { key: "compact",    label: "Компактный",    hint: "Минимум места, только заголовок и кнопки", height: "h-8" },
  { key: "medium",     label: "Средний",       hint: "Оптимально — заголовок, текст, фото",      height: "h-14" },
  { key: "large",      label: "Большой",       hint: "Крупный hero с фото и бейджами",           height: "h-20" },
  { key: "fullscreen", label: "На весь экран", hint: "Занимает весь первый экран",               height: "h-28" },
];

// ── Редактор порядка блоков главной ──────────────────────────────────────────

export function HomeBlocksEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const stored = (() => {
    try { return JSON.parse(content["home.blocks_order"] || "[]"); } catch { return []; }
  })();
  const [blocks, setBlocks] = useState<{key:string;visible:boolean}[]>(() => {
    if (stored.length > 0) return stored;
    return HOME_BLOCKS.map(b => ({ key: b.key, visible: true }));
  });

  const heroSize = content["hero.size"] || "medium";
  const dragIdx = useRef<number | null>(null);

  function save(arr: typeof blocks) {
    setBlocks(arr);
    onChange("home.blocks_order", JSON.stringify(arr));
  }

  function move(i: number, dir: -1 | 1) {
    const n = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    save(n);
  }

  function toggle(i: number) {
    const n = [...blocks];
    n[i] = { ...n[i], visible: !n[i].visible };
    save(n);
  }

  function onDragStart(i: number) { dragIdx.current = i; }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const n = [...blocks];
    const [item] = n.splice(dragIdx.current, 1);
    n.splice(i, 0, item);
    dragIdx.current = i;
    save(n);
  }

  const visibleBlocks = blocks.filter(b => b.visible);

  return (
    <div className="space-y-5">

      {/* Размер Hero */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Размер главного экрана</p>
        <div className="grid grid-cols-2 gap-2">
          {HERO_SIZES.map(s => (
            <button key={s.key} onClick={() => onChange("hero.size", s.key)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                heroSize === s.key ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}>
              <div className={`w-6 ${s.height} rounded bg-gradient-to-b shrink-0 ${heroSize === s.key ? "from-green-400 to-green-500" : "from-gray-200 to-gray-300"}`} />
              <div>
                <p className={`text-xs font-semibold ${heroSize === s.key ? "text-green-700" : "text-gray-700"}`}>{s.label}</p>
                <p className="text-[10px] text-gray-400 leading-snug">{s.hint}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Визуальная схема страницы */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Структура страницы</p>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Навбар */}
          <div className="h-5 bg-gray-800 flex items-center px-2 gap-1">
            <div className="w-3 h-2 rounded-sm bg-green-500" />
            <div className="flex-1 flex gap-1 justify-center">
              {[1,2,3,4].map(i => <div key={i} className="w-4 h-1.5 rounded-sm bg-gray-600" />)}
            </div>
            <div className="w-6 h-2 rounded-sm bg-green-500" />
          </div>
          {/* Блоки */}
          {visibleBlocks.map((b) => {
            const meta = HOME_BLOCKS.find(h => h.key === b.key);
            if (!meta) return null;
            const isHero = b.key === "hero";
            const heightMap: Record<string,string> = {
              compact: "h-8", medium: "h-12", large: "h-16", fullscreen: "h-20"
            };
            const blockH = isHero ? (heightMap[heroSize] || "h-12") : "h-6";
            const colors: Record<string,string> = {
              hero: "bg-gradient-to-r from-green-50 to-emerald-100 border-green-200",
              carousel: "bg-blue-50 border-blue-100",
              services: "bg-amber-50 border-amber-100",
              onec: "bg-purple-50 border-purple-100",
              partners: "bg-pink-50 border-pink-100",
              about: "bg-teal-50 border-teal-100",
              reviews: "bg-yellow-50 border-yellow-100",
              map: "bg-gray-50 border-gray-200",
            };
            return (
              <div key={b.key} className={`${blockH} border-b flex items-center px-3 gap-2 ${colors[b.key] || "bg-gray-50 border-gray-100"}`}>
                <Icon name={meta.icon as "Home"} size={10} className="text-gray-400 shrink-0" />
                <span className="text-[9px] font-medium text-gray-500 truncate">{meta.label}</span>
                {isHero && <span className="ml-auto text-[9px] text-green-600 font-semibold">{HERO_SIZES.find(s=>s.key===heroSize)?.label}</span>}
              </div>
            );
          })}
          {/* Футер */}
          <div className="h-5 bg-gray-100 flex items-center px-3 gap-1">
            <span className="text-[9px] text-gray-400">Контакты / Футер</span>
          </div>
        </div>
      </div>

      {/* Список блоков */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Порядок и видимость блоков</p>
        {blocks.map((b, i) => {
          const meta = HOME_BLOCKS.find(h => h.key === b.key);
          if (!meta) return null;
          return (
            <div
              key={b.key}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                b.visible ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              <Icon name="GripVertical" size={16} className="text-gray-300 shrink-0" />
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Icon name={meta.icon as "Home"} size={16} className="text-gray-500" />
              </div>
              <span className={`flex-1 text-sm font-medium ${b.visible ? "text-gray-800" : "text-gray-400"}`}>{meta.label}</span>
              <span className="text-xs text-gray-300 mr-1">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                  <Icon name="ChevronUp" size={14} />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === blocks.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                  <Icon name="ChevronDown" size={14} />
                </button>
                <button onClick={() => toggle(i)}
                  className={`ml-1 w-9 h-5 rounded-full transition-colors relative shrink-0 ${b.visible ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${b.visible ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
