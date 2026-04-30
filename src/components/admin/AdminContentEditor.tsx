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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Телефон" value={content["contacts.phone"] || ""} onChange={v => onChange("contacts.phone", v)} />
        <Field label="Email" value={content["contacts.email"] || ""} onChange={v => onChange("contacts.email", v)} />
      </div>
      <Field label="Адрес" value={content["contacts.address"] || ""} onChange={v => onChange("contacts.address", v)} />
      <Field label="Часы работы" value={content["contacts.hours"] || ""} onChange={v => onChange("contacts.hours", v)} />
      <Field label="URL Яндекс.Карты (iframe)" value={content["contacts.map_url"] || ""} onChange={v => onChange("contacts.map_url", v)}
        hint="Вставь ссылку из конструктора карт Яндекса" />
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

function NavbarEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const extraLinks = parseJson<{label:string;href:string;icon?:string}[]>(content["navbar.extra_links"] || "", []);
  const [exp, setExp] = useState<number|null>(null);

  function setLinks(items: typeof extraLinks) { onChange("navbar.extra_links", JSON.stringify(items)); }

  return (
    <div className="space-y-5">
      {/* Телефон */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Телефон в шапке</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Отображаемый номер" value={content["navbar.phone"] || ""} onChange={v => onChange("navbar.phone", v)} />
          <Field label="Ссылка href" value={content["navbar.phone_href"] || ""} onChange={v => onChange("navbar.phone_href", v)}
            hint="Например: tel:+79142727187" />
        </div>
      </div>

      {/* Показывать кнопки */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Кнопки навигации</p>
        <div className="flex flex-wrap gap-4">
          {[
            { key: "navbar.show_shop", label: "Магазин" },
            { key: "navbar.show_cabinet", label: "Кабинет клиента" },
          ].map(item => {
            const val = content[item.key] !== "false";
            return (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => onChange(item.key, val ? "false" : "true")}
                  className={`w-10 h-5 rounded-full transition-colors relative ${val ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Порядок страниц в навигации */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Порядок кастомных страниц</p>
        <p className="text-[10px] text-gray-400">Страницы с включённым «В навигации» в конструкторе</p>
        <NavPagesOrder onChange={onChange} />
      </div>

      {/* Дополнительные ссылки */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Дополнительные ссылки</p>
          <button onClick={() => { setLinks([...extraLinks, {label:"Новая ссылка", href:"/", icon:""}]); setExp(extraLinks.length); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white" style={{background:"#3ca615"}}>
            <Icon name="Plus" size={12} /> Добавить
          </button>
        </div>
        <p className="text-[10px] text-gray-400">Добавляются в навигацию после стандартных разделов</p>
        <div className="space-y-2">
          {extraLinks.map((link, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <div className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
                onClick={() => setExp(exp === i ? null : i)}>
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">{link.label}</span>
                <button onClick={e => { e.stopPropagation(); setLinks(extraLinks.filter((_,j)=>j!==i)); }}
                  className="p-1 text-gray-400 hover:text-red-500"><Icon name="Trash2" size={14} /></button>
                <Icon name={exp===i?"ChevronUp":"ChevronDown"} size={14} className="text-gray-400" />
              </div>
              {exp === i && (
                <div className="p-3 space-y-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Название" value={link.label}
                      onChange={v => { const n=[...extraLinks]; n[i]={...n[i],label:v}; setLinks(n); }} />
                    <Field label="Ссылка" value={link.href}
                      onChange={v => { const n=[...extraLinks]; n[i]={...n[i],href:v}; setLinks(n); }} />
                  </div>
                  <Field label="Иконка lucide (необязательно)" value={link.icon || ""}
                    onChange={v => { const n=[...extraLinks]; n[i]={...n[i],icon:v}; setLinks(n); }} />
                </div>
              )}
            </div>
          ))}
          {extraLinks.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-3">Нет дополнительных ссылок</p>
          )}
        </div>
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

// ── Главный редактор ──────────────────────────────────────────────────────────

const TABS = [
  { key: "hero", label: "Главный экран", icon: "Home" },
  { key: "carousel", label: "Карусель", icon: "Images" },
  { key: "services", label: "Услуги", icon: "Wrench" },
  { key: "onec", label: "Услуги 1С", icon: "Monitor" },
  { key: "about", label: "О компании", icon: "Building2" },
  { key: "contacts", label: "Контакты", icon: "Phone" },
  { key: "navbar", label: "Навигация", icon: "Menu" },
  { key: "partners", label: "Страницы партнёров", icon: "Handshake" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function AdminContentEditor() {
  const [tab, setTab] = useState<TabKey>("hero");
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
    <div className="p-4 sm:p-6">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Редактор сайта</h2>
          <p className="text-sm text-gray-400 mt-0.5">Изменения применяются сразу после сохранения</p>
        </div>
        <div className="flex items-center gap-3">
          {hasPending && (
            <span className="text-xs text-orange-500 font-medium flex items-center gap-1">
              <Icon name="AlertCircle" size={13} />
              Есть несохранённые изменения
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasPending}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 ${saved ? "bg-green-500" : ""}`}
            style={saved ? {} : { background: "#3ca615" }}
          >
            <Icon name={saved ? "Check" : "Save"} size={16} />
            {saving ? "Сохранение..." : saved ? "Сохранено!" : "Сохранить"}
          </button>
          <a href="/" target="_blank" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors">
            <Icon name="ExternalLink" size={15} />
            Открыть сайт
          </a>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Боковое меню табов */}
        <aside className="w-48 shrink-0 hidden md:block">
          <nav className="space-y-1">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab === t.key ? "text-white" : "text-gray-600 hover:bg-gray-100"}`}
                style={tab === t.key ? {background:"#3ca615"} : {}}>
                <Icon name={t.icon as "Home"} size={16} />
                {t.label}
                {Object.keys(pending).some(k => k.startsWith(t.key === "hero" ? "hero." : t.key === "carousel" ? "carousel." : t.key === "contacts" ? "contacts." : t.key === "about" ? "about." : t.key === "services" ? "services." : "onec.")) && (
                  <span className="ml-auto w-2 h-2 bg-orange-400 rounded-full" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Мобильные табы */}
        <div className="md:hidden flex gap-1 overflow-x-auto mb-4 pb-1 w-full">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${tab === t.key ? "text-white" : "bg-white border border-gray-200 text-gray-600"}`}
              style={tab === t.key ? {background:"#3ca615"} : {}}>
              <Icon name={t.icon as "Home"} size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Контент */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-w-0">
          {tab === "hero" && <HeroEditor content={content} onChange={handleChange} />}
          {tab === "carousel" && <CarouselEditor content={content} onChange={handleChange} />}
          {tab === "services" && <ServicesEditor content={content} onChange={handleChange} />}
          {tab === "onec" && <OnecEditor content={content} onChange={handleChange} />}
          {tab === "about" && <AboutEditor content={content} onChange={handleChange} />}
          {tab === "contacts" && <ContactsEditor content={content} onChange={handleChange} />}
          {tab === "navbar" && <NavbarEditor content={content} onChange={handleChange} />}
          {tab === "partners" && <PartnerEditor content={content} onChange={handleChange} />}
        </div>
      </div>
    </div>
  );
}