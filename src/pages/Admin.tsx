import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  managerApi,
  managerSession,
  Ticket,
  Client,
  Technician,
  STATUS_COLORS,
  PRIORITY_COLORS,
} from "@/lib/crm-api";

// ── Константы ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Низкий" },
  { value: "normal", label: "Нормальный" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочный" },
];

const STATUS_FILTER_LABELS: { value: string; label: string }[] = [
  { value: "", label: "Все" },
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
];

function formatHour(h: number): string {
  return h.toString().padStart(2, "0") + ":00";
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Компонент ────────────────────────────────────────────────────────────────

export default function Admin() {
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(false);
  const [manager, setManager] = useState<{ id: number; name: string; role: string } | null>(null);
  const [section, setSection] = useState("dashboard");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<{ id: number; login: string; name: string; role: string }[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    by_status: Record<string, number>;
    clients: number;
    paid: number;
    revenue: number;
  } | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techSchedule, setTechSchedule] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [newManager, setNewManager] = useState({ login: "", password: "", name: "", role: "manager" });
  const [newTech, setNewTech] = useState({ name: "", phone: "", specialization: "" });
  const [editFields, setEditFields] = useState({
    status: "",
    priority: "",
    amount: "",
    paid: false,
    technician_id: "",
    scheduled_date: "",
    scheduled_hour: "",
    tech_notes: "",
  });

  // ── Загрузка данных ─────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        managerApi.getStats(),
        managerApi.getTickets(),
      ]);
      if (statsRes.total !== undefined) setStats(statsRes);
      if (ticketsRes.tickets) setTickets(ticketsRes.tickets);
    } catch {
      setError("Не удалось загрузить данные дашборда");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      const res = await managerApi.getTickets(status || undefined);
      if (res.tickets) setTickets(res.tickets);
    } catch {
      setError("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.getClients();
      if (res.clients) setClients(res.clients);
    } catch {
      setError("Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadManagers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.getManagers();
      if (res.managers) setManagers(res.managers);
    } catch {
      setError("Не удалось загрузить менеджеров");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.getTechnicians();
      if (res.technicians) setTechnicians(res.technicians);
    } catch {
      setError("Не удалось загрузить специалистов");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Проверка сессии при загрузке ────────────────────────────────────────────

  useEffect(() => {
    const token = managerSession.get();
    if (token) {
      (async () => {
        try {
          setLoading(true);
          const res = await managerApi.verifyToken(token);
          if (res.valid && res.manager) {
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
  }, [loadDashboard]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleLogin() {
    if (!loginForm.login.trim() || !loginForm.password.trim()) {
      setError("Заполните логин и пароль");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.login(loginForm.login.trim(), loginForm.password.trim());
      if (res.token) {
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

  function handleLogout() {
    managerSession.clear();
    setLoggedIn(false);
    setManager(null);
    setTickets([]);
    setClients([]);
    setManagers([]);
    setTechnicians([]);
    setStats(null);
    setSelectedTicket(null);
    setSelectedTech(null);
    navigate("/");
  }

  function handleSectionChange(s: string) {
    setSection(s);
    setError("");
    setSelectedTicket(null);
    setSelectedTech(null);
    if (s === "dashboard") loadDashboard();
    if (s === "tickets") loadTickets(statusFilter);
    if (s === "clients") loadClients();
    if (s === "managers") loadManagers();
    if (s === "technicians") loadTechnicians();
  }

  async function handleOpenTicket(ticket: Ticket) {
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.getTicket(ticket.id);
      const t: Ticket = res.ticket || ticket;
      setSelectedTicket(t);
      setEditFields({
        status: t.status,
        priority: t.priority,
        amount: t.amount != null ? String(t.amount) : "",
        paid: t.paid ?? false,
        technician_id: t.technician?.id ? String(t.technician.id) : "",
        scheduled_date: t.scheduled_date ?? "",
        scheduled_hour: t.scheduled_hour != null ? String(t.scheduled_hour) : "",
        tech_notes: t.tech_notes ?? "",
      });
      setSection("ticket_detail");
    } catch {
      setSelectedTicket(ticket);
      setEditFields({
        status: ticket.status,
        priority: ticket.priority,
        amount: ticket.amount != null ? String(ticket.amount) : "",
        paid: ticket.paid ?? false,
        technician_id: ticket.technician?.id ? String(ticket.technician.id) : "",
        scheduled_date: ticket.scheduled_date ?? "",
        scheduled_hour: ticket.scheduled_hour != null ? String(ticket.scheduled_hour) : "",
        tech_notes: ticket.tech_notes ?? "",
      });
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
      const updateData: {
        id: number;
        status: string;
        priority: string;
        amount?: number;
        paid: boolean;
        technician_id?: number;
        scheduled_date?: string;
        scheduled_hour?: number;
        tech_notes?: string;
      } = {
        id: selectedTicket.id,
        status: editFields.status,
        priority: editFields.priority,
        paid: editFields.paid,
      };
      if (editFields.amount !== "") updateData.amount = parseFloat(editFields.amount) || 0;
      if (editFields.technician_id !== "") updateData.technician_id = parseInt(editFields.technician_id);
      if (editFields.scheduled_date !== "") updateData.scheduled_date = editFields.scheduled_date;
      if (editFields.scheduled_hour !== "") updateData.scheduled_hour = parseInt(editFields.scheduled_hour);
      if (editFields.tech_notes !== "") updateData.tech_notes = editFields.tech_notes;

      const res = await managerApi.updateTicket(updateData);
      if (res.ok || res.ticket) {
        const updated = await managerApi.getTicket(selectedTicket.id);
        if (updated.ticket) {
          const t: Ticket = updated.ticket;
          setSelectedTicket(t);
          setEditFields({
            status: t.status,
            priority: t.priority,
            amount: t.amount != null ? String(t.amount) : "",
            paid: t.paid ?? false,
            technician_id: t.technician?.id ? String(t.technician.id) : "",
            scheduled_date: t.scheduled_date ?? "",
            scheduled_hour: t.scheduled_hour != null ? String(t.scheduled_hour) : "",
            tech_notes: t.tech_notes ?? "",
          });
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

  async function handleCreateTechnician() {
    if (!newTech.name.trim()) {
      setError("Укажите имя специалиста");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.createTechnician(newTech);
      if (res.ok || res.technician) {
        setNewTech({ name: "", phone: "", specialization: "" });
        await loadTechnicians();
      } else {
        setError(res.error || "Ошибка создания специалиста");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTech(tech: Technician) {
    setSelectedTech(tech);
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.getSchedule(tech.id);
      if (res.tickets) setTechSchedule(res.tickets);
      else setTechSchedule([]);
    } catch {
      setTechSchedule([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Экран входа ─────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center px-4 font-golos">
        <div className="bg-white rounded-2xl p-8 shadow-lg w-full max-w-md mx-auto mt-20">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "#3ca615" }}
            >
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ProFiX</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Панель управления</h1>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
              <input
                type="text"
                value={loginForm.login}
                onChange={(e) => setLoginForm((f) => ({ ...f, login: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Введите логин"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ca615] focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Введите пароль"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3ca615] focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ background: "#3ca615" }}
            >
              {loading ? "Вход..." : "Войти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Основной layout ─────────────────────────────────────────────────────────

  const menuItems = [
    { key: "dashboard", label: "Дашборд", icon: "LayoutDashboard" },
    { key: "tickets", label: "Заявки", icon: "Ticket" },
    { key: "clients", label: "Клиенты", icon: "Users" },
    { key: "technicians", label: "Тех специалисты", icon: "Wrench" },
    ...(manager?.role === "admin" ? [{ key: "managers", label: "Менеджеры", icon: "UserCheck" }] : []),
  ];

  const activeSection = section === "ticket_detail" ? "tickets" : section;

  return (
    <div className="flex min-h-screen font-golos bg-[#F7F9FC]">
      {/* ── Боковое меню ──────────────────────────────────────────────────── */}
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
                onClick={() => handleSectionChange(item.key)}
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
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <Icon name="LogOut" size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Основной контент ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Глобальная ошибка */}
        {error && (
          <div className="mx-6 mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-4 text-red-400 hover:text-red-600">
              <Icon name="X" size={16} />
            </button>
          </div>
        )}

        {/* ── ДАШБОРД ───────────────────────────────────────────────────── */}
        {section === "dashboard" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Дашборд</h2>

            {/* Карточки статистики */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon name="FileText" size={20} className="text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Всего заявок</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.total ?? "—"}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                    <Icon name="AlertCircle" size={20} className="text-yellow-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Новых</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.by_status?.new ?? "—"}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <Icon name="CheckCircle" size={20} className="text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Выполнено</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats?.by_status?.done ?? "—"}</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Icon name="DollarSign" size={20} className="text-emerald-600" />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Выручка</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.revenue != null ? `${stats.revenue.toLocaleString("ru-RU")} ₽` : "—"}
                </p>
              </div>
            </div>

            {/* Последние заявки */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Последние заявки</h3>
                <button
                  onClick={() => handleSectionChange("tickets")}
                  className="text-sm font-medium"
                  style={{ color: "#3ca615" }}
                >
                  Все заявки →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                      <th className="text-left px-6 py-3">№</th>
                      <th className="text-left px-6 py-3">Клиент</th>
                      <th className="text-left px-6 py-3">Тема</th>
                      <th className="text-left px-6 py-3">Статус</th>
                      <th className="text-left px-6 py-3">Приоритет</th>
                      <th className="text-left px-6 py-3">Дата</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.slice(0, 5).map((ticket) => (
                      <tr
                        key={ticket.id}
                        onClick={() => handleOpenTicket(ticket)}
                        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3 text-sm text-gray-500">#{ticket.id}</td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {ticket.client_name || ticket.client?.name || "—"}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                          {ticket.title}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}
                          >
                            {ticket.status_label}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}
                          >
                            {ticket.priority_label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">
                          {formatDate(ticket.created_at)}
                        </td>
                      </tr>
                    ))}
                    {tickets.length === 0 && !loading && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">
                          Нет заявок
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ЗАЯВКИ ────────────────────────────────────────────────────── */}
        {section === "tickets" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Заявки</h2>
              <button
                onClick={() => {
                  /* TODO: открыть форму создания */
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ background: "#3ca615" }}
              >
                <Icon name="Plus" size={16} />
                Создать заявку
              </button>
            </div>

            {/* Фильтры */}
            <div className="flex flex-wrap gap-2 mb-5">
              {STATUS_FILTER_LABELS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => {
                    setStatusFilter(f.value);
                    loadTickets(f.value || undefined);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                    statusFilter === f.value
                      ? "text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                  style={statusFilter === f.value ? { background: "#3ca615", borderColor: "#3ca615" } : {}}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Таблица */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left px-6 py-3">№</th>
                    <th className="text-left px-6 py-3">Клиент</th>
                    <th className="text-left px-6 py-3">Тема</th>
                    <th className="text-left px-6 py-3">Статус</th>
                    <th className="text-left px-6 py-3">Приоритет</th>
                    <th className="text-left px-6 py-3">Тех специалист</th>
                    <th className="text-left px-6 py-3">Дата/Время</th>
                    <th className="text-left px-6 py-3">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => handleOpenTicket(ticket)}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3 text-sm text-gray-500">#{ticket.id}</td>
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {ticket.client_name || ticket.client?.name || "—"}
                        </p>
                        {ticket.client_phone && (
                          <p className="text-xs text-gray-400">{ticket.client_phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 max-w-[220px] truncate">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}
                        >
                          {ticket.status_label}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}
                        >
                          {ticket.priority_label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {ticket.technician_name || ticket.technician?.name || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {ticket.scheduled_date
                          ? `${formatDate(ticket.scheduled_date)}${ticket.scheduled_hour != null ? ` ${formatHour(ticket.scheduled_hour)}` : ""}`
                          : formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {ticket.amount != null ? `${ticket.amount.toLocaleString("ru-RU")} ₽` : "—"}
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && !loading && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                        Нет заявок
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ДЕТАЛИ ЗАЯВКИ ─────────────────────────────────────────────── */}
        {section === "ticket_detail" && selectedTicket && (
          <div className="p-6">
            {/* Хлебные крошки */}
            <button
              onClick={() => handleSectionChange("tickets")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
            >
              <Icon name="ArrowLeft" size={16} />
              Назад к заявкам
            </button>

            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Заявка #{selectedTicket.id}
              </h2>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-medium ${STATUS_COLORS[selectedTicket.status] ?? "bg-gray-100 text-gray-500"}`}
              >
                {selectedTicket.status_label}
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Левая колонка: инфо + комментарии */}
              <div className="xl:col-span-2 space-y-5">
                {/* Инфо о клиенте */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="User" size={18} className="text-gray-400" />
                    Клиент
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Имя</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedTicket.client_name || selectedTicket.client?.name || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Телефон</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedTicket.client_phone || selectedTicket.client?.phone || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedTicket.client?.email || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Описание */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Icon name="FileText" size={18} className="text-gray-400" />
                    {selectedTicket.title}
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {selectedTicket.description || "Описание не указано"}
                  </p>
                  {selectedTicket.tech_notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                      <p className="text-xs font-medium text-yellow-700 mb-1">Заметки для техника</p>
                      <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                        {selectedTicket.tech_notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Комментарии */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="MessageSquare" size={18} className="text-gray-400" />
                    Комментарии ({selectedTicket.comments?.length ?? 0})
                  </h3>

                  <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
                    {(selectedTicket.comments ?? []).length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">
                        Комментариев пока нет
                      </p>
                    )}
                    {(selectedTicket.comments ?? []).map((c) => {
                      const isManager = c.author_role === "manager";
                      const isTech = c.author_role === "technician";
                      return (
                        <div
                          key={c.id}
                          className={`flex ${isManager ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              isManager
                                ? "bg-blue-500 text-white rounded-br-sm"
                                : isTech
                                ? "bg-green-100 text-green-900 rounded-bl-sm"
                                : "bg-gray-100 text-gray-800 rounded-bl-sm"
                            }`}
                          >
                            <p className={`text-xs font-medium mb-1 ${isManager ? "text-blue-100" : isTech ? "text-green-600" : "text-gray-500"}`}>
                              {c.author_name || c.author_role}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{c.text}</p>
                            <p className={`text-xs mt-1 ${isManager ? "text-blue-200" : "text-gray-400"}`}>
                              {formatDateTime(c.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Форма добавления комментария */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                      placeholder="Написать комментарий..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615] focus:border-transparent"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={loading || !comment.trim()}
                      className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex-shrink-0"
                      style={{ background: "#3ca615" }}
                    >
                      <Icon name="Send" size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Правая колонка: панель редактирования */}
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="Settings" size={18} className="text-gray-400" />
                    Редактирование
                  </h3>

                  <div className="space-y-4">
                    {/* Статус */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Статус</label>
                      <select
                        value={editFields.status}
                        onChange={(e) => setEditFields((f) => ({ ...f, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Приоритет */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Приоритет</label>
                      <select
                        value={editFields.priority}
                        onChange={(e) => setEditFields((f) => ({ ...f, priority: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      >
                        {PRIORITY_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Тех специалист */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Тех специалист</label>
                      <select
                        value={editFields.technician_id}
                        onChange={(e) => setEditFields((f) => ({ ...f, technician_id: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      >
                        <option value="">Не назначен</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Дата выезда */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Дата выезда</label>
                      <input
                        type="date"
                        value={editFields.scheduled_date}
                        onChange={(e) => setEditFields((f) => ({ ...f, scheduled_date: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>

                    {/* Час выезда */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Час выезда</label>
                      <select
                        value={editFields.scheduled_hour}
                        onChange={(e) => setEditFields((f) => ({ ...f, scheduled_hour: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      >
                        <option value="">Не указан</option>
                        {Array.from({ length: 13 }, (_, i) => i + 8).map((h) => (
                          <option key={h} value={String(h)}>{formatHour(h)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Сумма */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Сумма, ₽</label>
                      <input
                        type="number"
                        value={editFields.amount}
                        onChange={(e) => setEditFields((f) => ({ ...f, amount: e.target.value }))}
                        placeholder="0"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>

                    {/* Оплачено */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="paid-cb"
                        checked={editFields.paid}
                        onChange={(e) => setEditFields((f) => ({ ...f, paid: e.target.checked }))}
                        className="w-4 h-4 rounded accent-[#3ca615]"
                      />
                      <label htmlFor="paid-cb" className="text-sm text-gray-700 font-medium">
                        Оплачено
                      </label>
                    </div>

                    {/* tech_notes */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Заметки для техника</label>
                      <textarea
                        value={editFields.tech_notes}
                        onChange={(e) => setEditFields((f) => ({ ...f, tech_notes: e.target.value }))}
                        rows={3}
                        placeholder="Дополнительная информация для специалиста..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615] resize-none"
                      />
                    </div>

                    <button
                      onClick={handleUpdateTicket}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
                      style={{ background: "#3ca615" }}
                    >
                      {loading ? "Сохранение..." : "Сохранить"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── КЛИЕНТЫ ───────────────────────────────────────────────────── */}
        {section === "clients" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Клиенты</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                    <th className="text-left px-6 py-3">Имя</th>
                    <th className="text-left px-6 py-3">Телефон</th>
                    <th className="text-left px-6 py-3">Email</th>
                    <th className="text-left px-6 py-3">Кол-во заявок</th>
                    <th className="text-left px-6 py-3">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {client.name || "—"}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">{client.phone}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{client.email || "—"}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs">
                          {client.tickets_count}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {formatDate(client.created_at)}
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                        Нет клиентов
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ТЕХ СПЕЦИАЛИСТЫ ───────────────────────────────────────────── */}
        {section === "technicians" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Тех специалисты</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Список специалистов */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {technicians.map((tech) => (
                    <div
                      key={tech.id}
                      onClick={() => handleSelectTech(tech)}
                      className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
                        selectedTech?.id === tech.id ? "border-[#3ca615] ring-2 ring-[#3ca615]/20" : "border-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#3ca615" }}>
                          <Icon name="Wrench" size={18} className="text-white" />
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                          <Icon name="Ticket" size={12} />
                          {tech.active_tickets ?? 0} активных
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{tech.name}</h3>
                      {tech.phone && (
                        <p className="text-sm text-gray-500 mb-1">{tech.phone}</p>
                      )}
                      {tech.specialization && (
                        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-2 py-1 inline-block">
                          {tech.specialization}
                        </p>
                      )}
                    </div>
                  ))}
                  {technicians.length === 0 && !loading && (
                    <div className="sm:col-span-2 text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                      Нет специалистов
                    </div>
                  )}
                </div>

                {/* Расписание специалиста */}
                {selectedTech && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">
                        Расписание: {selectedTech.name}
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {techSchedule.length === 0 && (
                        <p className="px-6 py-8 text-center text-gray-400 text-sm">
                          Нет запланированных заявок
                        </p>
                      )}
                      {techSchedule.map((t) => (
                        <div key={t.id} className="px-6 py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                              <Icon name="Calendar" size={16} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{t.title}</p>
                              <p className="text-xs text-gray-400">
                                {t.scheduled_date
                                  ? `${formatDate(t.scheduled_date)}${t.scheduled_hour != null ? ` в ${formatHour(t.scheduled_hour)}` : ""}`
                                  : "Дата не указана"}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-500"}`}
                          >
                            {t.status_label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Форма добавления специалиста */}
              <div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="UserPlus" size={18} className="text-gray-400" />
                    Новый специалист
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Имя</label>
                      <input
                        type="text"
                        value={newTech.name}
                        onChange={(e) => setNewTech((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Иван Иванов"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Телефон</label>
                      <input
                        type="text"
                        value={newTech.phone}
                        onChange={(e) => setNewTech((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+7 999 000-00-00"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Специализация</label>
                      <input
                        type="text"
                        value={newTech.specialization}
                        onChange={(e) => setNewTech((f) => ({ ...f, specialization: e.target.value }))}
                        placeholder="Ремонт техники"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>
                    <button
                      onClick={handleCreateTechnician}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
                      style={{ background: "#3ca615" }}
                    >
                      {loading ? "Создание..." : "Добавить"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── МЕНЕДЖЕРЫ (только admin) ───────────────────────────────────── */}
        {section === "managers" && manager?.role === "admin" && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Менеджеры</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Таблица */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="text-left px-6 py-3">Имя</th>
                        <th className="text-left px-6 py-3">Логин</th>
                        <th className="text-left px-6 py-3">Роль</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managers.map((m) => (
                        <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">{m.name}</td>
                          <td className="px-6 py-3 text-sm text-gray-600">{m.login}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                                m.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {m.role === "admin" ? "Администратор" : "Менеджер"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {managers.length === 0 && !loading && (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-sm">
                            Нет менеджеров
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
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Icon name="UserPlus" size={18} className="text-gray-400" />
                    Новый менеджер
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Имя</label>
                      <input
                        type="text"
                        value={newManager.name}
                        onChange={(e) => setNewManager((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Иван Иванов"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Логин</label>
                      <input
                        type="text"
                        value={newManager.login}
                        onChange={(e) => setNewManager((f) => ({ ...f, login: e.target.value }))}
                        placeholder="ivanov"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Пароль</label>
                      <input
                        type="password"
                        value={newManager.password}
                        onChange={(e) => setNewManager((f) => ({ ...f, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Роль</label>
                      <select
                        value={newManager.role}
                        onChange={(e) => setNewManager((f) => ({ ...f, role: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                      >
                        <option value="manager">Менеджер</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </div>
                    <button
                      onClick={handleCreateManager}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
                      style={{ background: "#3ca615" }}
                    >
                      {loading ? "Создание..." : "Создать"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Индикатор загрузки */}
        {loading && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Загрузка...
          </div>
        )}
      </main>
    </div>
  );
}
