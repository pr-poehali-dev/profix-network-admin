import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { pagesApi, CustomPage, PageBlock, Card } from "@/lib/pages-api";

// ── Загрузчик изображений ─────────────────────────────────────────────────────

function ImgUpload({ value, onChange, label = "Изображение" }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const result = ev.target?.result as string;
      const res = await pagesApi.uploadImage(result.split(",")[1], file.type);
      onChange(res.url || "");
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        {value && <img src={value} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200 shrink-0" />}
        <div className="flex-1 space-y-1.5">
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL картинки"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-green-400" />
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50 w-full justify-center">
            <Icon name="Upload" size={12} />
            {uploading ? "Загрузка..." : "Загрузить файл"}
          </button>
          <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, textarea, hint, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; hint?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {hint && <p className="text-[10px] text-gray-400 mb-1">{hint}</p>}
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-y" />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
      }
    </div>
  );
}

// ── Редакторы блоков ──────────────────────────────────────────────────────────

function HeroEditor({ block, onChange }: { block: Extract<PageBlock, {type:"hero"}>; onChange: (b: PageBlock) => void }) {
  const u = (k: string, v: string) => onChange({ ...block, [k]: v });
  return (
    <div className="space-y-3">
      <F label="Заголовок (H1)" value={block.title} onChange={v => u("title", v)} textarea hint="Перенос строки — новая строка в заголовке" />
      <F label="Подзаголовок" value={block.subtitle || ""} onChange={v => u("subtitle", v)} textarea />
      <F label="Бейдж (например: Официальный партнёр)" value={block.badge || ""} onChange={v => u("badge", v)} />
      <div className="grid grid-cols-2 gap-3">
        <F label="Цвет фона" value={block.bg_color || "#3ca615"} onChange={v => u("bg_color", v)} type="color" />
        <F label="Цвет текста" value={block.text_color || "#ffffff"} onChange={v => u("text_color", v)} type="color" />
      </div>
      <ImgUpload label="Фоновое изображение (необязательно)" value={block.image_url || ""} onChange={v => u("image_url", v)} />
      <div className="grid grid-cols-2 gap-3">
        <F label="Кнопка 1 — текст" value={block.btn1_text || ""} onChange={v => u("btn1_text", v)} />
        <F label="Кнопка 1 — ссылка" value={block.btn1_link || ""} onChange={v => u("btn1_link", v)} />
        <F label="Кнопка 2 — текст" value={block.btn2_text || ""} onChange={v => u("btn2_text", v)} />
        <F label="Кнопка 2 — ссылка" value={block.btn2_link || ""} onChange={v => u("btn2_link", v)} />
      </div>
    </div>
  );
}

