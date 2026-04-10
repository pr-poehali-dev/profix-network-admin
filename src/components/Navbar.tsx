import Icon from "@/components/ui/icon";

const navLinks = ["Главная", "Услуги", "1С", "О компании", "Контакты"];

interface NavbarProps {
  scrolled: boolean;
  activeSection: string;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onScrollTo: (section: string) => void;
}

const Navbar = ({ scrolled, activeSection, menuOpen, onMenuToggle, onScrollTo }: NavbarProps) => {
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
          <img
            src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
            alt="ProFiX логотип"
            className="h-9 w-9 object-contain"
          />
          <span className="font-oswald text-xl font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => onScrollTo(link)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === link
                  ? "bg-[#3ca615] text-white"
                  : "text-[#374151] hover:bg-[#edf7e8] hover:text-[#3ca615]"
              }`}
            >
              {link}
            </button>
          ))}
        </nav>

        <a
          href="tel:+79142727187"
          className="hidden md:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors"
        >
          <Icon name="Phone" size={15} />
          +7 (914) 272-71-87
        </a>

        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={onMenuToggle}>
          <Icon name={menuOpen ? "X" : "Menu"} size={22} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1 animate-fade-in">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => onScrollTo(link)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeSection === link ? "bg-[#3ca615] text-white" : "text-[#374151] hover:bg-[#edf7e8]"
              }`}
            >
              {link}
            </button>
          ))}
          <a href="tel:+79142727187" className="mt-2 flex items-center gap-2 bg-[#3ca615] text-white px-4 py-3 rounded-lg text-sm font-medium justify-center">
            <Icon name="Phone" size={15} />
            +7 (914) 272-71-87
          </a>
        </div>
      )}
    </header>
  );
};

export default Navbar;