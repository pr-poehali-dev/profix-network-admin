import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ContentMap, parseJson, Field, ImageUpload } from "./editor-shared";

// ── Секция: Главный экран ─────────────────────────────────────────────────────

export function HeroEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const stats = parseJson<{val:string;label:string}[]>(content["hero.stats"] || "", [
    {val:"1000+",label:"клиентов"},{val:"15+",label:"лет опыта"},{val:"100%",label:"гарантия"}
  ]);

  function setStats(items: {val:string;label:string}[]) {
    onChange("hero.stats", JSON.stringify(items));
  }

  return (
    <div className="space-y-4">
      <Field label="Заголовок H1" value={content["hero.title"] || ""} onChange={v => onChange("hero.title", v)} textarea hint="Используй перенос строки для разбивки" />
      <Field label="Подзаголовок" value={content["hero.subtitle"] || ""} onChange={v => onChange("hero.subtitle", v)} textarea />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Адрес" value={content["hero.address"] || ""} onChange={v => onChange("hero.address", v)} />
        <Field label="Часы работы" value={content["hero.hours"] || ""} onChange={v => onChange("hero.hours", v)} />
      </div>
      <Field label="Лет опыта (бейдж)" value={content["hero.experience"] || "15+"} onChange={v => onChange("hero.experience", v)} />

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Статистика (3 блока)</label>
        <div className="space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={s.val} onChange={e => { const n=[...stats]; n[i]={...n[i],val:e.target.value}; setStats(n); }}
                placeholder="1000+" className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
              <input value={s.label} onChange={e => { const n=[...stats]; n[i]={...n[i],label:e.target.value}; setStats(n); }}
                placeholder="клиентов" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Секция: Карусель ──────────────────────────────────────────────────────────

export function CarouselEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const slides = parseJson<{img:string;title:string;desc:string}[]>(content["carousel.slides"] || "", []);
  const [expanded, setExpanded] = useState<number | null>(null);

  function setSlides(items: typeof slides) {
    onChange("carousel.slides", JSON.stringify(items));
  }

  function addSlide() {
    setSlides([...slides, {img:"",title:"Новый слайд",desc:""}]);
    setExpanded(slides.length);
  }

  function removeSlide(i: number) {
    if (!confirm("Удалить слайд?")) return;
    setSlides(slides.filter((_, idx) => idx !== i));
  }

  function moveSlide(i: number, dir: -1 | 1) {
    const n = [...slides];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    setSlides(n);
    setExpanded(j);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Заголовок раздела" value={content["carousel.title"] || ""} onChange={v => onChange("carousel.title", v)} />
        <Field label="Подзаголовок" value={content["carousel.subtitle"] || ""} onChange={v => onChange("carousel.subtitle", v)} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">Слайды ({slides.length})</label>
          <button onClick={addSlide} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{background:"#3ca615"}}>
            <Icon name="Plus" size={12} /> Добавить
          </button>
        </div>
        <div className="space-y-2">
          {slides.map((slide, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}>
                {slide.img && <img src={slide.img} alt="" className="w-10 h-7 object-cover rounded shrink-0" />}
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">{slide.title || "Без названия"}</span>
                <div className="flex gap-1">
                  <button onClick={e => {e.stopPropagation(); moveSlide(i, -1);}} disabled={i===0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><Icon name="ChevronUp" size={14} /></button>
                  <button onClick={e => {e.stopPropagation(); moveSlide(i, 1);}} disabled={i===slides.length-1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><Icon name="ChevronDown" size={14} /></button>
                  <button onClick={e => {e.stopPropagation(); removeSlide(i);}}
                    className="p-1 text-gray-400 hover:text-red-500"><Icon name="Trash2" size={14} /></button>
                  <Icon name={expanded === i ? "ChevronUp" : "ChevronDown"} size={14} className="text-gray-400 ml-1" />
                </div>
              </div>
              {expanded === i && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                  <ImageUpload label="Изображение" value={slide.img}
                    onChange={url => { const n=[...slides]; n[i]={...n[i],img:url}; setSlides(n); }} />
                  <Field label="Заголовок" value={slide.title}
                    onChange={v => { const n=[...slides]; n[i]={...n[i],title:v}; setSlides(n); }} />
                  <Field label="Описание" value={slide.desc} textarea
                    onChange={v => { const n=[...slides]; n[i]={...n[i],desc:v}; setSlides(n); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Секция: Контакты ──────────────────────────────────────────────────────────

export function ContactsEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Основные контакты */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Основные контакты</p>
        <p className="text-[10px] text-gray-400">Применяются в шапке, футере, на всех страницах сайта</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Телефон (отображаемый)" value={content["contacts.phone"] || ""} onChange={v => onChange("contacts.phone", v)} />
          <Field label="Телефон (href)" value={content["contacts.phone_href"] || ""} onChange={v => onChange("contacts.phone_href", v)} hint="Например: tel:+79142727187" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email" value={content["contacts.email"] || ""} onChange={v => onChange("contacts.email", v)} />
          <Field label="Часы работы" value={content["contacts.hours"] || ""} onChange={v => onChange("contacts.hours", v)} />
        </div>
        <Field label="Адрес" value={content["contacts.address"] || ""} onChange={v => onChange("contacts.address", v)} />
      </div>

      {/* Соцсети */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Социальные сети</p>
        <p className="text-[10px] text-gray-400">Оставь пустым — ссылка не будет отображаться</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ВКонтакте (URL)" value={content["contacts.vk"] || ""} onChange={v => onChange("contacts.vk", v)} hint="https://vk.com/..." />
          <Field label="Telegram (URL или @username)" value={content["contacts.telegram"] || ""} onChange={v => onChange("contacts.telegram", v)} hint="https://t.me/..." />
          <Field label="WhatsApp (URL)" value={content["contacts.whatsapp"] || ""} onChange={v => onChange("contacts.whatsapp", v)} hint="https://wa.me/79142727187" />
          <Field label="Instagram (URL)" value={content["contacts.instagram"] || ""} onChange={v => onChange("contacts.instagram", v)} hint="https://instagram.com/..." />
        </div>
      </div>

      {/* Карта */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Карта</p>
        <Field label="URL Яндекс.Карты (iframe)" value={content["contacts.map_url"] || ""} onChange={v => onChange("contacts.map_url", v)}
          hint="Вставь ссылку из конструктора карт Яндекса (Поделиться → Код для вставки → src=...)" />
      </div>

      {/* Футер */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Футер сайта</p>
        <Field label="Текст копирайта" value={content["footer.copyright"] || ""} onChange={v => onChange("footer.copyright", v)}
          hint={`По умолчанию: © ${new Date().getFullYear()} ProFiX. Все права защищены.`} />
        <ImageUpload label="Логотип в футере" value={content["footer.logo"] || ""} onChange={v => onChange("footer.logo", v)} />
      </div>
    </div>
  );
}

// ── Секция: О компании ────────────────────────────────────────────────────────

export function AboutEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={content["about.title"] || ""} onChange={v => onChange("about.title", v)} />
      <Field label="Абзац 1" value={content["about.text1"] || ""} onChange={v => onChange("about.text1", v)} textarea />
      <Field label="Абзац 2" value={content["about.text2"] || ""} onChange={v => onChange("about.text2", v)} textarea />
    </div>
  );
}

// ── Секция: Услуги ────────────────────────────────────────────────────────────

export function ServicesEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const items = parseJson<{icon:string;title:string;desc:string}[]>(content["services.items"] || "", []);
  const [expanded, setExpanded] = useState<number | null>(null);

  function set(arr: typeof items) { onChange("services.items", JSON.stringify(arr)); }

  return (
    <div className="space-y-4">
      <Field label="Заголовок раздела" value={content["services.title"] || ""} onChange={v => onChange("services.title", v)} />
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">Услуги ({items.length})</label>
          <button onClick={() => { set([...items,{icon:"Star",title:"Новая услуга",desc:""}]); setExpanded(items.length); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{background:"#3ca615"}}>
            <Icon name="Plus" size={12} /> Добавить
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpanded(expanded === i ? null : i)}>
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">{item.title}</span>
                <button onClick={e=>{e.stopPropagation(); if(!confirm("Удалить?")) return; set(items.filter((_,idx)=>idx!==i));}}
                  className="p-1 text-gray-400 hover:text-red-500"><Icon name="Trash2" size={14} /></button>
                <Icon name={expanded===i?"ChevronUp":"ChevronDown"} size={14} className="text-gray-400" />
              </div>
              {expanded === i && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Иконка (lucide)" value={item.icon}
                      onChange={v => { const n=[...items]; n[i]={...n[i],icon:v}; set(n); }} />
                    <Field label="Заголовок" value={item.title}
                      onChange={v => { const n=[...items]; n[i]={...n[i],title:v}; set(n); }} />
                  </div>
                  <Field label="Описание" value={item.desc} textarea
                    onChange={v => { const n=[...items]; n[i]={...n[i],desc:v}; set(n); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Секция: Услуги 1С ─────────────────────────────────────────────────────────

export function OnecEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const items = parseJson<{icon:string;title:string;desc:string;img:string}[]>(content["onec.items"] || "", []);
  const [expanded, setExpanded] = useState<number | null>(null);

  function set(arr: typeof items) { onChange("onec.items", JSON.stringify(arr)); }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">Услуги 1С ({items.length})</label>
          <button onClick={() => { set([...items,{icon:"Star",title:"Новая услуга",desc:"",img:""}]); setExpanded(items.length); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{background:"#3ca615"}}>
            <Icon name="Plus" size={12} /> Добавить
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpanded(expanded === i ? null : i)}>
                {item.img && <img src={item.img} alt="" className="w-10 h-7 object-cover rounded shrink-0" />}
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">{item.title}</span>
                <button onClick={e=>{e.stopPropagation(); if(!confirm("Удалить?")) return; set(items.filter((_,idx)=>idx!==i));}}
                  className="p-1 text-gray-400 hover:text-red-500"><Icon name="Trash2" size={14} /></button>
                <Icon name={expanded===i?"ChevronUp":"ChevronDown"} size={14} className="text-gray-400" />
              </div>
              {expanded === i && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Иконка (lucide)" value={item.icon}
                      onChange={v => { const n=[...items]; n[i]={...n[i],icon:v}; set(n); }} />
                    <Field label="Заголовок" value={item.title}
                      onChange={v => { const n=[...items]; n[i]={...n[i],title:v}; set(n); }} />
                  </div>
                  <Field label="Описание" value={item.desc} textarea
                    onChange={v => { const n=[...items]; n[i]={...n[i],desc:v}; set(n); }} />
                  <ImageUpload label="Изображение" value={item.img}
                    onChange={url => { const n=[...items]; n[i]={...n[i],img:url}; set(n); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Редактор порядка блоков главной ──────────────────────────────────────────

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
