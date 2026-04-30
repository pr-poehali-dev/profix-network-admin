import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fetchContent } from "@/lib/content-api";

const PARTNER_LINKS = [
  { name: "DataMobile", path: "/datamobile" },
  { name: "POSCenter", path: "/poscenter" },
  { name: "АТОЛ", path: "/atol" },
  { name: "Дримкас", path: "/dreamkas" },
  { name: "СБИС", path: "/sbis" },
  { name: "ОФД Яндекс", path: "/ofd-yandex" },
  { name: "Платформа ОФД", path: "/platforma-ofd" },
  { name: "1С Франчайзи", path: "/1c" },
];

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

const DEFAULT_ITEMS: NavItem[] = [
  { id: "sec-main",     type: "section", label: "Главная",    section: "Главная",    visible: true, style: "text" },
  { id: "sec-services", type: "section", label: "Услуги",     section: "Услуги",     visible: true, style: "text" },
  { id: "sec-1c",       type: "section", label: "1С",         section: "1С",         visible: true, style: "text" },
  { id: "sec-about",    type: "section", label: "О компании", section: "О компании", visible: true, style: "text" },
  { id: "sec-contacts", type: "section", label: "Контакты",   section: "Контакты",   visible: true, style: "text" },
  { id: "shop",         type: "shop",    label: "Магазин",                           visible: true, style: "button" },
  { id: "cabinet",      type: "cabinet", label: "Кабинет",                           visible: true, style: "button" },
];

interface NavbarProps {
  scrolled: boolean;
  activeSection: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onScrollTo: (section: string) => void;
}

