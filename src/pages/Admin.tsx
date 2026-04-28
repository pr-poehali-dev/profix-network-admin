import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { managerApi, managerSession, Ticket, Client, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/crm-api";

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
];

export default function Admin() {
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(false);
  const [manager, setManager] = useState<any>(null);
  const [section, setSection] = useState("dashboard");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [newManager, setNewManager] = useState({ login: "", password: "", name: "", role: "manager" });
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });

  // Ticket edit state
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editManagerId, setEditManagerId] = useState("");

  useEffect(() => {
    const token = managerSession.get();
    if (token) {
      (async () => {
        try {
          setLoading(true);
          const res = await managerApi.verifyToken(token);
          if (res.ok && res.manager) {
            setManager(res.manager);
            setLoggedIn(true);
            await loadDashboard();
          }
        } catch {
          // token invalid
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  async function loadDashboard() {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        managerApi.getStats(),
        managerApi.getTickets(),
      ]);
      if (statsRes.stats) setStats(statsRes.stats);
      if (ticketsRes.tickets) setTickets(ticketsRes.tickets);
    } catch {
      setError("Не удалось загрузить данные");
    }
  }

  async function loadTickets(status?: string) {
    try {
      setLoading(true);
      const res = await managerApi.getTickets(status || undefined);
      if (res.tickets) setTickets(res.tickets);
    } catch {
      setError("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    try {
      setLoading(true);
      const res = await managerApi.getClients();
      if (res.clients) setClients(res.clients);
    } catch {
      setError("Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  }

  async function loadManagers() {
    try {
      setLoading(true);
      const res = await managerApi.getManagers();
      if (res.managers) setManagers(res.managers);
    } catch {
      setError("Не удалось загрузить менеджеров");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!loginForm.login.trim() || !loginForm.password.trim()) {
      setError("Заполните логин и пароль");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.login(loginForm.login.trim(), loginForm.password.trim());
      if (res.ok && res.token) {
        managerSession.set(res.token);
        setManager(res.manager);
        setLoggedIn(true);
        await loadDashboard();
      } else {
        setError(res.error || "Неверный логин или пароль");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenTicket(ticket: Ticket) {
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.getTicket(ticket.id);
      const t = res.ticket || ticket;
      setSelectedTicket(t);
      setEditStatus(t.status);
      setEditPriority(t.priority);
      setEditAmount(t.amount != null ? String(t.amount) : "");
      setEditManagerId("");
      setSection("ticket_detail");
    } catch {
      setSelectedTicket(ticket);
      setEditStatus(ticket.status);
      setEditPriority(ticket.priority);
      setEditAmount(ticket.amount != null ? String(ticket.amount) : "");
      setSection("ticket_detail");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTicket() {
    if (!selectedTicket) return;
    setError("");
    setLoading(true);
    try {
      const updateData: Record<string, unknown> = {
        id: selectedTicket.id,
        status: editStatus,
        priority: editPriority,
      };
      if (editAmount !== "") updateData.amount = parseFloat(editAmount) || 0;
      if (editManagerId !== "") updateData.manager_id = parseInt(editManagerId);

      const res = await managerApi.updateTicket(updateData);
      if (res.ok || res.ticket) {
        const updated = await managerApi.getTicket(selectedTicket.id);
        if (updated.ticket) {
          setSelectedTicket(updated.ticket);
          setEditStatus(updated.ticket.status);
          setEditPriority(updated.ticket.priority);
          setEditAmount(updated.ticket.amount != null ? String(updated.ticket.amount) : "");
        }
      } else {
        setError(res.error || "Ошибка обновления заявки");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment() {
    if (!comment.trim() || !selectedTicket) return;
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.addComment(selectedTicket.id, comment.trim());
      if (res.ok || res.comment) {
        setComment("");
        const updated = await managerApi.getTicket(selectedTicket.id);
        if (updated.ticket) setSelectedTicket(updated.ticket);
      } else {
        setError(res.error || "Ошибка добавления комментария");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateManager() {
    if (!newManager.login.trim() || !newManager.password.trim() || !newManager.name.trim()) {
      setError("Заполните все поля");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.createManager(newManager);
      if (res.ok || res.manager) {
        setNewManager({ login: "", password: "", name: "", role: "manager" });
        await loadManagers();
      } else {
        setError(res.error || "Ошибка создания менеджера");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    managerSession.clear();
    setLoggedIn(false);
    setManager(null);
    setTickets([]);
    setClients([]);
    setManagers([]);
    setStats(null);
    navigate("/");
  }

  function handleSectionChange(s: string) {
    setSection(s);
    setError("");
    setSelectedTicket(null);
    if (s === "dashboard") loadDashboard();
    if (s === "tickets") loadTickets(statusFilter);
    if (s === "clients") loadClients();
    if (s === "managers") loadManagers();
  }

  // ── Экран входа ────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-4 font-golos">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#111827" }}>
              <Icon name="ShieldCheck" size={20} color="white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Панель управления</h1>
              <p className="text-sm text-gray-500">Вход для менеджеров</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Логин</label>
              <input
                type="text"
                value={loginForm.login}
                onChange={(e) => setLoginForm({ ...loginForm, login: e.target.value })}
                placeholder="Введите логин"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Введите пароль"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                <Icon name="AlertCircle" size={15} />
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-white text-sm transition disabled:opacity-60"
              style={{ backgroundColor: "#3ca615" }}
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Основной интерфейс ─────────────────────────────────────────────────────

  const navItems = [
    { id: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
    { id: "tickets", label: "Заявки", icon: "FileText" },
    { id: "clients", label: "Клиенты", icon: "Users" },
    ...(manager?.role === "admin" ? [{ id: "managers", label: "Менеджеры", icon: "UserCog" }] : []),
  ];

  const filteredTickets = statusFilter
    ? tickets.filter((t) => t.status === statusFilter)
    : tickets;

  return (
    <div className="min-h-screen flex font-golos">
      {/* Боковое меню */}
      <aside className="w-64 bg-[#111827] text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-3" style={{ backgroundColor: "#3ca615" }}>
            <Icon name="Zap" size={14} color="white" />
          </div>
          <span className="font-semibold text-sm">CRM Система</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                section === item.id || (section === "ticket_detail" && item.id === "tickets")
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-4 border-t border-white/10 pt-4">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium text-white/80">{manager?.name || manager?.login}</p>
            <p className="text-xs text-white/40 capitalize">{manager?.role === "admin" ? "Администратор" : "Менеджер"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition"
          >
            <Icon name="LogOut" size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Контент */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Шапка */}
        <header className="bg-white border-b shadow-sm h-16 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-2">
            {section === "ticket_detail" && (
              <button
                onClick={() => { setSection("tickets"); setSelectedTicket(null); setError(""); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500 mr-1"
              >
                <Icon name="ArrowLeft" size={18} />
              </button>
            )}
            <h2 className="font-semibold text-gray-900 text-sm">
              {section === "dashboard" && "Дашборд"}
              {section === "tickets" && "Заявки"}
              {section === "clients" && "Клиенты"}
              {section === "managers" && "Менеджеры"}
              {section === "ticket_detail" && selectedTicket && `Заявка #${selectedTicket.id}`}
            </h2>
          </div>
        </header>

        <main className="flex-1 bg-[#F7F9FC] p-6 overflow-auto">

          {/* ── Дашборд ── */}
          {section === "dashboard" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Всего заявок", value: stats?.total ?? tickets.length, icon: "FileText", color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Новых", value: stats?.new ?? tickets.filter((t) => t.status === "new").length, icon: "Plus", color: "text-yellow-600", bg: "bg-yellow-50" },
                  { label: "Выполнено", value: stats?.done ?? tickets.filter((t) => t.status === "done").length, icon: "CheckCircle", color: "text-green-600", bg: "bg-green-50" },
                  {
                    label: "Выручка",
                    value: stats?.revenue != null
                      ? `${Number(stats.revenue).toLocaleString("ru-RU")} ₽`
                      : `${tickets.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString("ru-RU")} ₽`,
                    icon: "Banknote",
                    color: "text-[#3ca615]",
                    bg: "bg-green-50",
                  },
                ].map((card) => (
                  <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500">{card.label}</span>
                      <div className={`w-8 h-8 rounded-xl ${card.bg} flex items-center justify-center`}>
                        <Icon name={card.icon} size={15} className={card.color} />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Последние заявки</h3>
                  <button
                    onClick={() => handleSectionChange("tickets")}
                    className="text-xs text-[#3ca615] hover:underline font-medium"
                  >
                    Все заявки
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {tickets.slice(0, 5).map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => handleOpenTicket(ticket)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition"
                    >
                      <span className="text-xs text-gray-400 w-10 shrink-0">#{ticket.id}</span>
                      <span className="flex-1 text-sm text-gray-800 truncate">{ticket.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-500"}`}>
                        {ticket.status_label}
                      </span>
                      <span className="text-xs text-gray-400 shrink-0">
                        {new Date(ticket.created_at).toLocaleDateString("ru-RU")}
                      </span>
                    </button>
                  ))}
                  {tickets.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">Заявок пока нет</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Заявки ── */}
          {section === "tickets" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setStatusFilter(""); loadTickets(""); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                      statusFilter === ""
                        ? "border-[#3ca615] bg-[#3ca615]/5 text-[#3ca615]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    Все
                  </button>
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => { setStatusFilter(s.value); loadTickets(s.value); }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        statusFilter === s.value
                          ? "border-[#3ca615] bg-[#3ca615]/5 text-[#3ca615]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">
                  <Icon name="AlertCircle" size={15} />
                  {error}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">#</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Тема</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Клиент</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Статус</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Приоритет</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Сумма</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Дата</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => handleOpenTicket(ticket)}
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-4 py-3 text-xs text-gray-400">#{ticket.id}</td>
                        <td className="px-4 py-3 text-gray-800 max-w-[200px] truncate">{ticket.title}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{ticket.client_name || ticket.client?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-500"}`}>
                            {ticket.status_label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-500"}`}>
                            {ticket.priority_label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          {ticket.amount != null && ticket.amount > 0 ? `${ticket.amount.toLocaleString("ru-RU")} ₽` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(ticket.created_at).toLocaleDateString("ru-RU")}
                        </td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-400 text-sm">
                          Заявок не найдено
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Детали заявки ── */}
          {section === "ticket_detail" && selectedTicket && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Левая колонка */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedTicket.status] || "bg-gray-100 text-gray-500"}`}>
                      {selectedTicket.status_label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selectedTicket.priority] || "bg-gray-100 text-gray-500"}`}>
                      {selectedTicket.priority_label}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(selectedTicket.created_at).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">{selectedTicket.title}</h2>
                  {selectedTicket.description && (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  )}
                  {selectedTicket.client && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs">
                      {selectedTicket.client.name && (
                        <div>
                          <span className="text-gray-400">Клиент</span>
                          <p className="font-medium text-gray-700 mt-0.5">{selectedTicket.client.name}</p>
                        </div>
                      )}
                      {selectedTicket.client_phone && (
                        <div>
                          <span className="text-gray-400">Телефон</span>
                          <p className="font-medium text-gray-700 mt-0.5">{selectedTicket.client_phone}</p>
                        </div>
                      )}
                      {selectedTicket.client.email && (
                        <div>
                          <span className="text-gray-400">Email</span>
                          <p className="font-medium text-gray-700 mt-0.5">{selectedTicket.client.email}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Комментарии */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Icon name="MessageSquare" size={15} />
                    Комментарии
                    {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                      <span className="ml-1 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                        {selectedTicket.comments.length}
                      </span>
                    )}
                  </h3>

                  {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                    <p className="text-sm text-gray-400 text-center py-4">Комментариев пока нет</p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {selectedTicket.comments.map((c) => (
                        <div
                          key={c.id}
                          className={`rounded-xl p-3.5 text-sm ${
                            c.author_role === "manager"
                              ? "bg-[#3ca615]/5 ml-8"
                              : "bg-gray-50 mr-8"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-gray-500">
                              {c.author_role === "manager" ? c.author_name || "Менеджер" : "Клиент"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(c.created_at).toLocaleDateString("ru-RU")}
                            </span>
                          </div>
                          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 mb-3">
                      <Icon name="AlertCircle" size={15} />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Написать комментарий клиенту..."
                      rows={2}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={loading || !comment.trim()}
                      className="px-4 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition self-end"
                      style={{ backgroundColor: "#3ca615" }}
                    >
                      <Icon name="Send" size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Правая колонка — редактирование */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Параметры заявки</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Статус</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Приоритет</label>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                      >
                        <option value="low">Низкий</option>
                        <option value="normal">Обычный</option>
                        <option value="high">Высокий</option>
                        <option value="urgent">Срочный</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Сумма (₽)</label>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        placeholder="0"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                      />
                    </div>
                    <button
                      onClick={handleUpdateTicket}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition"
                      style={{ backgroundColor: "#3ca615" }}
                    >
                      {loading ? "Сохранение..." : "Сохранить изменения"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Клиенты ── */}
          {section === "clients" && (
            <div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">
                  <Icon name="AlertCircle" size={15} />
                  {error}
                </div>
              )}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Клиенты {clients.length > 0 && <span className="text-gray-400 font-normal">({clients.length})</span>}
                  </h3>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Имя</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Телефон</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Заявок</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Дата регистрации</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-800">{client.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{client.phone}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{client.email || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            {client.tickets_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(client.created_at).toLocaleDateString("ru-RU")}
                        </td>
                      </tr>
                    ))}
                    {clients.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                          {loading ? "Загрузка..." : "Клиентов пока нет"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Менеджеры (только admin) ── */}
          {section === "managers" && manager?.role === "admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2">
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">
                    <Icon name="AlertCircle" size={15} />
                    {error}
                  </div>
                )}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Менеджеры {managers.length > 0 && <span className="text-gray-400 font-normal">({managers.length})</span>}
                    </h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Имя</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Логин</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Роль</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {managers.map((m, i) => (
                        <tr key={m.id ?? i} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 text-gray-800">{m.name || "—"}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{m.login}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              m.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                            }`}>
                              {m.role === "admin" ? "Администратор" : "Менеджер"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {managers.length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-10 text-gray-400 text-sm">
                            {loading ? "Загрузка..." : "Менеджеров пока нет"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Форма создания менеджера */}
              <div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Новый менеджер</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Имя</label>
                      <input
                        type="text"
                        value={newManager.name}
                        onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                        placeholder="Иван Иванов"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Логин</label>
                      <input
                        type="text"
                        value={newManager.login}
                        onChange={(e) => setNewManager({ ...newManager, login: e.target.value })}
                        placeholder="ivanov"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Пароль</label>
                      <input
                        type="password"
                        value={newManager.password}
                        onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                        placeholder="Минимум 6 символов"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Роль</label>
                      <select
                        value={newManager.role}
                        onChange={(e) => setNewManager({ ...newManager, role: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                      >
                        <option value="manager">Менеджер</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCreateManager}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition mt-1"
                      style={{ backgroundColor: "#3ca615" }}
                    >
                      {loading ? "Создание..." : "Создать менеджера"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
