import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Ticket, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/crm-api";
import { STATUS_FILTER_LABELS, formatDate, formatHour } from "./AdminContentUtils";

interface TicketsProps {
  tickets: Ticket[];
  loading: boolean;
  statusFilter: string;
  sourceFilter?: string;
  onFilterChange: (f: string) => void;
  onSourceFilterChange?: (s: string) => void;
  onOpenTicket: (t: Ticket) => void;
}

export function AdminTickets({ tickets, loading, statusFilter, sourceFilter = "", onFilterChange, onSourceFilterChange, onOpenTicket }: TicketsProps) {
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
        {/* Источник */}
        {onSourceFilterChange && (
          <div className="flex gap-2">
            {[
              { value: "", label: "Все заявки", icon: "LayoutList" },
              { value: "shop", label: "🛒 Магазин", icon: "" },
              { value: "other", label: "Обычные", icon: "" },
            ].map(s => (
              <button key={s.value} onClick={() => onSourceFilterChange(s.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                  sourceFilter === s.value ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
                style={sourceFilter === s.value ? { background: "#111827", borderColor: "#111827" } : {}}>
                {s.icon && <Icon name={s.icon as "LayoutList"} size={14} />}
                {s.label}
              </button>
            ))}
          </div>
        )}
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
