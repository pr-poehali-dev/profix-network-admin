import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import AdminNotificationPanel from "@/components/admin/AdminNotificationPanel";
import { managerSession } from "@/lib/crm-api";
import { useNavigate } from "react-router-dom";

interface MenuItem {
  key: string;
  label: string;
  icon: string;
}

interface MenuGroup {
  title?: string;
  items: MenuItem[];
}

interface Props {
  manager: { id: number; name: string; role: string } | null;
  activeSection: string;
  onSectionChange: (s: string) => void;
  onLogout: () => void;
  onManagerUpdate?: (m: { id: number; name: string; role: string }) => void;
  newCommentCount?: number;
  newTicketCount?: number;
  newReviewCount?: number;
  newTgChatCount?: number;
}

const ROLE_LABEL: Record<string, string> = { admin: "Администратор", manager: "Менеджер" };
const ROLE_COLOR: Record<string, string> = { admin: "#e53e3e", manager: "#3ca615" };

export default function AdminSidebar({
  manager, activeSection, onSectionChange, onLogout,
  newCommentCount = 0, newTicketCount = 0, newReviewCount = 0, newTgChatCount = 0,
}: Props) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const groups: MenuGroup[] = [
    {
      items: [
        { key: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
        { key: "tickets",   label: "Заявки",  icon: "Ticket" },
        { key: "clients",   label: "Клиенты", icon: "Users" },
      ],
    },
    {
      title: "Сотрудники",
      items: [
        { key: "users",   label: "Пользователи", icon: "UserCog" },
        { key: "tg-chat", label: "Сотрудники",   icon: "MessageCircle" },
        { key: "tariffs", label: "Мотивация",     icon: "Trophy" },
      ],
    },
    {
      title: "Контент",
      items: [
        { key: "reviews", label: "Отзывы",               icon: "Star" },
        { key: "blog",    label: "Блог",                  icon: "Newspaper" },
        { key: "content", label: "Редактор сайта",        icon: "PenLine" },
        { key: "pages",   label: "Конструктор страниц",   icon: "LayoutTemplate" },
        { key: "theme",   label: "Тема сайта",            icon: "Palette" },
      ],
    },
    {
      title: "Продажи",
      items: [
        { key: "shop", label: "Магазин", icon: "ShoppingCart" },
      ],
    },
    ...(manager?.role === "admin" ? [{
      title: "Система",
      items: [
        { key: "managers", label: "Менеджеры",       icon: "UserCheck" },
        { key: "api",      label: "API партнёров",   icon: "Code2" },
      ],
    }] : []),
  ];

  // Все пункты для bottom-навигации на мобилке (только главные)
  const mobileBottomItems: MenuItem[] = [
    { key: "dashboard", label: "Главная",    icon: "LayoutDashboard" },
    { key: "tickets",   label: "Заявки",     icon: "Ticket" },
    { key: "clients",   label: "Клиенты",    icon: "Users" },
    { key: "tg-chat",   label: "Чат",        icon: "MessageCircle" },
    { key: "content",   label: "Сайт",       icon: "PenLine" },
  ];

  function badge(key: string) {
    if (key === "tickets") return newCommentCount + newTicketCount;
    if (key === "reviews") return newReviewCount;
    if (key === "tg-chat") return newTgChatCount;
    return 0;
  }

  function badgeColor(key: string) {
    if (key === "reviews") return "bg-yellow-500";
    if (key === "tg-chat") return "bg-blue-500";
    return "bg-red-500";
  }

  const initials = manager?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "??";
  const roleColor = ROLE_COLOR[manager?.role || ""] || "#3ca615";
  const w = collapsed ? "w-16" : "w-60";

  // ── Мобильная bottom-панель ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Верхняя мобильная шапка */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#111827] border-b border-white/10 flex items-center px-4 gap-3 z-40">
          <button onClick={() => onSectionChange("dashboard")} className="flex items-center gap-2">
            <img
              src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
              alt="ProFiX" className="w-7 h-7 object-contain" />
            <span className="text-white font-bold text-base">ProFiX</span>
          </button>
          <div className="flex-1" />
          {manager && managerSession.get() && (
            <AdminNotificationPanel
              token={managerSession.get()!}
              role="manager"
              userId={manager.id}
              userName={manager.name}
            />
          )}
          <button
            onClick={() => onSectionChange("dashboard")}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: roleColor }}>
            {initials}
          </button>
        </div>

        {/* Bottom навигация */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#111827] border-t border-white/10 z-40 pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {mobileBottomItems.map(item => {
              const isActive = activeSection === item.key;
              const b = badge(item.key);
              return (
                <button key={item.key} onClick={() => onSectionChange(item.key)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors relative ${isActive ? "text-white" : "text-gray-500"}`}
                  style={isActive ? { background: "#3ca615" } : {}}>
                  <span className="relative">
                    <Icon name={item.icon as "LayoutDashboard"} size={20} />
                    {b > 0 && (
                      <span className={`absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center ${badgeColor(item.key)}`}>
                        <span className="text-white text-[8px] font-bold">{b > 9 ? "9+" : b}</span>
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] font-medium leading-none">{item.label}</span>
                </button>
              );
            })}
            {/* Кнопка «Ещё» */}
            <button
              onClick={() => onSectionChange("users")}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${!mobileBottomItems.find(i => i.key === activeSection) ? "text-white" : "text-gray-500"}`}
              style={!mobileBottomItems.find(i => i.key === activeSection) ? { background: "#3ca615" } : {}}>
              <Icon name="Grid3x3" size={20} />
              <span className="text-[9px] font-medium leading-none">Ещё</span>
            </button>
          </div>
        </nav>

        {/* Spacer для контента */}
        <div className="h-14 flex-shrink-0" />
      </>
    );
  }

  // ── Десктопный сайдбар ───────────────────────────────────────────────────
  return (
    <aside className={`bg-[#111827] ${w} min-h-screen flex flex-col flex-shrink-0 transition-all duration-200 relative`}>
      {/* Шапка */}
      <div className="flex items-center gap-2.5 px-3 py-4 border-b border-white/10 min-h-[64px]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
          style={{ background: "#3ca615" }}
          title={collapsed ? "Развернуть" : "Свернуть"}>
          {collapsed
            ? <Icon name="PanelLeftOpen" size={17} className="text-white" />
            : <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
                alt="ProFiX" className="w-6 h-6 object-contain" />
          }
        </button>
        {!collapsed && (
          <button onClick={() => navigate("/")}
            className="text-white font-bold text-base tracking-tight whitespace-nowrap flex-1 text-left hover:text-green-400 transition-colors">
            ProFiX <span className="text-green-400 text-xs font-normal ml-1">Admin</span>
          </button>
        )}
        {manager && managerSession.get() && (
          <AdminNotificationPanel
            token={managerSession.get()!}
            role="manager"
            userId={manager.id}
            userName={manager.name}
          />
        )}
      </div>

      {/* Меню с группами */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.title && !collapsed && (
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2.5 mb-1.5">{group.title}</p>
            )}
            {group.title && collapsed && <div className="border-t border-white/5 mb-1" />}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = activeSection === item.key;
                const b = badge(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => onSectionChange(item.key)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all relative ${
                      isActive ? "text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                    style={isActive ? { background: "#3ca615" } : {}}>
                    <span className="relative flex-shrink-0">
                      <Icon name={item.icon as "LayoutDashboard"} size={17} />
                      {b > 0 && (
                        <span className={`absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] rounded-full flex items-center justify-center px-0.5 text-[8px] font-bold text-white ${badgeColor(item.key)}`}>
                          {b > 99 ? "99+" : b}
                        </span>
                      )}
                    </span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {b > 0 && (
                          <span className={`text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${badgeColor(item.key)}`}>
                            {b}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Нижняя часть */}
      <div className="px-2 pb-3 border-t border-white/10 pt-3 space-y-0.5">
        {/* На сайт */}
        <button onClick={() => navigate("/")} title="Перейти на сайт"
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Icon name="ExternalLink" size={17} className="shrink-0" />
          {!collapsed && <span>На сайт</span>}
        </button>

        {/* Профиль */}
        <button
          onClick={() => onSectionChange("dashboard")}
          title={collapsed ? (manager?.name || "Профиль") : undefined}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors group">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: roleColor }}>
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white text-xs font-semibold truncate">{manager?.name}</p>
              <p className="text-gray-500 text-[10px]">{ROLE_LABEL[manager?.role || ""] || manager?.role}</p>
            </div>
          )}
          {!collapsed && (
            <Icon name="ChevronRight" size={14} className="text-gray-600 group-hover:text-gray-400 shrink-0" />
          )}
        </button>

        {/* Выход */}
        <button onClick={onLogout} title={collapsed ? "Выйти" : undefined}
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-colors">
          <Icon name="LogOut" size={17} className="shrink-0" />
          {!collapsed && <span>Выйти</span>}
        </button>
      </div>
    </aside>
  );
}
