import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Ticket, Client, Technician, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/crm-api";

// ── Утилиты ──────────────────────────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Низкий" },
  { value: "normal", label: "Нормальный" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочный" },
];

export const STATUS_FILTER_LABELS = [
  { value: "", label: "Все" },
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
];

export function formatHour(h: number): string {
  return h.toString().padStart(2, "0") + ":00";
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Типы props ────────────────────────────────────────────────────────────────

export interface EditFields {
  status: string;
  priority: string;
  amount: string;
  paid: boolean;
  technician_id: string;
  scheduled_date: string;
  scheduled_hour: string;
  tech_notes: string;
}

interface DashboardProps {
  stats: { total: number; by_status: Record<string, number>; clients: number; paid: number; revenue: number } | null;
  tickets: Ticket[];
  loading: boolean;
  onOpenTicket: (t: Ticket) => void;
  onGoTickets: () => void;
}

interface TicketsProps {
  tickets: Ticket[];
  loading: boolean;
  statusFilter: string;
  onFilterChange: (f: string) => void;
  onOpenTicket: (t: Ticket) => void;
}

interface TicketDetailProps {
  ticket: Ticket;
  technicians: Technician[];
  editFields: EditFields;
  comment: string;
  loading: boolean;
  onEditChange: (f: EditFields) => void;
  onCommentChange: (v: string) => void;
  onSave: () => void;
  onAddComment: () => void;
  onBack: () => void;
}

interface ClientsProps {
  clients: Client[];
  loading: boolean;
}

// ── ДАШБОРД ───────────────────────────────────────────────────────────────────

export function AdminDashboard({ stats, tickets, loading, onOpenTicket, onGoTickets }: DashboardProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Дашборд</h2>

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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Последние заявки</h3>
          <button onClick={onGoTickets} className="text-sm font-medium" style={{ color: "#3ca615" }}>
            Все заявки →
          </button>
        </div>

        {/* Таблица на широких экранах */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                <th className="text-left px-4 py-3">№</th>
                <th className="text-left px-4 py-3">Клиент</th>
                <th className="text-left px-4 py-3">Тема</th>
                <th className="text-left px-4 py-3">Статус</th>
                <th className="text-left px-4 py-3">Приоритет</th>
                <th className="text-left px-4 py-3">Дата</th>
              </tr>
            </thead>
            <tbody>
              {tickets.slice(0, 5).map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onOpenTicket(ticket)}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-500">#{ticket.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {ticket.client_name || ticket.client?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">{ticket.title}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {ticket.status_label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}>
                      {ticket.priority_label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(ticket.created_at)}</td>
                </tr>
              ))}
              {tickets.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">Нет заявок</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Карточки на малых экранах */}
        <div className="md:hidden divide-y divide-gray-50">
          {tickets.slice(0, 5).map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => onOpenTicket(ticket)}
              className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <span className="text-xs text-gray-400 mr-1.5">#{ticket.id}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{ticket.client_name || ticket.client?.name || "—"}</span>
                </div>
                <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {ticket.status_label}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{ticket.title}</p>
            </div>
          ))}
          {tickets.length === 0 && !loading && (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">Нет заявок</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── СПИСОК ЗАЯВОК ─────────────────────────────────────────────────────────────

export function AdminTickets({ tickets, loading, statusFilter, onFilterChange, onOpenTicket }: TicketsProps) {
  const [techFilter, setTechFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Уникальные специалисты из списка заявок
  const techOptions = Array.from(
    new Map(
      tickets
        .filter(t => t.technician_name || t.technician?.name)
        .map(t => {
          const name = t.technician_name || t.technician?.name || "";
          return [name, name];
        })
    ).values()
  );

  // Фильтрация по дате
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const filtered = tickets.filter(t => {
    if (techFilter && (t.technician_name || t.technician?.name) !== techFilter) return false;
    if (dateFilter) {
      const date = new Date(t.created_at);
      if (dateFilter === "today") {
        return date >= startOfDay(now);
      }
      if (dateFilter === "week") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        return date >= startOfDay(weekStart);
      }
      if (dateFilter === "month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }
    }
    return true;
  });

  const DATE_FILTERS = [
    { value: "today", label: "Сегодня" },
    { value: "week", label: "Эта неделя" },
    { value: "month", label: "Этот месяц" },
  ];

  const hasAnyFilter = techFilter || dateFilter;

  function exportToExcel() {
    const headers = ["№", "Клиент", "Телефон", "Email", "Тема", "Описание", "Статус", "Приоритет", "Специалист", "Дата создания", "Дата визита", "Сумма", "Оплачено"];
    const rows = filtered.map(t => [
      t.id,
      t.client_name || t.client?.name || "",
      t.client_phone || t.client?.phone || "",
      t.client?.email || "",
      t.title,
      t.description || "",
      t.status_label || t.status,
      t.priority_label || t.priority,
      t.technician_name || t.technician?.name || "",
      formatDate(t.created_at),
      t.scheduled_date ? `${formatDate(t.scheduled_date)}${t.scheduled_hour != null ? ` ${formatHour(t.scheduled_hour)}` : ""}` : "",
      t.amount != null ? t.amount : "",
      t.paid ? "Да" : "Нет",
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toLocaleDateString("ru-RU").replace(/\./g, "-");
    a.href = url;
    a.download = `заявки_${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h2 className="text-2xl font-bold text-gray-900">Заявки</h2>
        <div className="flex items-center gap-3">
          {hasAnyFilter && (
            <button
              onClick={() => { setTechFilter(""); setDateFilter(""); }}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              <Icon name="X" size={14} />
              Сбросить фильтры
            </button>
          )}
          <button
            onClick={exportToExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
            style={{ background: "#3ca615" }}
          >
            <Icon name="Download" size={15} />
            Экспорт CSV
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="space-y-3 mb-5">
        {/* Статус */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTER_LABELS.map((f) => (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
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

        {/* Дата + Специалист */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Фильтр по дате */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            <Icon name="Calendar" size={14} className="text-gray-400 ml-1.5" />
            {DATE_FILTERS.map(df => (
              <button
                key={df.value}
                onClick={() => setDateFilter(dateFilter === df.value ? "" : df.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dateFilter === df.value
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
                style={dateFilter === df.value ? { background: "#3ca615" } : {}}
              >
                {df.label}
              </button>
            ))}
          </div>

          {/* Фильтр по специалисту */}
          {techOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <Icon name="Wrench" size={15} className="text-gray-400 shrink-0" />
              <select
                value={techFilter}
                onChange={e => setTechFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-green-400 cursor-pointer"
              >
                <option value="">Все специалисты</option>
                {techOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Счётчик результатов */}
          {hasAnyFilter && (
            <span className="text-xs text-gray-400 ml-1">
              {filtered.length} {filtered.length === 1 ? "заявка" : filtered.length < 5 ? "заявки" : "заявок"}
            </span>
          )}
        </div>
      </div>

      {/* Таблица — только на широких экранах */}
      <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left px-4 py-3">№</th>
              <th className="text-left px-4 py-3">Клиент</th>
              <th className="text-left px-4 py-3">Тема</th>
              <th className="text-left px-4 py-3">Статус</th>
              <th className="text-left px-4 py-3">Приоритет</th>
              <th className="text-left px-4 py-3">Специалист</th>
              <th className="text-left px-4 py-3">Дата</th>
              <th className="text-left px-4 py-3">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => onOpenTicket(ticket)}
                className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-500">#{ticket.id}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{ticket.client_name || ticket.client?.name || "—"}</p>
                  {ticket.client_phone && <p className="text-xs text-gray-400">{ticket.client_phone}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 max-w-[180px] truncate">{ticket.title}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {ticket.status_label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}>
                    {ticket.priority_label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {ticket.technician_name || ticket.technician?.name || "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {ticket.scheduled_date
                    ? `${formatDate(ticket.scheduled_date)}${ticket.scheduled_hour != null ? ` ${formatHour(ticket.scheduled_hour)}` : ""}`
                    : formatDate(ticket.created_at)}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {ticket.amount != null ? `${ticket.amount.toLocaleString("ru-RU")} ₽` : "—"}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                  {techFilter ? `Нет заявок у специалиста «${techFilter}»` : "Нет заявок"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Карточки — на малых/средних экранах */}
      <div className="lg:hidden space-y-3">
        {filtered.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-12 text-center text-gray-400 text-sm">
            {techFilter ? `Нет заявок у специалиста «${techFilter}»` : "Нет заявок"}
          </div>
        )}
        {filtered.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => onOpenTicket(ticket)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-green-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">#{ticket.id}</p>
                <p className="font-semibold text-sm text-gray-900 truncate">{ticket.title}</p>
              </div>
              <span className={`shrink-0 inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                {ticket.status_label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{ticket.client_name || ticket.client?.name || "—"}</span>
              {ticket.client_phone && <span>{ticket.client_phone}</span>}
              <span className={`inline-flex px-2 py-0.5 rounded-lg font-medium ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}>
                {ticket.priority_label}
              </span>
              {(ticket.technician_name || ticket.technician?.name) && (
                <span>{ticket.technician_name || ticket.technician?.name}</span>
              )}
              {ticket.amount != null && (
                <span className="font-medium text-gray-900">{ticket.amount.toLocaleString("ru-RU")} ₽</span>
              )}
              <span className="ml-auto">
                {ticket.scheduled_date
                  ? `${formatDate(ticket.scheduled_date)}${ticket.scheduled_hour != null ? ` ${formatHour(ticket.scheduled_hour)}` : ""}`
                  : formatDate(ticket.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ДЕТАЛИ ЗАЯВКИ ─────────────────────────────────────────────────────────────

export function AdminTicketDetail({
  ticket, technicians, editFields, comment, loading,
  onEditChange, onCommentChange, onSave, onAddComment, onBack,
}: TicketDetailProps) {
  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад к заявкам
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Заявка #{ticket.id}</h2>
        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
          {ticket.status_label}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Левая колонка */}
        <div className="xl:col-span-2 space-y-5">
          {/* Клиент */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="User" size={18} className="text-gray-400" />
              Клиент
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Имя</p>
                <p className="text-sm font-medium text-gray-900">{ticket.client_name || ticket.client?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Телефон</p>
                <p className="text-sm font-medium text-gray-900">{ticket.client_phone || ticket.client?.phone || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-sm font-medium text-gray-900">{ticket.client?.email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Описание */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Icon name="FileText" size={18} className="text-gray-400" />
              {ticket.title}
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {ticket.description || "Описание не указано"}
            </p>
            {ticket.tech_notes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                <p className="text-xs font-medium text-yellow-700 mb-1">Заметки для техника</p>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">{ticket.tech_notes}</p>
              </div>
            )}
          </div>

          {/* Комментарии */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="MessageSquare" size={18} className="text-gray-400" />
              Комментарии ({ticket.comments?.length ?? 0})
            </h3>
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-1">
              {(ticket.comments ?? []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Комментариев пока нет</p>
              )}
              {(ticket.comments ?? []).map((c) => {
                const isManager = c.author_role === "manager";
                const isTech = c.author_role === "technician";
                return (
                  <div key={c.id} className={`flex ${isManager ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      isManager
                        ? "bg-blue-500 text-white rounded-br-sm"
                        : isTech
                        ? "bg-green-100 text-green-900 rounded-bl-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}>
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
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddComment()}
                placeholder="Написать комментарий..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615] focus:border-transparent"
              />
              <button
                onClick={onAddComment}
                disabled={loading || !comment.trim()}
                className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex-shrink-0"
                style={{ background: "#3ca615" }}
              >
                <Icon name="Send" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Правая колонка: редактирование */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="Settings" size={18} className="text-gray-400" />
              Редактирование
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Статус</label>
                <select
                  value={editFields.status}
                  onChange={(e) => onEditChange({ ...editFields, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                >
                  {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Приоритет</label>
                <select
                  value={editFields.priority}
                  onChange={(e) => onEditChange({ ...editFields, priority: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                >
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Тех специалист</label>
                <select
                  value={editFields.technician_id}
                  onChange={(e) => onEditChange({ ...editFields, technician_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                >
                  <option value="">Не назначен</option>
                  {technicians.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Дата выезда</label>
                <input
                  type="date"
                  value={editFields.scheduled_date}
                  onChange={(e) => onEditChange({ ...editFields, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Час выезда</label>
                <select
                  value={editFields.scheduled_hour}
                  onChange={(e) => onEditChange({ ...editFields, scheduled_hour: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                >
                  <option value="">Не указан</option>
                  {Array.from({ length: 13 }, (_, i) => i + 8).map((h) => (
                    <option key={h} value={String(h)}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Сумма, ₽</label>
                <input
                  type="number"
                  value={editFields.amount}
                  onChange={(e) => onEditChange({ ...editFields, amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="paid-cb"
                  checked={editFields.paid}
                  onChange={(e) => onEditChange({ ...editFields, paid: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#3ca615]"
                />
                <label htmlFor="paid-cb" className="text-sm text-gray-700 font-medium">Оплачено</label>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Заметки для техника</label>
                <textarea
                  value={editFields.tech_notes}
                  onChange={(e) => onEditChange({ ...editFields, tech_notes: e.target.value })}
                  rows={3}
                  placeholder="Дополнительная информация для специалиста..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615] resize-none"
                />
              </div>
              <button
                onClick={onSave}
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
  );
}

// ── КЛИЕНТЫ ───────────────────────────────────────────────────────────────────

export function AdminClients({ clients, loading }: ClientsProps) {
  return (
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
                <td className="px-6 py-3 text-sm font-medium text-gray-900">{client.name || "—"}</td>
                <td className="px-6 py-3 text-sm text-gray-700">{client.phone}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{client.email || "—"}</td>
                <td className="px-6 py-3 text-sm text-gray-700">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-700 font-semibold text-xs">
                    {client.tickets_count}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">{formatDate(client.created_at)}</td>
              </tr>
            ))}
            {clients.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">Нет клиентов</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}