function TextEditor({ block, onChange }: { block: Extract<PageBlock, {type:"text"}>; onChange: (b: PageBlock) => void }) {
  return (
    <div className="space-y-3">
      <F label="Заголовок (необязательно)" value={block.title || ""} onChange={v => onChange({ ...block, title: v })} />
      <F label="Текст" value={block.body} onChange={v => onChange({ ...block, body: v })} textarea />
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Выравнивание</label>
        <div className="flex gap-2">
          {(["left", "center"] as const).map(a => (
            <button key={a} onClick={() => onChange({ ...block, align: a })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${block.align === a ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
              style={block.align === a ? { background: "#3ca615" } : {}}>
              {a === "left" ? "По левому краю" : "По центру"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardsEditor({ block, onChange }: { block: Extract<PageBlock, {type:"cards"}>; onChange: (b: PageBlock) => void }) {
  const [exp, setExp] = useState<number | null>(null);
  const emptyCard: Card = { title: "Новая карточка", text: "", icon: "Star" };

  function setItems(items: Card[]) { onChange({ ...block, items }); }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <F label="Заголовок блока" value={block.title || ""} onChange={v => onChange({ ...block, title: v })} />
        <F label="Подзаголовок" value={block.subtitle || ""} onChange={v => onChange({ ...block, subtitle: v })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Колонок</label>
        <div className="flex gap-2">
          {([2,3,4] as const).map(c => (
            <button key={c} onClick={() => onChange({ ...block, cols: c })}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium border ${block.cols === c ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
              style={block.cols === c ? { background: "#3ca615" } : {}}>{c}</button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">Карточки ({block.items.length})</label>
          <button onClick={() => { setItems([...block.items, { ...emptyCard }]); setExp(block.items.length); }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white" style={{ background: "#3ca615" }}>
            <Icon name="Plus" size={12} /> Добавить
          </button>
        </div>
        <div className="space-y-2">
          {block.items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setExp(exp === i ? null : i)}>
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">{item.title}</span>
                <button onClick={e => { e.stopPropagation(); if (!confirm("Удалить?")) return; setItems(block.items.filter((_,j)=>j!==i)); }}
                  className="p-1 text-gray-400 hover:text-red-500"><Icon name="Trash2" size={14} /></button>
                <button onClick={e => { e.stopPropagation(); if (i === 0) return; const n=[...block.items]; [n[i],n[i-1]]=[n[i-1],n[i]]; setItems(n); }}
                  disabled={i===0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><Icon name="ChevronUp" size={14} /></button>
                <button onClick={e => { e.stopPropagation(); if (i >= block.items.length-1) return; const n=[...block.items]; [n[i],n[i+1]]=[n[i+1],n[i]]; setItems(n); }}
                  disabled={i>=block.items.length-1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><Icon name="ChevronDown" size={14} /></button>
                <Icon name={exp===i?"ChevronUp":"ChevronDown"} size={14} className="text-gray-400" />
              </div>
              {exp === i && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Заголовок" value={item.title} onChange={v => { const n=[...block.items]; n[i]={...n[i],title:v}; setItems(n); }} />
                    <F label="Цена" value={item.price || ""} onChange={v => { const n=[...block.items]; n[i]={...n[i],price:v}; setItems(n); }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Иконка (lucide)" value={item.icon || ""} onChange={v => { const n=[...block.items]; n[i]={...n[i],icon:v}; setItems(n); }} />
                    <F label="Бейдж" value={item.badge || ""} onChange={v => { const n=[...block.items]; n[i]={...n[i],badge:v}; setItems(n); }} />
                  </div>
                  <F label="Текст / описание" value={item.text || ""} textarea onChange={v => { const n=[...block.items]; n[i]={...n[i],text:v}; setItems(n); }} />
                  <ImgUpload label="Фото карточки (вместо иконки)" value={item.image_url || ""} onChange={v => { const n=[...block.items]; n[i]={...n[i],image_url:v}; setItems(n); }} />
                  <F label="Ссылка «Подробнее»" value={item.link || ""} onChange={v => { const n=[...block.items]; n[i]={...n[i],link:v}; setItems(n); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImageEditor({ block, onChange }: { block: Extract<PageBlock, {type:"image"}>; onChange: (b: PageBlock) => void }) {
  return (
    <div className="space-y-3">
      <ImgUpload label="Изображение" value={block.url} onChange={v => onChange({ ...block, url: v })} />
      <F label="Подпись под картинкой" value={block.caption || ""} onChange={v => onChange({ ...block, caption: v })} />
      <F label="Alt текст" value={block.alt || ""} onChange={v => onChange({ ...block, alt: v })} />
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Размер</label>
        <div className="flex gap-2">
          {(["medium","wide","full"] as const).map(s => (
            <button key={s} onClick={() => onChange({ ...block, size: s })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${block.size===s?"text-white border-transparent":"bg-white text-gray-600 border-gray-200"}`}
              style={block.size===s?{background:"#3ca615"}:{}}>
              {s==="medium"?"Средний":s==="wide"?"Широкий":"На всю ширину"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TwoColsEditor({ block, onChange }: { block: Extract<PageBlock, {type:"two_cols"}>; onChange: (b: PageBlock) => void }) {
  const [featuresText, setFeaturesText] = useState((block.features || []).join("\n"));
  function updateFeatures(t: string) {
    setFeaturesText(t);
    onChange({ ...block, features: t.split("\n").filter(Boolean) });
  }
  return (
    <div className="space-y-3">
      <F label="Заголовок" value={block.title || ""} onChange={v => onChange({ ...block, title: v })} />
      <F label="Текст" value={block.text} onChange={v => onChange({ ...block, text: v })} textarea />
      <ImgUpload label="Изображение" value={block.image_url || ""} onChange={v => onChange({ ...block, image_url: v })} />
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Позиция изображения</label>
        <div className="flex gap-2">
          {(["right","left"] as const).map(p => (
            <button key={p} onClick={() => onChange({ ...block, image_position: p })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${block.image_position===p?"text-white border-transparent":"bg-white text-gray-600 border-gray-200"}`}
              style={block.image_position===p?{background:"#3ca615"}:{}}>
              {p==="right"?"Справа":"Слева"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Список фич (каждая с новой строки)</label>
        <textarea value={featuresText} onChange={e => updateFeatures(e.target.value)} rows={4}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-y" />
      </div>
    </div>
  );
}

function StatsEditor({ block, onChange }: { block: Extract<PageBlock, {type:"stats"}>; onChange: (b: PageBlock) => void }) {
  function setItems(items: typeof block.items) { onChange({ ...block, items }); }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <F label="Заголовок" value={block.title || ""} onChange={v => onChange({ ...block, title: v })} />
        <F label="Цвет фона" value={block.accent_color || "#3ca615"} onChange={v => onChange({ ...block, accent_color: v })} type="color" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">Показатели</label>
          <button onClick={() => setItems([...block.items, { value: "0", label: "метрика" }])}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-white" style={{ background: "#3ca615" }}>
            <Icon name="Plus" size={12} /> Добавить
          </button>
        </div>
        <div className="space-y-2">
          {block.items.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={s.value} onChange={e => { const n=[...block.items]; n[i]={...n[i],value:e.target.value}; setItems(n); }}
                placeholder="1000+" className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
              <input value={s.label} onChange={e => { const n=[...block.items]; n[i]={...n[i],label:e.target.value}; setItems(n); }}
                placeholder="клиентов" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
              <button onClick={() => setItems(block.items.filter((_,j)=>j!==i))} className="p-1 text-gray-400 hover:text-red-500">
                <Icon name="X" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CtaEditor({ block, onChange }: { block: Extract<PageBlock, {type:"cta"}>; onChange: (b: PageBlock) => void }) {
  return (
    <div className="space-y-3">
      <F label="Заголовок" value={block.title} onChange={v => onChange({ ...block, title: v })} />
      <F label="Текст под заголовком" value={block.text || ""} onChange={v => onChange({ ...block, text: v })} textarea />
      <div className="grid grid-cols-2 gap-3">
        <F label="Текст кнопки" value={block.btn_text} onChange={v => onChange({ ...block, btn_text: v })} />
        <F label="Ссылка кнопки" value={block.btn_link} onChange={v => onChange({ ...block, btn_link: v })} />
      </div>
      <F label="Цвет фона" value={block.bg_color || "#0D1B2A"} onChange={v => onChange({ ...block, bg_color: v })} type="color" />
    </div>
  );
}

function ContactsEditor({ block, onChange }: { block: Extract<PageBlock, {type:"contacts"}>; onChange: (b: PageBlock) => void }) {
  return (
    <F label="Заголовок (необязательно)" value={block.title || ""} onChange={v => onChange({ ...block, title: v })} />
  );
}

function BlockEditor({ block, onChange }: { block: PageBlock; onChange: (b: PageBlock) => void }) {
  switch (block.type) {
    case "hero":     return <HeroEditor block={block} onChange={onChange} />;
    case "text":     return <TextEditor block={block} onChange={onChange} />;
    case "cards":    return <CardsEditor block={block} onChange={onChange} />;
    case "image":    return <ImageEditor block={block} onChange={onChange} />;
    case "two_cols": return <TwoColsEditor block={block} onChange={onChange} />;
    case "stats":    return <StatsEditor block={block} onChange={onChange} />;
    case "cta":      return <CtaEditor block={block} onChange={onChange} />;
    case "contacts": return <ContactsEditor block={block} onChange={onChange} />;
    default:         return null;
  }
}

// ── Дефолтные блоки ───────────────────────────────────────────────────────────

const BLOCK_TYPES: { type: PageBlock["type"]; label: string; icon: string; default: () => PageBlock }[] = [
  { type: "hero",     label: "Шапка",       icon: "Image",      default: () => ({ type: "hero", title: "Заголовок страницы", subtitle: "Подзаголовок", btn1_text: "Оставить заявку", btn1_link: "#contacts" }) },
  { type: "text",     label: "Текст",        icon: "AlignLeft",  default: () => ({ type: "text", title: "Заголовок", body: "Текст раздела..." }) },
  { type: "cards",    label: "Карточки",     icon: "LayoutGrid", default: () => ({ type: "cards", title: "Наши услуги", cols: 3, items: [{ title: "Услуга 1", icon: "Star", text: "Описание услуги" }] }) },
  { type: "image",    label: "Картинка",     icon: "ImageIcon",  default: () => ({ type: "image", url: "", alt: "", size: "wide" }) },
  { type: "two_cols", label: "2 колонки",    icon: "Columns2",   default: () => ({ type: "two_cols", title: "О нас", text: "Расскажите о компании...", image_position: "right", features: ["Опытная команда", "Быстрое выполнение"] }) },
  { type: "stats",    label: "Статистика",   icon: "BarChart2",  default: () => ({ type: "stats", items: [{ value: "100+", label: "клиентов" }, { value: "5+", label: "лет опыта" }] }) },
  { type: "cta",      label: "CTA кнопка",  icon: "Zap",        default: () => ({ type: "cta", title: "Готовы начать?", text: "Свяжитесь с нами", btn_text: "Позвонить", btn_link: "tel:+79142727187" }) },
  { type: "contacts", label: "Контакты",     icon: "Phone",      default: () => ({ type: "contacts", title: "Свяжитесь с нами" }) },
];

const BLOCK_LABELS: Record<string, string> = Object.fromEntries(BLOCK_TYPES.map(b => [b.type, b.label]));

// ── Основной компонент ────────────────────────────────────────────────────────

export default function AdminPageBuilder() {
  const [pages, setPages] = useState<Omit<CustomPage, "blocks">[]>([]);
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPage, setNewPage] = useState({ title: "", slug: "", meta_desc: "", accent_color: "#3ca615" });

  async function loadPages() {
    const res = await pagesApi.list(true);
    if (res.pages) setPages(res.pages);
  }

  async function openPage(page: Omit<CustomPage, "blocks">) {
    const res = await pagesApi.get(page.slug, true);
    if (res.page) { setEditingPage(res.page); setExpandedBlock(null); }
  }

  useEffect(() => { loadPages(); }, []);

  function updateBlock(i: number, block: PageBlock) {
    if (!editingPage) return;
    const blocks = [...editingPage.blocks];
    blocks[i] = block;
    setEditingPage({ ...editingPage, blocks });
  }

  function moveBlock(i: number, dir: -1 | 1) {
    if (!editingPage) return;
    const blocks = [...editingPage.blocks];
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    setEditingPage({ ...editingPage, blocks });
    setExpandedBlock(j);
  }

  function removeBlock(i: number) {
    if (!editingPage || !confirm("Удалить блок?")) return;
    const blocks = editingPage.blocks.filter((_, j) => j !== i);
    setEditingPage({ ...editingPage, blocks });
  }

  function addBlock(type: PageBlock["type"]) {
    if (!editingPage) return;
    const def = BLOCK_TYPES.find(b => b.type === type)!.default();
    const blocks = [...editingPage.blocks, def];
    setEditingPage({ ...editingPage, blocks });
    setExpandedBlock(blocks.length - 1);
    setShowAddBlock(false);
  }

  async function savePage() {
    if (!editingPage) return;
    setSaving(true);
    const res = await pagesApi.update(editingPage);
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); loadPages(); }
  }

  async function createPage() {
    if (!newPage.title || !newPage.slug) return;
    const res = await pagesApi.create({ ...newPage, blocks: [], is_published: false, show_in_nav: false });
    if (res.ok) {
      setCreating(false);
      setNewPage({ title: "", slug: "", meta_desc: "", accent_color: "#3ca615" });
      const r = await pagesApi.get(res.slug, true);
      if (r.page) setEditingPage(r.page);
      loadPages();
    }
  }

  async function togglePublish(page: Omit<CustomPage,"blocks">) {
    const r = await pagesApi.get(page.slug, true);
    if (!r.page) return;
    await pagesApi.update({ ...r.page, is_published: !page.is_published });
    loadPages();
  }

  async function deletePage(id: number) {
    if (!confirm("Удалить страницу навсегда?")) return;
    await pagesApi.remove(id);
    if (editingPage?.id === id) setEditingPage(null);
    loadPages();
  }

  // Редактор открытой страницы
  if (editingPage) return (
    <div className="p-4 sm:p-6">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditingPage(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <Icon name="ChevronLeft" size={16} /> Страницы
          </button>
          <span className="text-gray-300">/</span>
          <h2 className="text-lg font-bold text-gray-900 truncate max-w-xs">{editingPage.title}</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`/p/${editingPage.slug}`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-600 hover:border-green-400 hover:text-green-600 transition-colors">
            <Icon name="ExternalLink" size={13} /> Открыть
          </a>
          <button onClick={() => togglePublish(editingPage as unknown as Omit<CustomPage,"blocks">)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${editingPage.is_published ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-green-400"}`}>
            <Icon name={editingPage.is_published ? "Eye" : "EyeOff"} size={13} />
            {editingPage.is_published ? "Опубликована" : "Скрыта"}
          </button>
          <button onClick={savePage} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
            style={{ background: saved ? "#22c55e" : "#3ca615" }}>
            <Icon name={saved ? "Check" : "Save"} size={15} />
            {saving ? "Сохраняю..." : saved ? "Сохранено!" : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Настройки страницы */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Настройки страницы</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <F label="Заголовок страницы" value={editingPage.title} onChange={v => setEditingPage({ ...editingPage, title: v })} />
          <F label="URL: /p/..." value={editingPage.slug} onChange={v => setEditingPage({ ...editingPage, slug: v })} hint="Только латинница и дефис" />
          <F label="Акцентный цвет" value={editingPage.accent_color || "#3ca615"} onChange={v => setEditingPage({ ...editingPage, accent_color: v })} type="color" />
          <div className="flex items-center gap-4 pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <div onClick={() => setEditingPage({ ...editingPage, show_in_nav: !editingPage.show_in_nav })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${editingPage.show_in_nav ? "bg-green-500" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${editingPage.show_in_nav ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              В навигации
            </label>
          </div>
        </div>
        <div className="mt-3">
          <F label="Meta описание (для SEO)" value={editingPage.meta_desc || ""} onChange={v => setEditingPage({ ...editingPage, meta_desc: v })} textarea />
        </div>
      </div>

      {/* Блоки страницы */}
      <div className="space-y-3 mb-5">
        {editingPage.blocks.map((block, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedBlock(expandedBlock === i ? null : i)}>
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {i + 1}
              </div>
              <span className="text-sm font-medium text-gray-800 flex-1">
                {BLOCK_LABELS[block.type] || block.type}
                {block.type === "hero" && " — " + (block as Extract<PageBlock,{type:"hero"}>).title?.slice(0,30)}
                {block.type === "text" && " — " + ((block as Extract<PageBlock,{type:"text"}>).title || "").slice(0,30)}
                {block.type === "cards" && " — " + ((block as Extract<PageBlock,{type:"cards"}>).title || `${(block as Extract<PageBlock,{type:"cards"}>).items.length} карт.`)}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); moveBlock(i, -1); }} disabled={i===0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"><Icon name="ChevronUp" size={14} /></button>
                <button onClick={e => { e.stopPropagation(); moveBlock(i, 1); }} disabled={i>=editingPage.blocks.length-1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"><Icon name="ChevronDown" size={14} /></button>
                <button onClick={e => { e.stopPropagation(); removeBlock(i); }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Icon name="Trash2" size={14} /></button>
                <Icon name={expandedBlock===i?"ChevronUp":"ChevronDown"} size={14} className="text-gray-400 ml-1" />
              </div>
            </div>
            {expandedBlock === i && (
              <div className="px-4 pb-4 pt-1 border-t border-gray-100">
                <BlockEditor block={block} onChange={b => updateBlock(i, b)} />
              </div>
            )}
          </div>
        ))}

        {editingPage.blocks.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
            <Icon name="LayoutTemplate" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Страница пуста — добавьте первый блок</p>
          </div>
        )}
      </div>

      {/* Кнопка добавления блока */}
      {showAddBlock ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Выберите тип блока</h3>
            <button onClick={() => setShowAddBlock(false)} className="text-gray-400 hover:text-gray-600">
              <Icon name="X" size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => addBlock(bt.type)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-100 hover:border-green-400 hover:bg-green-50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                  <Icon name={bt.icon as "Image"} size={20} className="text-gray-500 group-hover:text-green-600" />
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-green-700">{bt.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAddBlock(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all text-sm font-medium">
          <Icon name="Plus" size={18} />
          Добавить блок
        </button>
      )}
    </div>
  );

  // Список страниц
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Страницы сайта</h2>
          <p className="text-sm text-gray-400 mt-0.5">Создавай любые страницы без программиста</p>
        </div>
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          style={{ background: "#3ca615" }}>
          <Icon name="Plus" size={16} />
          Создать страницу
        </button>
      </div>

      {/* Форма создания */}
      {creating && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Новая страница</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <F label="Название страницы *" value={newPage.title}
              onChange={v => setNewPage(p => ({
                ...p, title: v,
                slug: p.slug || v.toLowerCase().replace(/[^a-zа-я0-9]/gi, "-").replace(/а/g,"a").replace(/б/g,"b").replace(/в/g,"v").replace(/г/g,"g").replace(/д/g,"d").replace(/е/g,"e").replace(/ж/g,"zh").replace(/з/g,"z").replace(/и/g,"i").replace(/й/g,"y").replace(/к/g,"k").replace(/л/g,"l").replace(/м/g,"m").replace(/н/g,"n").replace(/о/g,"o").replace(/п/g,"p").replace(/р/g,"r").replace(/с/g,"s").replace(/т/g,"t").replace(/у/g,"u").replace(/ф/g,"f").replace(/х/g,"h").replace(/ц/g,"ts").replace(/ч/g,"ch").replace(/ш/g,"sh").replace(/щ/g,"sch").replace(/ъ/g,"").replace(/ы/g,"y").replace(/ь/g,"").replace(/э/g,"e").replace(/ю/g,"yu").replace(/я/g,"ya").replace(/-+/g,"-").toLowerCase().slice(0, 50)
              }))} />
            <F label="URL адрес: /p/... *" value={newPage.slug}
              onChange={v => setNewPage(p => ({ ...p, slug: v.toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"") }))}
              hint="Только латинница и дефис" />
          </div>
          <F label="Meta описание (SEO)" value={newPage.meta_desc} onChange={v => setNewPage(p => ({ ...p, meta_desc: v }))} textarea />
          <div className="flex gap-3 mt-4">
            <button onClick={createPage} disabled={!newPage.title || !newPage.slug}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#3ca615" }}>
              Создать
            </button>
            <button onClick={() => setCreating(false)}
              className="px-5 py-2.5 rounded-xl text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список страниц */}
      {pages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          <Icon name="FileText" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Страниц пока нет — создайте первую</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900 truncate">{page.title}</p>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${page.is_published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {page.is_published ? "Опубликована" : "Скрыта"}
                  </span>
                </div>
                <p className="text-xs text-gray-400">pfx.su/p/{page.slug}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a href={`/p/${page.slug}`} target="_blank"
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Открыть">
                  <Icon name="ExternalLink" size={15} />
                </a>
                <button onClick={() => togglePublish(page)}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors" title={page.is_published ? "Скрыть" : "Опубликовать"}>
                  <Icon name={page.is_published ? "EyeOff" : "Eye"} size={15} />
                </button>
                <button onClick={() => openPage(page)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ background: "#3ca615" }}>
                  <Icon name="Pencil" size={13} /> Редактировать
                </button>
                <button onClick={() => deletePage(page.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Удалить">
                  <Icon name="Trash2" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
