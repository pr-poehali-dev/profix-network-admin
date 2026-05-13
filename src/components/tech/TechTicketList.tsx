import Icon from "@/components/ui/icon";
import { Ticket, STATUS_COLORS } from "@/lib/crm-api";

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

interface Props {
  tickets: Ticket[];
  loading: boolean;
  filter: string;
  onFilterChange: (f: string) => void;
  onOpenTicket: (t: Ticket) => void;
  onRefresh: () => void;
}

export default function TechTicketList({
  tickets, loading, filter, onFilterChange, onOpenTicket, onRefresh,
}: Props) {
  const filteredTickets = tickets.filter(t => {
    if (filter === "active") return !["done", "cancelled"].includes(t.status);
    if (filter === "done") return t.status === "done";
    return true;
  });

  return (
    <>
      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Активных", count: tickets.filter(t => !["done","cancelled"].includes(t.status)).length, color: "text-[#3ca615]", bg: "bg-[#edf7e8]", icon: "Clock" },
          { label: "Сегодня", count: tickets.filter(t => t.scheduled_date === new Date().toISOString().split("T")[0]).length, color: "text-[#3ca615]", bg: "bg-[#edf7e8]", icon: "Calendar" },
          { label: "Выполнено", count: tickets.filter(t => t.status === "done").length, color: "text-gray-600", bg: "bg-gray-100", icon: "CheckCircle" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon name={s.icon} size={17} className={s.color} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Фильтр */}
      <div className="flex gap-2 mb-4">
        {[
          { v: "active", l: "Активные" },
          { v: "done", l: "Выполненные" },
          { v: "all", l: "Все" },
        ].map(f => (
          <button
            key={f.v}
            onClick={() => onFilterChange(f.v)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.v ? "bg-[#3ca615] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#3ca615] hover:text-[#3ca615]"
            }`}
          >
            {f.l}
          </button>
        ))}
        <button
          onClick={onRefresh}
          className="ml-auto p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-[#3ca615] hover:border-[#3ca615] transition-colors"
        >
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>

      {/* Карточки заявок */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Icon name="Loader2" size={28} className="animate-spin text-[#3ca615]" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Заявок нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(t => (
            <button
              key={t.id}
              onClick={() => onOpenTicket(t)}
              className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-[#3ca615] hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">#{t.id}</p>
                  <p className="font-semibold text-sm text-[#111827] truncate">{t.title}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-500"}`}>
                  {t.status_label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {t.client_name && (
                  <span className="flex items-center gap-1">
                    <Icon name="User" size={11} />
                    {t.client_name}
                  </span>
                )}
                {t.client_phone && (
                  <span className="flex items-center gap-1">
                    <Icon name="Phone" size={11} />
                    {t.client_phone}
                  </span>
                )}
                {t.scheduled_date && (
                  <span className="flex items-center gap-1 text-[#1565C0]">
                    <Icon name="Calendar" size={11} />
                    {new Date(t.scheduled_date).toLocaleDateString("ru-RU")}
                    {t.scheduled_hour !== null && t.scheduled_hour !== undefined && ` ${formatHour(t.scheduled_hour)}`}
                  </span>
                )}
              </div>

              {t.tech_notes && (
                <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg px-2.5 py-1.5 line-clamp-1">
                  📌 {t.tech_notes}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