const Navbar = ({ scrolled, activeSection, menuOpen, onMenuToggle, onScrollTo }: NavbarProps) => {
  const [partnersOpen, setPartnersOpen] = useState(false);
  const [mobilePartnersOpen, setMobilePartnersOpen] = useState(false);
  const [items, setItems] = useState<NavItem[]>(DEFAULT_ITEMS);
  const [phone, setPhone] = useState("+7 (914) 272-71-87");
  const [phoneHref, setPhoneHref] = useState("tel:+79142727187");

  const navigate = useNavigate();
  const location = useLocation();
  const isOnMain = location.pathname === "/";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchContent().then(c => {
      setPhone(c["navbar.phone"] || "+7 (914) 272-71-87");
      setPhoneHref(c["navbar.phone_href"] || "tel:+79142727187");

      // Новый формат navbar.items
      if (c["navbar.items"]) {
        try {
          const parsed: NavItem[] = JSON.parse(c["navbar.items"]);
          if (parsed.length > 0) { setItems(parsed); return; }
        } catch { /* fallback */ }
      }

      // Старый формат — миграция
      const base = DEFAULT_ITEMS.map(b => ({
        ...b,
        visible: b.id === "shop"    ? c["navbar.show_shop"]    !== "false"
               : b.id === "cabinet" ? c["navbar.show_cabinet"] !== "false"
               : true,
      }));
      const extra = c["navbar.extra_links"] ? JSON.parse(c["navbar.extra_links"]) : [];
      const extraItems: NavItem[] = extra.map((e: {label:string;href:string;icon?:string}, i: number) => ({
        id: `link-${i}`, type: "link", label: e.label, href: e.href, icon: e.icon, visible: true, style: "button",
      }));
      setItems([...base, ...extraItems]);
    });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setPartnersOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPartnersOpen(true);
  };
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setPartnersOpen(false), 200);
  };

  const handleNavClick = (section: string) => {
    if (isOnMain) {
      onScrollTo(section);
    } else {
      navigate("/");
      setTimeout(() => {
        const id = section === "Главная" ? "hero"
          : section === "Услуги" ? "services"
          : section === "1С" ? "1c"
          : section === "О компании" ? "about"
          : "contacts";
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const menuItems  = items.filter(it => it.visible && it.style !== "button");
  const btnItems   = items.filter(it => it.visible && it.style === "button");

  function renderDesktopMenuItem(it: NavItem) {
    if (it.type === "section") {
      return (
        <button key={it.id} onClick={() => handleNavClick(it.section || it.label)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isOnMain && activeSection === (it.section || it.label)
              ? "bg-[#3ca615] text-white"
              : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
          }`}>
          {it.label}
        </button>
      );
    }
    if (it.type === "page") {
      return (
        <button key={it.id} onClick={() => navigate(`/p/${it.slug}`)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === `/p/${it.slug}` ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
          }`}>
          {it.label}
        </button>
      );
    }
    if (it.type === "link") {
      return (
        <a key={it.id} href={it.href}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615] transition-colors">
          {it.icon && <Icon name={it.icon as "Star"} size={14} fallback="Link" />}
          {it.label}
        </a>
      );
    }
    return null;
  }

  function renderDesktopBtnItem(it: NavItem) {
    if (it.type === "shop") return (
      <button key={it.id} onClick={() => navigate("/shop")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#374151] border border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
        <Icon name={it.icon as "Star" || "ShoppingCart"} size={15} fallback="ShoppingCart" />
        {it.label}
      </button>
    );
    if (it.type === "cabinet") return (
      <button key={it.id} onClick={() => navigate("/cabinet")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#374151] border border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
        <Icon name={it.icon as "Star" || "User"} size={15} fallback="User" />
        {it.label}
      </button>
    );
    if (it.type === "link") return (
      <a key={it.id} href={it.href}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#374151] border border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
        {it.icon && <Icon name={it.icon as "Star"} size={15} fallback="Link" />}
        {it.label}
      </a>
    );
    return null;
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Логотип */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0">
          <img
            src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
            alt="ProFiX логотип" className="h-9 w-9 object-contain"
          />
          <span className="font-oswald text-xl font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
          </span>
        </button>

        {/* Десктоп — меню */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {menuItems.map(it => renderDesktopMenuItem(it))}

          {/* Партнёры — всегда */}
          <div ref={dropdownRef} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button onClick={() => setPartnersOpen(v => !v)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                partnersOpen ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
              }`}>
              Партнёры
              <Icon name="ChevronDown" size={14} className={`transition-transform ${partnersOpen ? "rotate-180" : ""}`} />
            </button>
            {partnersOpen && (
              <div className="absolute top-full left-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50"
                style={{ marginTop: "4px", minWidth: "200px" }}
                onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <div className="absolute -top-2 left-0 right-0 h-2" />
                <div className="py-1.5">
                  {PARTNER_LINKS.map(p => (
                    <button key={p.path} onClick={() => { navigate(p.path); setPartnersOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615] transition-colors">
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Десктоп — кнопки справа */}
        <div className="hidden md:flex items-center gap-2">
          {btnItems.map(it => renderDesktopBtnItem(it))}
          <a href={phoneHref}
            className="flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors">
            <Icon name="Phone" size={15} />
            {phone}
          </a>
        </div>

        {/* Мобильный бургер */}
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={onMenuToggle}>
          <Icon name={menuOpen ? "X" : "Menu"} size={22} />
        </button>
      </div>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {menuItems.map(it => {
            if (it.type === "section") return (
              <button key={it.id} onClick={() => { handleNavClick(it.section || it.label); onMenuToggle(); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isOnMain && activeSection === (it.section || it.label) ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8]"
                }`}>
                {it.label}
              </button>
            );
            if (it.type === "link") return (
              <a key={it.id} href={it.href} onClick={onMenuToggle}
                className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#edf7e8] transition-colors">
                {it.icon && <Icon name={it.icon as "Star"} size={15} fallback="Link" />}
                {it.label}
              </a>
            );
            if (it.type === "page") return (
              <button key={it.id} onClick={() => { navigate(`/p/${it.slug}`); onMenuToggle(); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === `/p/${it.slug}` ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8]"
                }`}>
                {it.label}
              </button>
            );
            return null;
          })}

          {/* Партнёры */}
          <button onClick={() => setMobilePartnersOpen(!mobilePartnersOpen)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#edf7e8] flex items-center justify-between">
            <span>Партнёры</span>
            <Icon name="ChevronDown" size={16} className={`transition-transform ${mobilePartnersOpen ? "rotate-180" : ""}`} />
          </button>
          {mobilePartnersOpen && (
            <div className="pl-4 flex flex-col gap-1">
              {PARTNER_LINKS.map(p => (
                <button key={p.path} onClick={() => { navigate(p.path); onMenuToggle(); }}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615] transition-colors">
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Кнопки */}
          {btnItems.map(it => {
            if (it.type === "shop") return (
              <button key={it.id} onClick={() => { navigate("/shop"); onMenuToggle(); }}
                className="flex items-center gap-2 border border-gray-200 text-[#374151] px-4 py-3 rounded-lg text-sm font-medium justify-center hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
                <Icon name={it.icon as "Star" || "ShoppingCart"} size={15} fallback="ShoppingCart" />
                {it.label}
              </button>
            );
            if (it.type === "cabinet") return (
              <button key={it.id} onClick={() => { navigate("/cabinet"); onMenuToggle(); }}
                className="flex items-center gap-2 border border-gray-200 text-[#374151] px-4 py-3 rounded-lg text-sm font-medium justify-center hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
                <Icon name={it.icon as "Star" || "User"} size={15} fallback="User" />
                {it.label}
              </button>
            );
            if (it.type === "link") return (
              <a key={it.id} href={it.href} onClick={onMenuToggle}
                className="flex items-center gap-2 border border-gray-200 text-[#374151] px-4 py-3 rounded-lg text-sm font-medium justify-center hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
                {it.icon && <Icon name={it.icon as "Star"} size={15} fallback="Link" />}
                {it.label}
              </a>
            );
            return null;
          })}

          <a href={phoneHref} className="mt-1 flex items-center gap-2 bg-[#3ca615] text-white px-4 py-3 rounded-lg text-sm font-medium justify-center">
            <Icon name="Phone" size={15} />
            {phone}
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
