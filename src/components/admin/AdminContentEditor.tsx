import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { fetchContent, saveContent, uploadContentImage, invalidateContent } from "@/lib/content-api";

type ContentMap = Record<string, string>;

// ── Утилиты ───────────────────────────────────────────────────────────────────

function parseJson<T>(val: string, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

// ── Компонент поля ────────────────────────────────────────────────────────────

function Field({ label, value, onChange, textarea = false, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {hint && <p className="text-[10px] text-gray-400 mb-1">{hint}</p>}
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-y" />
        : <input value={value} onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
      }
    </div>
  );
}

// ── Загрузка изображения ──────────────────────────────────────────────────────

function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const result = ev.target?.result as string;
      const url = await uploadContentImage(result.split(",")[1], file.type);
      onChange(url);
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        {value && (
          <img src={value} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200 shrink-0" />
        )}
        <div className="flex-1">
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL изображения"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-green-400 mb-1.5" />
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50">
            <Icon name="Upload" size={12} />
            {uploading ? "Загрузка..." : "Загрузить"}
          </button>
          <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      </div>
    </div>
  );
}

// ── Секция: Главный экран ─────────────────────────────────────────────────────

function HeroEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
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

function CarouselEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
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

function ContactsEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
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

function AboutEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={content["about.title"] || ""} onChange={v => onChange("about.title", v)} />
      <Field label="Абзац 1" value={content["about.text1"] || ""} onChange={v => onChange("about.text1", v)} textarea />
      <Field label="Абзац 2" value={content["about.text2"] || ""} onChange={v => onChange("about.text2", v)} textarea />
    </div>
  );
}

// ── Секция: Услуги ────────────────────────────────────────────────────────────

function ServicesEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
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

function OnecEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
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

// ── Порядок страниц в навигации ───────────────────────────────────────────────

