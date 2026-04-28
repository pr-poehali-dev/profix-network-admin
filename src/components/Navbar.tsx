import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";

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

const NAV_SECTIONS = ["Главная", "Услуги", "1С", "О компании", "Контакты"];

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
  const navigate = useNavigate();
  const location = useLocation();
  const isOnMain = location.pathname === "/";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Закрываем при клике вне меню
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
        const id =
          section === "Главная" ? "hero"
          : section === "Услуги" ? "services"
          : section === "1С" ? "1c"
          : section === "О компании" ? "about"
          : "contacts";
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img
            src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
            alt="ProFiX логотип"
            className="h-9 w-9 object-contain"
          />
          <span className="font-oswald text-xl font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_SECTIONS.map((link) => (
            <button
              key={link}
              onClick={() => handleNavClick(link)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isOnMain && activeSection === link
                  ? "bg-[#3ca615] text-white"
                  : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
              }`}
            >
              {link}
            </button>
          ))}

          {/* Выпадающее меню партнёров — устойчивое к курсору */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              onClick={() => setPartnersOpen((v) => !v)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                partnersOpen
                  ? "bg-[#3ca615] text-white"
                  : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
              }`}
            >
              Партнёры
              <Icon name="ChevronDown" size={14} className={`transition-transform ${partnersOpen ? "rotate-180" : ""}`} />
            </button>

            {partnersOpen && (
              <div
                className="absolute top-full left-0 bg-white rounded-xl shadow-xl border border-gray-100 z-50"
                style={{ marginTop: "4px", minWidth: "200px" }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Невидимый мост между кнопкой и меню */}
                <div className="absolute -top-2 left-0 right-0 h-2" />
                <div className="py-1.5">
                  {PARTNER_LINKS.map((p) => (
                    <button
                      key={p.path}
                      onClick={() => { navigate(p.path); setPartnersOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615] transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => navigate("/cabinet")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[#374151] border border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors"
          >
            <Icon name="User" size={15} />
            Кабинет
          </button>
          <a
            href="tel:+79142727187"
            className="flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors"
          >
            <Icon name="Phone" size={15} />
            +7 (914) 272-71-87
          </a>
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={onMenuToggle}>
          <Icon name={menuOpen ? "X" : "Menu"} size={22} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {NAV_SECTIONS.map((link) => (
            <button
              key={link}
              onClick={() => { handleNavClick(link); onMenuToggle(); }}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isOnMain && activeSection === link ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8]"
              }`}
            >
              {link}
            </button>
          ))}

          <button
            onClick={() => setMobilePartnersOpen(!mobilePartnersOpen)}
            className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-[#374151] hover:bg-[#edf7e8] flex items-center justify-between"
          >
            <span>Партнёры</span>
            <Icon name="ChevronDown" size={16} className={`transition-transform ${mobilePartnersOpen ? "rotate-180" : ""}`} />
          </button>
          {mobilePartnersOpen && (
            <div className="pl-4 flex flex-col gap-1">
              {PARTNER_LINKS.map((p) => (
                <button
                  key={p.path}
                  onClick={() => { navigate(p.path); onMenuToggle(); }}
                  className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615] transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { navigate("/cabinet"); onMenuToggle(); }}
            className="flex items-center gap-2 border border-gray-200 text-[#374151] px-4 py-3 rounded-lg text-sm font-medium justify-center hover:border-[#3ca615] hover:text-[#3ca615] transition-colors"
          >
            <Icon name="User" size={15} />
            Личный кабинет
          </button>
          <a href="tel:+79142727187" className="mt-1 flex items-center gap-2 bg-[#3ca615] text-white px-4 py-3 rounded-lg text-sm font-medium justify-center">
            <Icon name="Phone" size={15} />
            +7 (914) 272-71-87
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;
