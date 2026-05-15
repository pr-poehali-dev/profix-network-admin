import { useState } from "react";
import Icon from "@/components/ui/icon";
import { ContentMap, parseJson, Field, ImageUpload } from "./editor-shared";

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
                </div>
                <Icon name={expanded===i ? "ChevronUp" : "ChevronDown"} size={14} className="text-gray-400" />
              </div>
              {expanded === i && (
                <div className="p-4 space-y-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Заголовок" value={slide.title}
                      onChange={v => { const n=[...slides]; n[i]={...n[i],title:v}; setSlides(n); }} />
                  </div>
                  <Field label="Описание" value={slide.desc} textarea
                    onChange={v => { const n=[...slides]; n[i]={...n[i],desc:v}; setSlides(n); }} />
                  <ImageUpload label="Изображение" value={slide.img}
                    onChange={url => { const n=[...slides]; n[i]={...n[i],img:url}; setSlides(n); }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
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
  type OnecItem = {icon:string;title:string;desc:string;img:string};
  const initial = parseJson<OnecItem[]>(content["onec.items"] || "", []);
  const [items, setItems] = useState<OnecItem[]>(initial);
  const [expanded, setExpanded] = useState<number | null>(null);

  function set(arr: OnecItem[]) {
    setItems(arr);
    onChange("onec.items", JSON.stringify(arr));
  }

  function updateItem(i: number, patch: Partial<OnecItem>) {
    setItems(prev => {
      const n = prev.map((it, idx) => idx === i ? {...it, ...patch} : it);
      onChange("onec.items", JSON.stringify(n));
      return n;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500">Услуги 1С ({items.length})</label>
          <button onClick={() => { const n=[...items,{icon:"Star",title:"Новая услуга",desc:"",img:""}]; set(n); setExpanded(n.length-1); }}
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
                      onChange={v => updateItem(i, {icon:v})} />
                    <Field label="Заголовок" value={item.title}
                      onChange={v => updateItem(i, {title:v})} />
                  </div>
                  <Field label="Описание" value={item.desc} textarea
                    onChange={v => updateItem(i, {desc:v})} />
                  <ImageUpload label="Изображение" value={item.img}
                    onChange={url => updateItem(i, {img:url})}
                    maxW={800} maxH={500} aspect="16/9" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
