import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { fetchContent } from "@/lib/content-api";
import { clientSession, clientApi, managerSession, managerApi } from "@/lib/crm-api";
import { cart } from "@/lib/shop-api";
import CartDrawer from "@/components/CartDrawer";

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
  { id: "sec-main",     type: "section", label: "Главная",  section: "Главная",    visible: true,  style: "text" },
  { id: "link-news",    type: "link",    label: "Новости",  href: "/blog?type=news", visible: true, style: "text" },
  { id: "link-blog",    type: "link",    label: "Блог",     href: "/blog",          visible: true,  style: "text" },
  { id: "sec-services", type: "section", label: "Услуги",   section: "Услуги",     visible: true,  style: "text" },
  { id: "sec-about",    type: "section", label: "О нас",    section: "О компании", visible: true,  style: "text" },
  { id: "sec-contacts", type: "section", label: "Контакты", section: "Контакты",   visible: true,  style: "text" },
  { id: "sec-1c",       type: "section", label: "1С",       section: "1С",         visible: false, style: "text" },
  { id: "shop",         type: "shop",    label: "Магазин",                         visible: true,  style: "button" },
  { id: "cabinet",      type: "cabinet", label: "Войти",                           visible: true,  style: "button" },
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
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientFixies, setClientFixies] = useState<number | null>(null);
  const [clientAvatar, setClientAvatar] = useState<string | null>(null);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [managerAvatar, setManagerAvatar] = useState<string | null>(null);
  const [managerRole, setManagerRole] = useState<string | null>(null);
  const [phoneHref, setPhoneHref] = useState("tel:+79142727187");
  const [cartCount, setCartCount] = useState(cart.count());
  const [cartOpen, setCartOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isOnMain = location.pathname === "/";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const update = () => setCartCount(cart.count());
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);

  // Проверяем авторизацию менеджера/админа
  useEffect(() => {
    const mgrToken = managerSession.get();
    if (!mgrToken) return;
    managerApi.getManagerProfile().then(r => {
      if (r.profile) {
        setManagerName(r.profile.name);
        setManagerAvatar(r.profile.avatar_url || null);
        setManagerRole(r.profile.role);
      } else {
        managerSession.clear();
      }
    }).catch(() => {});
  }, []);

  // Проверяем авторизацию клиента
  useEffect(() => {
    const token = clientSession.get();
    if (!token) return;
    clientApi.verifyToken(token).then(r => {
      if (r.valid && r.client) {
        // Показываем имя или ник, но не телефон
        setClientName(r.client.name && !r.client.name.startsWith("+") ? r.client.name : "Кабинет");
        setClientAvatar(r.client.avatar_url || null);
      } else {
        clientSession.clear();
      }
    }).catch(() => {});
  }, []);

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
          className={`px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
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
          className={`px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
            location.pathname === `/p/${it.slug}` ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
          }`}>
          {it.label}
        </button>
      );
    }
    if (it.type === "link") {
      return (
        <a key={it.id} href={it.href}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-medium text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615] transition-colors whitespace-nowrap">
          {it.icon && <Icon name={it.icon as "Star"} size={13} fallback="Link" />}
          {it.label}
        </a>
      );
    }
    return null;
  }

  function renderDesktopBtnItem(it: NavItem) {
    if (it.type === "shop") return (
      <button key={it.id} onClick={() => navigate("/shop")}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#374151] border border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors whitespace-nowrap">
        <Icon name={it.icon as "Star" || "ShoppingCart"} size={14} fallback="ShoppingCart" />
        {it.label}
      </button>
    );
    if (it.type === "cabinet") {
      // Менеджер/админ — показываем с роль-бейджем
      if (managerName) {
        const roleLabel = managerRole === "admin" ? "Админ" : "Менеджер";
        const roleColor = managerRole === "admin" ? "#e53e3e" : "#3ca615";
        return (
          <button key={it.id} onClick={() => navigate("/admin")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border transition-colors bg-[#edf7e8]"
            style={{ borderColor: `${roleColor}40` }}>
            {managerAvatar
              ? <img src={managerAvatar} alt="" className="w-6 h-6 rounded-full object-cover border border-white" />
              : <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: roleColor }}>
                  {managerName.charAt(0).toUpperCase()}
                </div>
            }
            <span className="font-semibold max-w-[80px] truncate" style={{ color: roleColor }}>{managerName.split(" ")[0]}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ background: roleColor }}>{roleLabel}</span>
          </button>
        );
      }
      // Клиент
      if (clientName) {
        return (
          <button key={it.id} onClick={() => navigate("/cabinet")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium border border-[#3ca615]/30 hover:border-[#3ca615] transition-colors bg-[#edf7e8]">
            {clientAvatar
              ? <img src={clientAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
              : <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "#3ca615" }}>
                  {clientName.charAt(0).toUpperCase()}
                </div>
            }
            <span className="text-[#3ca615] font-semibold max-w-[90px] truncate">{clientName.split(" ")[0]}</span>
            {clientFixies !== null && (
              <span className="flex items-center gap-0.5 text-[11px] font-bold text-[#3ca615] bg-white px-1.5 py-0.5 rounded-full border border-[#3ca615]/20">
                💰{clientFixies}
              </span>
            )}
          </button>
        );
      }
      return (
        <button key={it.id} onClick={() => navigate("/login")}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#374151] border border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
          <Icon name={it.icon as "Star" || "User"} size={15} fallback="User" />
          {it.label}
        </button>
      );
    }
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
    <>
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur"}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-5 flex items-center justify-between h-16 gap-3">
        {/* Логотип */}
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 shrink-0 mr-6">
          <img
            src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
            alt="ProFiX логотип" className="h-8 w-8 object-contain"
          />
          <span className="font-oswald text-lg font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
          </span>
        </button>

        {/* Десктоп — меню */}
        <nav className="hidden md:flex items-center gap-0 justify-center flex-1 min-w-0">
          {menuItems.map(it => renderDesktopMenuItem(it))}

          {/* Партнёры */}
          <div ref={dropdownRef} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button onClick={() => setPartnersOpen(v => !v)}
              className={`flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                partnersOpen ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
              }`}>
              Партнёры
              <Icon name="ChevronDown" size={13} className={`transition-transform ${partnersOpen ? "rotate-180" : ""}`} />
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
        <div className="hidden md:flex items-center gap-1.5 shrink-0">
          {btnItems.map(it => renderDesktopBtnItem(it))}
          {/* Корзина */}
          <button onClick={() => setCartOpen(true)} className="relative flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615] text-[#374151] transition-colors">
            <Icon name="ShoppingCart" size={15} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
          <a href={phoneHref} title={phone}
            className="flex items-center gap-1 bg-[#3ca615] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#2d8a10] transition-colors shrink-0">
            <Icon name="Phone" size={13} />
            <span className="text-[12px] font-semibold tracking-wide whitespace-nowrap">{phone}</span>
          </a>
        </div>

        {/* Мобильный: корзина + бургер */}
        <div className="md:hidden flex items-center gap-1">
          <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-lg hover:bg-gray-100">
            <Icon name="ShoppingCart" size={20} className="text-[#374151]" />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
          <button className="p-2 rounded-lg hover:bg-gray-100" onClick={onMenuToggle}>
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>
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
            if (it.type === "cabinet") {
              if (managerName) {
                const rc = managerRole === "admin" ? "#e53e3e" : "#3ca615";
                return (
                  <button key={it.id} onClick={() => { navigate("/admin"); onMenuToggle(); }}
                    className="flex items-center gap-2 bg-[#edf7e8] px-4 py-3 rounded-lg text-sm font-medium justify-center border"
                    style={{ borderColor: `${rc}40` }}>
                    {managerAvatar
                      ? <img src={managerAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                      : <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: rc }}>
                          {managerName.charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="font-semibold" style={{ color: rc }}>{managerName.split(" ")[0]}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: rc }}>{managerRole === "admin" ? "Админ" : "Менеджер"}</span>
                  </button>
                );
              }
              if (clientName) return (
                <button key={it.id} onClick={() => { navigate("/cabinet"); onMenuToggle(); }}
                  className="flex items-center gap-2 border border-[#3ca615]/30 bg-[#edf7e8] px-4 py-3 rounded-lg text-sm font-medium justify-center">
                  {clientAvatar
                    ? <img src={clientAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                    : <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ background: "#3ca615" }}>
                        {clientName.charAt(0).toUpperCase()}
                      </div>
                  }
                  <span className="text-[#3ca615] font-semibold">{clientName.split(" ")[0]}</span>
                  {clientFixies !== null && <span className="text-[11px] font-bold text-[#3ca615]">💰{clientFixies}</span>}
                </button>
              );
              return (
                <button key={it.id} onClick={() => { navigate("/login"); onMenuToggle(); }}
                  className="flex items-center gap-2 border border-gray-200 text-[#374151] px-4 py-3 rounded-lg text-sm font-medium justify-center hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
                  <Icon name={it.icon as "Star" || "User"} size={15} fallback="User" />
                  {it.label}
                </button>
              );
            }
            if (it.type === "link") return (
              <a key={it.id} href={it.href} onClick={onMenuToggle}
                className="flex items-center gap-2 border border-gray-200 text-[#374151] px-4 py-3 rounded-lg text-sm font-medium justify-center hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
                {it.icon && <Icon name={it.icon as "Star"} size={15} fallback="Link" />}
                {it.label}
              </a>
            );
            return null;
          })}

          {(clientName || managerName)
            ? <a href={phoneHref} title={phone} className="mt-1 flex items-center gap-2 bg-[#3ca615] text-white px-4 py-3 rounded-lg text-sm font-medium justify-center">
                <Icon name="Phone" size={15} />
                Позвонить
              </a>
            : <a href={phoneHref} className="mt-1 flex items-center gap-2 bg-[#3ca615] text-white px-4 py-3 rounded-lg text-sm font-medium justify-center">
                <Icon name="Phone" size={15} />
                {phone}
              </a>
          }
        </div>
      )}
    </header>

    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Navbar;