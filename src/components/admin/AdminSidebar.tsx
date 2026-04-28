import Icon from "@/components/ui/icon";

interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

interface Props {
  manager: { id: number; name: string; role: string } | null;
  activeSection: string;
  onSectionChange: (s: string) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ manager, activeSection, onSectionChange, onLogout }: Props) {
  const menuItems: MenuItem[] = [
    { key: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
    { key: "tickets", label: "Заявки", icon: "Ticket" },
    { key: "clients", label: "Клиенты", icon: "Users" },
    { key: "technicians", label: "Тех специалисты", icon: "Wrench" },
    ...(manager?.role === "admin" ? [{ key: "managers", label: "Менеджеры", icon: "UserCheck" }] : []),
  ];

  return (
    <aside className="bg-[#111827] w-64 min-h-screen flex flex-col flex-shrink-0">
      {/* Логотип */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "#3ca615" }}
        >
          <span className="text-white font-bold text-base">P</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">ProFiX</span>
      </div>

      {/* Пункты меню */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={isActive ? { background: "#3ca615" } : {}}
            >
              <Icon name={item.icon as "LayoutDashboard"} size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Нижняя часть */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <Icon name="User" size={16} className="text-gray-300" />
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{manager?.name}</p>
            <p className="text-gray-400 text-xs capitalize">{manager?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
        >
          <Icon name="LogOut" size={16} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
