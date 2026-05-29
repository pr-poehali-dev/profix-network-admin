import Icon from "@/components/ui/icon";
import { Ticket, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/crm-api";
import { formatDate } from "./AdminContentUtils";

interface DashboardProps {
  stats: { total: number; by_status: Record<string, number>; clients: number; paid: number; revenue: number } | null;
  tickets: Ticket[];
  loading: boolean;
  onOpenTicket: (t: Ticket) => void;
  onGoTickets: () => void;
}

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
                <span className={`shrink-0 inline-flex px-2 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[ticket.status] ?? "bg-gray-100 text-gray-500"}`}>
                  {ticket.status_label}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{ticket.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${PRIORITY_COLORS[ticket.priority] ?? "bg-gray-100 text-gray-500"}`}>
                  {ticket.priority_label}
                </span>
                <span className="text-xs text-gray-400">{formatDate(ticket.created_at)}</span>
              </div>
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
