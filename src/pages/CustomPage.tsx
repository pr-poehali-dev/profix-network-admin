import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Icon from "@/components/ui/icon";
import { pagesApi, CustomPage, PageBlock } from "@/lib/pages-api";
import CartDrawer from "@/components/CartDrawer";
import SharedFooter from "@/components/SharedFooter";

// ── Рендереры блоков ──────────────────────────────────────────────────────────

function BlockHero({ b, accent }: { b: Extract<PageBlock, {type:"hero"}>; accent: string }) {
  const navigate = useNavigate();
  const bg = b.bg_color || accent;
  const textColor = b.text_color || "white";

  return (
    <section className="relative overflow-hidden py-20 px-4"
      style={{ background: bg }}>
      {b.image_url && (
        <div className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${b.image_url})` }} />
      )}
      <div className="relative max-w-4xl mx-auto text-center" style={{ color: textColor }}>
        {b.badge && (
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Icon name="BadgeCheck" size={14} />
            {b.badge}
          </div>
        )}
        <h1 className="font-oswald text-4xl sm:text-6xl font-bold leading-tight mb-5 whitespace-pre-line">
          {b.title}
        </h1>
        {b.subtitle && (
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto leading-relaxed">{b.subtitle}</p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          {b.btn1_text && (
            <a href={b.btn1_link || "#"}
              className="bg-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
              style={{ color: bg }}>
              {b.btn1_text}
            </a>
          )}
          {b.btn2_text && (
            <a href={b.btn2_link || "#"}
              className="border-2 border-white/40 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              {b.btn2_text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function BlockText({ b }: { b: Extract<PageBlock, {type:"text"}> }) {
  return (
    <section className="py-12 px-4">
      <div className={`max-w-4xl mx-auto ${b.align === "center" ? "text-center" : ""}`}>
        {b.title && <h2 className="font-oswald text-3xl font-bold text-gray-900 mb-5">{b.title}</h2>}
        <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{b.body}</p>
      </div>
    </section>
  );
}

function BlockCards({ b, accent }: { b: Extract<PageBlock, {type:"cards"}>; accent: string }) {
  const cols = b.cols || 3;
  const gridClass = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-12 px-4 bg-[#F7F9FC]">
      <div className="max-w-6xl mx-auto">
        {(b.title || b.subtitle) && (
          <div className="text-center mb-10">
            {b.title && <h2 className="font-oswald text-3xl font-bold text-gray-900 mb-2">{b.title}</h2>}
            {b.subtitle && <p className="text-gray-500">{b.subtitle}</p>}
          </div>
        )}
        <div className={`grid grid-cols-1 ${gridClass} gap-6`}>
          {b.items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover rounded-xl mb-4" />
              ) : item.icon ? (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `${accent}20` }}>
                  <Icon name={item.icon as "Star"} size={22} style={{ color: accent }} fallback="Star" />
                </div>
              ) : null}
              {item.badge && (
                <span className="self-start text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2"
                  style={{ background: accent }}>{item.badge}</span>
              )}
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              {item.price && <p className="font-semibold text-sm mb-2" style={{ color: accent }}>{item.price}</p>}
              {item.text && <p className="text-gray-500 text-sm leading-relaxed flex-1">{item.text}</p>}
              {item.link && (
                <a href={item.link} className="mt-4 flex items-center gap-1 text-sm font-medium hover:underline"
                  style={{ color: accent }}>
                  Подробнее <Icon name="ArrowRight" size={14} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlockImage({ b }: { b: Extract<PageBlock, {type:"image"}> }) {
  const maxW = b.size === "medium" ? "max-w-2xl" : b.size === "wide" ? "max-w-5xl" : "max-w-full";
  return (
    <section className="py-8 px-4">
      <div className={`${maxW} mx-auto`}>
        <img src={b.url} alt={b.alt || ""} className="w-full rounded-2xl shadow-md object-cover" />
        {b.caption && <p className="text-center text-sm text-gray-400 mt-3">{b.caption}</p>}
      </div>
    </section>
  );
}

function BlockTwoCols({ b, accent }: { b: Extract<PageBlock, {type:"two_cols"}>; accent: string }) {
  const isLeft = b.image_position !== "left";
  return (
    <section className="py-14 px-4 bg-white">
      <div className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center ${!isLeft ? "direction-rtl" : ""}`}>
        <div className={!isLeft ? "order-2" : ""}>
          {b.title && <h2 className="font-oswald text-3xl font-bold text-gray-900 mb-5">{b.title}</h2>}
          <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line">{b.text}</p>
          {b.features && b.features.length > 0 && (
            <ul className="space-y-2">
              {b.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                  <Icon name="CheckCircle" size={16} style={{ color: accent }} />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
        {b.image_url && (
          <div className={!isLeft ? "order-1" : ""}>
            <img src={b.image_url} alt="" className="w-full rounded-2xl shadow-lg object-cover" />
          </div>
        )}
      </div>
    </section>
  );
}

function BlockStats({ b, accent }: { b: Extract<PageBlock, {type:"stats"}>; accent: string }) {
  const color = b.accent_color || accent;
  return (
    <section className="py-10 px-4" style={{ background: color }}>
      <div className="max-w-5xl mx-auto">
        {b.title && <h2 className="text-white text-center font-oswald text-2xl font-bold mb-8">{b.title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {b.items.map((s, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl font-oswald font-bold text-white mb-1">{s.value}</p>
              <p className="text-white/70 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlockCta({ b }: { b: Extract<PageBlock, {type:"cta"}> }) {
  return (
    <section className="py-14 px-4" style={{ background: b.bg_color || "#0D1B2A" }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-oswald text-3xl font-bold text-white mb-3">{b.title}</h2>
        {b.text && <p className="text-white/70 mb-8 text-base">{b.text}</p>}
        <a href={b.btn_link}
          className="inline-flex items-center gap-2 bg-[#3ca615] text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-[#2d8a10] transition-colors">
          {b.btn_text}
        </a>
      </div>
    </section>
  );
}

function BlockContacts({ b }: { b: Extract<PageBlock, {type:"contacts"}> }) {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        {b.title && <h2 className="font-oswald text-3xl font-bold text-gray-900 mb-8 text-center">{b.title}</h2>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "Phone", label: "Телефон", value: "+7 (914) 272-71-87", href: "tel:+79142727187" },
            { icon: "Mail", label: "Email", value: "727187@it-profix.ru", href: "mailto:727187@it-profix.ru" },
            { icon: "MapPin", label: "Адрес", value: "г. Якутск, ул. Халтурина, 6", href: null },
          ].map(c => (
            <div key={c.label} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
              <Icon name={c.icon as "Phone"} size={20} className="text-[#3ca615] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
                {c.href
                  ? <a href={c.href} className="text-gray-900 font-medium text-sm hover:text-[#3ca615] transition-colors">{c.value}</a>
                  : <p className="text-gray-900 font-medium text-sm">{c.value}</p>
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RenderBlock({ block, accent }: { block: PageBlock; accent: string }) {
  switch (block.type) {
    case "hero":     return <BlockHero b={block} accent={accent} />;
    case "text":     return <BlockText b={block} />;
    case "cards":    return <BlockCards b={block} accent={accent} />;
    case "image":    return <BlockImage b={block} />;
    case "two_cols": return <BlockTwoCols b={block} accent={accent} />;
    case "stats":    return <BlockStats b={block} accent={accent} />;
    case "cta":      return <BlockCta b={block} />;
    case "contacts": return <BlockContacts b={block} />;
    default:         return null;
  }
}

// ── Страница ──────────────────────────────────────────────────────────────────

export default function CustomPageView() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    pagesApi.get(slug).then(r => {
      if (r.page) setPage(r.page);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
    </div>
  );

  if (!page) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] gap-4">
      <Icon name="FileX" size={48} className="text-gray-300" />
      <p className="text-gray-500">Страница не найдена</p>
      <button onClick={() => navigate("/")} className="text-sm underline" style={{ color: "#3ca615" }}>На главную</button>
    </div>
  );

  const accent = page.accent_color || "#3ca615";

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      <Helmet>
        <title>{page.title} — ProFiX</title>
        {page.meta_desc && <meta name="description" content={page.meta_desc} />}
      </Helmet>

      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
              alt="ProFiX" className="h-8 w-8 object-contain" />
            <span className="font-oswald text-lg font-bold hidden sm:block">
              <span style={{ color: "#3ca615" }}>ПРО</span><span className="text-black">ФИКС</span>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => setCartOpen(true)} className="relative p-2 text-gray-500 hover:text-gray-800 transition-colors">
              <Icon name="ShoppingCart" size={20} />
            </button>
            <a href="tel:+79142727187"
              className="hidden sm:flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ background: accent }}>
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Блоки страницы */}
      {page.blocks.map((block, i) => (
        <RenderBlock key={i} block={block} accent={accent} />
      ))}

      {page.blocks.length === 0 && (
        <div className="py-32 text-center text-gray-400">
          <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
          <p>Страница пуста</p>
        </div>
      )}

      <SharedFooter />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
