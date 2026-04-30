import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { ContentMap, parseJson, Field, ImageUpload } from "./editor-shared";

// ── Редактор навбара ──────────────────────────────────────────────────────────

type NavItem = {
  id: string;
  type: "section" | "link" | "shop" | "cabinet" | "page";
  label: string;
  href?: string;
  slug?: string;
  section?: string;
  icon?: string;
  visible: boolean;
  style?: "text" | "button";
};

const BUILTIN_ITEMS: NavItem[] = [
  { id: "sec-main",     type: "section", label: "Главная",    section: "Главная",    visible: true, style: "text" },
  { id: "sec-services", type: "section", label: "Услуги",     section: "Услуги",     visible: true, style: "text" },
  { id: "sec-1c",       type: "section", label: "1С",         section: "1С",         visible: true, style: "text" },
  { id: "sec-about",    type: "section", label: "О компании", section: "О компании", visible: true, style: "text" },
  { id: "sec-contacts", type: "section", label: "Контакты",   section: "Контакты",   visible: true, style: "text" },
  { id: "shop",         type: "shop",    label: "Магазин",                           visible: true, style: "button" },
  { id: "cabinet",      type: "cabinet", label: "Кабинет",                           visible: true, style: "button" },
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

export function NavbarEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const [items, setItems] = useState<NavItem[]>(() => {
    const saved = parseJson<NavItem[]>(content["navbar.items"] || "", []);
    if (saved.length > 0) return saved;
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
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${TYPE_COLOR[item.type] || "bg-gray-100 text-gray-500"}`}>
                {TYPE_LABEL[item.type]}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${item.style === "button" ? "bg-amber-50 text-amber-600" : "bg-sky-50 text-sky-600"}`}>
                {item.style === "button" ? "кнопка" : "меню"}
              </span>
              <span className="flex-1 text-sm font-medium text-gray-700 truncate">{item.label}</span>
              <button onClick={() => move(i, -1)} disabled={i===0} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                <Icon name="ChevronUp" size={13} />
              </button>
              <button onClick={() => move(i, 1)} disabled={i===items.length-1} className="p-0.5 text-gray-300 hover:text-gray-600 disabled:opacity-20">
                <Icon name="ChevronDown" size={13} />
              </button>
              <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="p-1 text-gray-400 hover:text-gray-700">
                <Icon name={expanded === item.id ? "ChevronUp" : "Settings2"} size={14} />
              </button>
              {item.type === "link" && (
                <button onClick={() => remove(item.id)} className="p-1 text-gray-300 hover:text-red-500">
                  <Icon name="Trash2" size={13} />
                </button>
              )}
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
  { key: "atol",         label: "АТОЛ",           path: "/atol" },
  { key: "sbis",         label: "СБИС",           path: "/sbis" },
  { key: "datamobile",   label: "DataMobile",     path: "/datamobile" },
  { key: "dreamkas",     label: "Дримкас",        path: "/dreamkas" },
  { key: "ofd_yandex",   label: "Яндекс ОФД",    path: "/ofd-yandex" },
  { key: "platforma_ofd",label: "Платформа ОФД",  path: "/platforma-ofd" },
  { key: "poscenter",    label: "POSCenter",      path: "/poscenter" },
  { key: "onec",         label: "1С Франчайзи",   path: "/1c" },
];

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

export function PartnerEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
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
