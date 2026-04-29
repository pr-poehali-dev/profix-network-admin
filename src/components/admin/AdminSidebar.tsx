import { useState, useEffect } from "react";
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
  newCommentCount?: number;
}

export default function AdminSidebar({ manager, activeSection, onSectionChange, onLogout, newCommentCount = 0 }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  // На мобиле сворачиваем по умолчанию
  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const menuItems: MenuItem[] = [
    { key: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
    { key: "tickets", label: "Заявки", icon: "Ticket" },
    { key: "clients", label: "Клиенты", icon: "Users" },
    { key: "technicians", label: "Тех специалисты", icon: "Wrench" },
    { key: "reviews", label: "Отзывы", icon: "Star" },
    ...(manager?.role === "admin" ? [{ key: "managers", label: "Менеджеры", icon: "UserCheck" }] : []),
  ];

  const w = collapsed ? "w-14" : "w-64";

  return (
    <aside className={`bg-[#111827] ${w} min-h-screen flex flex-col flex-shrink-0 transition-all duration-200`}>
      {/* Логотип + кнопка свернуть */}
      <div className="flex items-center gap-3 px-3 py-5 border-b border-white/10 min-h-[64px]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
          style={{ background: "#3ca615" }}
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {collapsed
            ? <Icon name="PanelLeftOpen" size={18} className="text-white" />
            : <span className="text-white font-bold text-base">P</span>
          }
        </button>
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight whitespace-nowrap">ProFiX</span>
        )}
      </div>

      {/* Пункты меню */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeSection === item.key;
          const hasAlert = item.key === "tickets" && newCommentCount > 0;
          return (
            <button
              key={item.key}
              onClick={() => onSectionChange(item.key)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              style={isActive ? { background: "#3ca615" } : {}}
            >
              <span className="relative flex-shrink-0">
                <Icon name={item.icon as "LayoutDashboard"} size={18} />
                {hasAlert && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold">
                      {newCommentCount > 9 ? "9+" : newCommentCount}
                    </span>
                  </span>
                )}
              </span>
              {!collapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && hasAlert && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {newCommentCount > 9 ? "9+" : newCommentCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Нижняя часть */}
      <div className="px-2 py-4 border-t border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={16} className="text-gray-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{manager?.name}</p>
              <p className="text-gray-400 text-xs capitalize">{manager?.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          title={collapsed ? "Выйти" : undefined}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
        >
          <Icon name="LogOut" size={16} className="flex-shrink-0" />
          {!collapsed && "Выйти"}
        </button>
      </div>
    </aside>
  );
}
