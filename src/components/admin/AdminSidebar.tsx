import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import AdminNotificationPanel from "@/components/admin/AdminNotificationPanel";
import { managerSession, managerApi } from "@/lib/crm-api";
import { useNavigate } from "react-router-dom";

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
  onManagerUpdate?: (m: { id: number; name: string; role: string }) => void;
  newCommentCount?: number;
  newTicketCount?: number;
  newReviewCount?: number;
  newTgChatCount?: number;
}

export default function AdminSidebar({ manager, activeSection, onSectionChange, onLogout, onManagerUpdate, newCommentCount = 0, newTicketCount = 0, newReviewCount = 0, newTgChatCount = 0 }: Props) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Профиль-попап
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(manager?.name || "");
  const [profileLogin, setProfileLogin] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileCurPw, setProfileCurPw] = useState("");
  const [profileNewPw, setProfileNewPw] = useState("");
  const [profileNewPw2, setProfileNewPw2] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profileOpen) {
      setProfileName(manager?.name || "");
      setProfileLogin(""); setProfileEmail("");
      setProfileCurPw(""); setProfileNewPw(""); setProfileNewPw2("");
      setProfileError(""); setProfileSuccess(false);
    }
  }, [profileOpen, manager?.name]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  async function handleProfileSave() {
    if (profileNewPw && profileNewPw !== profileNewPw2) {
      setProfileError("Пароли не совпадают"); return;
    }
    if (profileNewPw && !profileCurPw) {
      setProfileError("Укажите текущий пароль"); return;
    }
    setProfileLoading(true); setProfileError("");
    try {
      const data: Record<string, string> = {};
      if (profileName.trim() && profileName.trim() !== manager?.name) data.name = profileName.trim();
      if (profileLogin.trim()) data.login = profileLogin.trim();
      if (profileEmail.trim()) data.email = profileEmail.trim();
      if (profilePhone.trim()) data.phone = profilePhone.trim();
      if (profileAddress.trim()) data.address = profileAddress.trim();
      if (profileNewPw.trim()) { data.password = profileNewPw.trim(); data.current_password = profileCurPw.trim(); }
      if (!Object.keys(data).length) { setProfileError("Нечего сохранять"); setProfileLoading(false); return; }
      const res = await managerApi.updateProfile(data);
      if (res.updated) {
        setProfileSuccess(true);
        if (res.manager && onManagerUpdate) onManagerUpdate(res.manager);
        setTimeout(() => { setProfileOpen(false); setProfileSuccess(false); }, 1500);
      } else {
        setProfileError(res.error || "Ошибка сохранения");
      }
    } catch { setProfileError("Ошибка соединения"); }
    finally { setProfileLoading(false); }
  }

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

  const menuItems: MenuItem[] = [
    { key: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
    { key: "tickets", label: "Заявки", icon: "Ticket" },
    { key: "clients", label: "Клиенты", icon: "Users" },
    { key: "technicians", label: "Тех специалисты", icon: "Wrench" },
    { key: "shop", label: "Магазин", icon: "ShoppingCart" },
    { key: "tg-chat", label: "Сотрудники", icon: "Users2" },
    { key: "blog", label: "Блог", icon: "Newspaper" },
    { key: "content", label: "Редактор сайта", icon: "PenLine" },
    { key: "pages", label: "Конструктор страниц", icon: "LayoutTemplate" },
    { key: "reviews", label: "Отзывы", icon: "Star" },
    { key: "theme", label: "Тема сайта", icon: "Palette" },
    ...(manager?.role === "admin" ? [
      { key: "managers", label: "Менеджеры", icon: "UserCheck" },
      { key: "api", label: "API для партнёров", icon: "Code2" },
    ] : []),
  ];

  const w = collapsed ? "w-14" : "w-64";

  return (
    <aside className={`bg-[#111827] ${w} min-h-screen flex flex-col flex-shrink-0 transition-all duration-200`}>
      {/* Логотип + кнопка свернуть + колокольчик */}
      <div className="flex items-center gap-2 px-3 py-4 border-b border-white/10 min-h-[64px]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
          style={{ background: "#3ca615" }}
          title={collapsed ? "Развернуть меню" : "Свернуть меню"}
        >
          {collapsed
            ? <Icon name="PanelLeftOpen" size={18} className="text-white" />
            : <img
                src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
                alt="ProFiX"
                className="w-7 h-7 object-contain"
              />
          }
        </button>
        {!collapsed && (
          <button
            onClick={() => navigate("/")}
            className="text-white font-bold text-lg tracking-tight whitespace-nowrap flex-1 text-left hover:text-green-400 transition-colors"
            title="Перейти на сайт"
          >
            ProFiX
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

      {/* Пункты меню */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeSection === item.key;
          const totalBadge = item.key === "tickets" ? newCommentCount + newTicketCount
            : item.key === "reviews" ? newReviewCount
            : item.key === "tg-chat" ? newTgChatCount
            : 0;
          const hasAlert = totalBadge > 0;
          const badgeLabel = totalBadge > 99 ? "99+" : String(totalBadge);
          const isReviews = item.key === "reviews";
          const isTgChat = item.key === "tg-chat";

          return (
            <button
              key={item.key}
              onClick={() => { onSectionChange(item.key); if (isMobile) setCollapsed(true); }}
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
                  <span className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 ${isReviews ? "bg-yellow-500" : isTgChat ? "bg-blue-500" : "bg-red-500"}`}>
                    <span className="text-white text-[9px] font-bold leading-none">{badgeLabel}</span>
                  </span>
                )}
              </span>
              {!collapsed && (
                <span className="flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && hasAlert && (
                <span className={`ml-auto text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${isReviews ? "bg-yellow-500" : isTgChat ? "bg-blue-500" : "bg-red-500"}`}>
                  {isReviews
                    ? `${totalBadge} новых`
                    : isTgChat
                    ? `${totalBadge} непрочит.`
                    : newTicketCount > 0 && newCommentCount > 0
                    ? `${newTicketCount} заяв. · ${newCommentCount} комм.`
                    : newTicketCount > 0
                    ? `+${newTicketCount} новых`
                    : `${newCommentCount} комм.`
                  }
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Кнопка «На сайт» */}
      <div className="px-2 pb-1">
        <button
          onClick={() => navigate("/")}
          title="Перейти на сайт"
          className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Icon name="ExternalLink" size={18} className="shrink-0" />
          {!collapsed && <span className="flex-1 text-left">На сайт</span>}
        </button>
      </div>

      {/* Нижняя часть */}
      <div className="px-2 py-4 border-t border-white/10 relative" ref={profileRef}>

        {/* Профиль-попап */}
        {profileOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-1 bg-[#1e2533] border border-white/10 rounded-2xl shadow-2xl p-4 z-50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white text-sm font-semibold">Мой профиль</p>
              <button onClick={() => setProfileOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <Icon name="X" size={16} />
              </button>
            </div>

            {profileError && (
              <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <Icon name="AlertCircle" size={13} className="shrink-0" />{profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs flex items-center gap-2">
                <Icon name="CheckCircle" size={13} className="shrink-0" />Сохранено!
              </div>
            )}

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Имя</label>
                <input value={profileName} onChange={e => setProfileName(e.target.value)}
                  placeholder={manager?.name || "Ваше имя"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615]" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Новый логин</label>
                <input value={profileLogin} onChange={e => setProfileLogin(e.target.value)}
                  placeholder="Оставьте пустым, чтобы не менять"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615]" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                <input value={profileEmail} onChange={e => setProfileEmail(e.target.value)}
                  placeholder="Для восстановления пароля" type="email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615]" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Телефон</label>
                <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__" type="tel"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615]" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Адрес</label>
                <input value={profileAddress} onChange={e => setProfileAddress(e.target.value)}
                  placeholder="Рабочий или домашний адрес"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615]" />
              </div>

              <div className="pt-1 border-t border-white/5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Сменить пароль</p>
                <div className="space-y-2">
                  <input value={profileCurPw} onChange={e => setProfileCurPw(e.target.value)}
                    placeholder="Текущий пароль" type="password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615]" />
                  <div className="relative">
                    <input value={profileNewPw} onChange={e => setProfileNewPw(e.target.value)}
                      placeholder="Новый пароль" type={showNewPw ? "text" : "password"}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615] pr-9" />
                    <button type="button" onClick={() => setShowNewPw(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                      <Icon name={showNewPw ? "EyeOff" : "Eye"} size={14} />
                    </button>
                  </div>
                  <input value={profileNewPw2} onChange={e => setProfileNewPw2(e.target.value)}
                    placeholder="Повторите новый пароль" type={showNewPw ? "text" : "password"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#3ca615]" />
                  {profileNewPw && profileNewPw2 && profileNewPw !== profileNewPw2 && (
                    <p className="text-xs text-red-400">Пароли не совпадают</p>
                  )}
                </div>
              </div>

              <button onClick={handleProfileSave} disabled={profileLoading}
                className="w-full py-2 rounded-xl bg-[#3ca615] hover:bg-[#2d8a10] text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-1">
                {profileLoading ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                {profileLoading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        )}

        {/* Кнопка профиля */}
        <button
          onClick={() => { setProfileOpen(false); onSectionChange("profile"); }}
          title={collapsed ? `${manager?.name} — профиль` : undefined}
          className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors mb-1 ${activeSection === "profile" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3ca615] to-[#2d8a10] flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold">
            {manager?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || <Icon name="User" size={12} />}
          </div>
          {!collapsed && (
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-white text-xs font-medium truncate">{manager?.name}</p>
              <p className="text-gray-400 text-[10px] capitalize">{manager?.role === "admin" ? "Администратор" : "Менеджер"}</p>
            </div>
          )}
          {!collapsed && <Icon name="Settings" size={13} className="text-gray-500 shrink-0" />}
        </button>

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