function NavPagesOrder({ onChange }: { onChange: (key: string, val: string) => void }) {
  const [pages, setPages] = useState<{slug:string; nav_label:string}[]>([]);

  useEffect(() => {
    import("@/lib/pages-api").then(({ pagesApi }) => {
      pagesApi.list(false).then((r: {pages?: {slug:string;nav_label:string;title:string;show_in_nav:boolean}[]}) => {
        if (r.pages) setPages(r.pages.filter(p => p.show_in_nav).map(p => ({ slug: p.slug, nav_label: p.nav_label || p.title })));
      });
    });
  }, []);

  function move(i: number, dir: -1 | 1) {
    const n = [...pages];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    setPages(n);
    onChange("navbar.nav_pages_order", JSON.stringify(n.map(p => p.slug)));
  }

  if (pages.length === 0) return <p className="text-xs text-gray-400 text-center py-2">Нет страниц с включённой навигацией</p>;

  return (
    <div className="space-y-1.5">
      {pages.map((p, i) => (
        <div key={p.slug} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200">
          <span className="text-sm text-gray-700 flex-1 truncate">{p.nav_label}</span>
          <span className="text-xs text-gray-400">/p/{p.slug}</span>
          <div className="flex gap-1">
            <button onClick={() => move(i, -1)} disabled={i===0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">
              <Icon name="ChevronUp" size={13} />
            </button>
            <button onClick={() => move(i, 1)} disabled={i>=pages.length-1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30">
              <Icon name="ChevronDown" size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Редактор навбара ──────────────────────────────────────────────────────────

// Типы элементов навбара
// type: "section" — якорь на главной, "link" — произвольная ссылка, "page" — кастомная страница
// "shop" / "cabinet" — встроенные кнопки
type NavItem = {
  id: string;
  type: "section" | "link" | "shop" | "cabinet" | "page";
  label: string;
  href?: string;         // для type=link
  slug?: string;         // для type=page
  section?: string;      // для type=section
  icon?: string;
  visible: boolean;
  style?: "text" | "button"; // кнопки справа или ссылки в меню
};

const BUILTIN_ITEMS: NavItem[] = [
  { id: "sec-main",     type: "section", label: "Главная",    section: "Главная",    visible: true,  style: "text" },
  { id: "sec-services", type: "section", label: "Услуги",     section: "Услуги",     visible: true,  style: "text" },
  { id: "sec-1c",       type: "section", label: "1С",         section: "1С",         visible: true,  style: "text" },
  { id: "sec-about",    type: "section", label: "О компании", section: "О компании", visible: true,  style: "text" },
  { id: "sec-contacts", type: "section", label: "Контакты",   section: "Контакты",   visible: true,  style: "text" },
  { id: "shop",         type: "shop",    label: "Магазин",                           visible: true,  style: "button" },
  { id: "cabinet",      type: "cabinet", label: "Кабинет",                           visible: true,  style: "button" },
];

const TYPE_LABEL: Record<string, string> = {
  section: "Якорь",
  link:    "Ссылка",
  shop:    "Магазин",
  cabinet: "Кабинет",
  page:    "Страница",
};

const TYPE_COLOR: Record<string, string> = {
  section: "bg-blue-50 text-blue-600",
  link:    "bg-purple-50 text-purple-600",
  shop:    "bg-green-50 text-green-600",
  cabinet: "bg-green-50 text-green-600",
  page:    "bg-orange-50 text-orange-600",
};

function NavbarEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  // Загружаем сохранённый список или строим из старых ключей
  const [items, setItems] = useState<NavItem[]>(() => {
    const saved = parseJson<NavItem[]>(content["navbar.items"] || "", []);
    if (saved.length > 0) return saved;
    // Миграция из старого формата
    const base = BUILTIN_ITEMS.map(b => ({
      ...b,
      visible: b.id === "shop"    ? content["navbar.show_shop"]    !== "false"
             : b.id === "cabinet" ? content["navbar.show_cabinet"] !== "false"
             : true,
    }));
    const extra = parseJson<{label:string;href:string;icon?:string}[]>(content["navbar.extra_links"] || "", []);
    const extraItems: NavItem[] = extra.map((e, i) => ({
      id: `link-${i}`, type: "link", label: e.label, href: e.href, icon: e.icon, visible: true, style: "button",
    }));
    return [...base, ...extraItems];
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const dragIdx = useRef<number | null>(null);

  function save(arr: NavItem[]) {
    setItems(arr);
    onChange("navbar.items", JSON.stringify(arr));
  }

  function toggle(id: string) {
    save(items.map(it => it.id === id ? { ...it, visible: !it.visible } : it));
  }

  function update(id: string, patch: Partial<NavItem>) {
    save(items.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  function remove(id: string) {
    save(items.filter(it => it.id !== id));
    if (expanded === id) setExpanded(null);
  }

  function addLink() {
    const id = `link-${Date.now()}`;
    const newItem: NavItem = { id, type: "link", label: "Новая ссылка", href: "/", icon: "", visible: true, style: "button" };
    save([...items, newItem]);
    setExpanded(id);
  }

  function move(i: number, dir: -1|1) {
    const n = [...items];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    save(n);
  }

  function onDragStart(i: number) { dragIdx.current = i; }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const n = [...items];
    const [item] = n.splice(dragIdx.current, 1);
    n.splice(i, 0, item);
    dragIdx.current = i;
    save(n);
  }

  // Превью навбара
  const visibleItems = items.filter(it => it.visible);

  return (
    <div className="space-y-5">
      {/* Телефон */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Телефон в шапке</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Отображаемый номер" value={content["navbar.phone"] || ""} onChange={v => onChange("navbar.phone", v)} />
          <Field label="Ссылка (href)" value={content["navbar.phone_href"] || ""} onChange={v => onChange("navbar.phone_href", v)}
            hint="Например: tel:+79142727187" />
        </div>
      </div>

      {/* Превью */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Превью навбара</p>
        <div className="bg-white rounded-xl border border-gray-200 px-3 py-2.5 flex items-center gap-1 flex-wrap">
          <span className="font-bold text-[#3ca615] text-sm mr-2">ПРОФИКС</span>
          {visibleItems.filter(it => it.style !== "button").map(it => (
            <span key={it.id} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{it.label}</span>
          ))}
          <span className="flex-1" />
          {visibleItems.filter(it => it.style === "button").map(it => (
            <span key={it.id} className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 flex items-center gap-1">
              {it.icon && <Icon name={it.icon as "Star"} size={11} fallback="Link" />}{it.label}
            </span>
          ))}
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#3ca615] text-white">
            {content["navbar.phone"] || "+7 (914) 272-71-87"}
          </span>
        </div>
      </div>

      {/* Список элементов */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Элементы навигации</p>
          <button onClick={addLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{background:"#3ca615"}}>
            <Icon name="Plus" size={12} /> Добавить ссылку
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mb-2">Перетащи для изменения порядка. Переключатель — показать/скрыть.</p>

        {items.map((item, i) => (
          <div key={item.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={e => onDragOver(e, i)}
            className={`rounded-xl border transition-all ${item.visible ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"}`}
          >
            {/* Строка элемента */}
            <div className="flex items-center gap-2 px-3 py-2.5 cursor-grab active:cursor-grabbing">
              <Icon name="GripVertical" size={14} className="text-gray-300 shrink-0" />
              {/* Тип-бейдж */}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${TYPE_COLOR[item.type] || "bg-gray-100 text-gray-500"}`}>
                {TYPE_LABEL[item.type]}
              </span>
              {/* Позиция */}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${item.style === "button" ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600"}`}>
                {item.style === "button" ? "кнопка" : "меню"}
              </span>
              {/* Название */}
              <span className="flex-1 text-sm font-medium text-gray-700 truncate">{item.label}</span>
              {/* Стрелки */}
              <button onClick={() => move(i, -1)} disabled={i===0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                <Icon name="ChevronUp" size={13} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i===items.length-1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                <Icon name="ChevronDown" size={13} />
              </button>
              {/* Редактировать — только не встроенные разделы */}
              <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="p-1 text-gray-400 hover:text-gray-700">
                <Icon name={expanded === item.id ? "ChevronUp" : "Settings2"} size={14} />
              </button>
              {/* Удалить — только кастомные */}
              {item.type === "link" && (
                <button onClick={() => remove(item.id)} className="p-1 text-gray-300 hover:text-red-500">
                  <Icon name="Trash2" size={13} />
                </button>
              )}
              {/* Тоггл */}
              <button onClick={() => toggle(item.id)}
                className={`ml-1 w-9 h-5 rounded-full transition-colors relative shrink-0 ${item.visible ? "bg-green-500" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${item.visible ? "translate-x-4" : "translate-x-0.5"}`} />
              </button>
            </div>

            {/* Панель редактирования */}
            {expanded === item.id && (
              <div className="px-3 pb-3 pt-0 border-t border-gray-100 space-y-2 bg-gray-50 rounded-b-xl">
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Field label="Название" value={item.label}
                    onChange={v => update(item.id, { label: v })} />
                  {item.type === "link" && (
                    <Field label="Ссылка (href)" value={item.href || ""}
                      onChange={v => update(item.id, { href: v })} />
                  )}
                  {item.type === "section" && (
                    <Field label="Якорь (ID секции)" value={item.section || ""}
                      onChange={v => update(item.id, { section: v })}
                      hint="Главная / Услуги / 1С / О компании / Контакты" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(item.type === "link" || item.type === "shop" || item.type === "cabinet") && (
                    <Field label="Иконка (lucide, необязательно)" value={item.icon || ""}
                      onChange={v => update(item.id, { icon: v })} hint="Например: ShoppingCart, User, Star" />
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Позиция в навбаре</label>
                    <div className="flex gap-2">
                      {[{v:"text",l:"В меню"},{v:"button",l:"Кнопка справа"}].map(opt => (
                        <button key={opt.v} onClick={() => update(item.id, {style: opt.v as "text"|"button"})}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${item.style===opt.v ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Редактор страницы партнёра ────────────────────────────────────────────────

const PARTNERS = [
  { key: "atol", label: "АТОЛ", path: "/atol" },
  { key: "sbis", label: "СБИС", path: "/sbis" },
  { key: "datamobile", label: "DataMobile", path: "/datamobile" },
  { key: "dreamkas", label: "Дримкас", path: "/dreamkas" },
  { key: "ofd_yandex", label: "Яндекс ОФД", path: "/ofd-yandex" },
  { key: "platforma_ofd", label: "Платформа ОФД", path: "/platforma-ofd" },
  { key: "poscenter", label: "POSCenter", path: "/poscenter" },
  { key: "onec", label: "1С Франчайзи", path: "/1c" },
];

// Универсальный список карточек с произвольными полями
function CardList({ label, contentKey, fields, content, onChange }: {
  label: string;
  contentKey: string;
  fields: {key: string; label: string; textarea?: boolean}[];
  content: ContentMap;
  onChange: (key: string, val: string) => void;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const emptyItem = Object.fromEntries(fields.map(f => [f.key, ""]));
  const items = parseJson<Record<string,string>[]>(content[contentKey] || "", []);

  function set(arr: typeof items) { onChange(contentKey, JSON.stringify(arr)); }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-500">{label} ({items.length})</label>
        <button onClick={() => { set([...items, {...emptyItem}]); setExpanded(items.length); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{background:"#3ca615"}}>
          <Icon name="Plus" size={12} /> Добавить
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <span className="text-sm font-medium text-gray-800 flex-1 truncate">
                {item.name || item.title || item.icon || `Карточка ${i+1}`}
              </span>
              <button onClick={e => { e.stopPropagation(); if (!confirm("Удалить?")) return; set(items.filter((_,idx)=>idx!==i)); }}
                className="p-1 text-gray-400 hover:text-red-500"><Icon name="Trash2" size={14} /></button>
              <Icon name={expanded===i?"ChevronUp":"ChevronDown"} size={14} className="text-gray-400" />
            </div>
            {expanded === i && (
              <div className="p-4 space-y-3 border-t border-gray-100">
                {fields.map(f => (
                  <Field key={f.key} label={f.label} value={item[f.key] || ""} textarea={f.textarea}
                    onChange={v => { const n=[...items]; n[i]={...n[i],[f.key]:v}; set(n); }} />
                ))}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
            Нет карточек — нажмите «Добавить»
          </p>
        )}
      </div>
    </div>
  );
}

function PartnerEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const [activePartner, setActivePartner] = useState("atol");
  const partner = PARTNERS.find(p => p.key === activePartner)!;
  const prefix = `partner.${activePartner}`;
  const isDataMobile = activePartner === "datamobile";

  return (
    <div className="space-y-5">
      {/* Выбор партнёра */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Страница партнёра</label>
        <div className="flex flex-wrap gap-2">
          {PARTNERS.map(p => (
            <button key={p.key} onClick={() => setActivePartner(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${activePartner === p.key ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-green-400"}`}
              style={activePartner === p.key ? {background:"#3ca615"} : {}}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{partner.label}</h3>
          <a href={partner.path} target="_blank"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors">
            <Icon name="ExternalLink" size={12} /> Открыть страницу
          </a>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <ImageUpload label="Логотип партнёра (карточка на главной странице)"
            value={content[`${prefix}.logo`] || ""}
            onChange={v => onChange(`${prefix}.logo`, v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Название (карточка на главной)" value={content[`${prefix}.card_name`] || ""}
              onChange={v => onChange(`${prefix}.card_name`, v)} />
            <Field label="Тег (карточка на главной)" value={content[`${prefix}.card_tag`] || ""}
              onChange={v => onChange(`${prefix}.card_tag`, v)} />
          </div>
          <Field label="Заголовок (H1)" value={content[`${prefix}.hero_title`] || ""}
            onChange={v => onChange(`${prefix}.hero_title`, v)} />
          <Field label="Описание под заголовком" value={content[`${prefix}.hero_desc`] || ""}
            onChange={v => onChange(`${prefix}.hero_desc`, v)} textarea />
        </div>

        {/* DataMobile — три отдельных блока */}
        {isDataMobile ? (
          <div className="space-y-6">
            <CardList
              label="Версии DataMobile (карточки с ценами)"
              contentKey="partner.datamobile.main_products"
              fields={[
                {key:"name", label:"Название"},
                {key:"price", label:"Цена"},
                {key:"badge", label:"Бейдж (например: Популярный)"},
                {key:"description", label:"Описание", textarea:true},
                {key:"features", label:"Функции (через запятую)"},
              ]}
              content={content} onChange={onChange}
            />
            <CardList
              label="Дополнительные модули"
              contentKey="partner.datamobile.modules"
              fields={[
                {key:"name", label:"Название"},
                {key:"price", label:"Цена"},
                {key:"description", label:"Описание", textarea:true},
              ]}
              content={content} onChange={onChange}
            />
            <CardList
              label="Профильные решения"
              contentKey="partner.datamobile.solutions"
              fields={[
                {key:"icon", label:"Иконка (lucide)"},
                {key:"name", label:"Название"},
                {key:"price", label:"Цена"},
                {key:"description", label:"Описание", textarea:true},
              ]}
              content={content} onChange={onChange}
            />
          </div>
        ) : (
          /* Остальные партнёры — один блок продуктов */
          <CardList
            label="Продукты / услуги"
            contentKey={`${prefix}.products`}
            fields={[
              {key:"icon", label:"Иконка (lucide)"},
              {key:"name", label:"Название"},
              {key:"desc", label:"Описание", textarea:true},
            ]}
            content={content} onChange={onChange}
          />
        )}
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
  { key: "compact",    label: "Компактный",  hint: "Минимум места, только заголовок и кнопки",   height: "h-8" },
  { key: "medium",     label: "Средний",     hint: "Оптимально — заголовок, текст, фото",         height: "h-14" },
  { key: "large",      label: "Большой",     hint: "Крупный hero с фото и бейджами",              height: "h-20" },
  { key: "fullscreen", label: "На весь экран", hint: "Занимает весь первый экран",                height: "h-28" },
];

function HomeBlocksEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
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

// ── Главный редактор ──────────────────────────────────────────────────────────

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