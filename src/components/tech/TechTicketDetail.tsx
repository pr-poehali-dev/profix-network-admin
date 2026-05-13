import Icon from "@/components/ui/icon";
import { Ticket, STATUS_COLORS } from "@/lib/crm-api";
import { techApi } from "@/lib/crm-api";

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
];

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

interface Props {
  ticket: Ticket;
  comment: string;
  newStatus: string;
  statusComment: string;
  saving: boolean;
  onBack: () => void;
  onCommentChange: (v: string) => void;
  onNewStatusChange: (v: string) => void;
  onStatusCommentChange: (v: string) => void;
  onUpdateStatus: () => void;
  onAddComment: () => void;
  onTicketRefresh: (t: Ticket) => void;
}

export default function TechTicketDetail({
  ticket, comment, newStatus, statusComment, saving,
  onBack, onCommentChange, onNewStatusChange, onStatusCommentChange,
  onUpdateStatus, onAddComment, onTicketRefresh,
}: Props) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3ca615] mb-4 transition-colors"
      >
        <Icon name="ChevronLeft" size={16} /> Назад к заявкам
      </button>

      {/* Информация о заявке */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Заявка #{ticket.id}</p>
            <h2 className="font-bold text-lg text-[#111827]">{ticket.title}</h2>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-500"}`}>
            {ticket.status_label}
          </span>
        </div>

        {ticket.description && (
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{ticket.description}</p>
        )}

        {ticket.tech_notes && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4">
            <p className="text-xs font-semibold text-yellow-700 mb-1">Заметки от менеджера</p>
            <p className="text-sm text-yellow-800">{ticket.tech_notes}</p>
          </div>
        )}

        {/* Контакты клиента */}
        {ticket.client && (
          <div className="bg-[#F7F9FC] rounded-xl p-3 mb-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Клиент</p>
            <div className="flex flex-col gap-1">
              {ticket.client.name && (
                <p className="text-sm font-medium text-[#111827]">{ticket.client.name}</p>
              )}
              {ticket.client.phone && (
                <a href={`tel:${ticket.client.phone}`}
                  className="flex items-center gap-1.5 text-sm text-[#3ca615] hover:underline">
                  <Icon name="Phone" size={13} />
                  {ticket.client.phone}
                </a>
              )}
              {ticket.client.email && (
                <p className="text-sm text-gray-500">{ticket.client.email}</p>
              )}
            </div>
          </div>
        )}

        {/* Дата/время выезда */}
        {(ticket.scheduled_date || ticket.scheduled_hour !== null) && (
          <div className="flex items-center gap-2 text-sm text-[#1565C0] mb-4">
            <Icon name="Calendar" size={15} />
            <span>
              {ticket.scheduled_date && new Date(ticket.scheduled_date).toLocaleDateString("ru-RU")}
              {ticket.scheduled_hour !== null && ticket.scheduled_hour !== undefined &&
                ` в ${formatHour(ticket.scheduled_hour)}`}
            </span>
          </div>
        )}
      </div>

      {/* Смена статуса */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h3 className="font-semibold text-sm text-[#111827] mb-3">Изменить статус</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => onNewStatusChange(s.value)}
              className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                newStatus === s.value
                  ? "bg-[#3ca615] text-white border-[#3ca615]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <textarea
          value={statusComment}
          onChange={e => onStatusCommentChange(e.target.value)}
          placeholder="Комментарий к смене статуса (необязательно)..."
          rows={2}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3ca615] resize-none mb-3"
        />
        <button
          onClick={onUpdateStatus}
          disabled={saving || newStatus === ticket.status}
          className="w-full bg-[#3ca615] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2d8a10] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
          Сохранить статус
        </button>
      </div>

      {/* Комментарии */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-[#111827]">
            Переписка ({ticket.comments?.length || 0})
          </h3>
          <button onClick={async () => {
            const res = await techApi.getTicket(ticket.id);
            if (res.ticket) onTicketRefresh(res.ticket);
          }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#3ca615] transition-colors">
            <Icon name="RefreshCw" size={13} />
            Обновить
          </button>
        </div>
        <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
          {ticket.comments?.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">Комментариев пока нет</p>
          )}
          {ticket.comments?.map(c => (
            <div key={c.id} className={`flex ${c.author_role === "technician" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                c.author_role === "technician"
                  ? "bg-[#3ca615] text-white rounded-br-sm"
                  : c.author_role === "manager"
                  ? "bg-[#EBF3FF] text-[#1565C0] rounded-bl-sm"
                  : "bg-gray-100 text-gray-700 rounded-bl-sm"
              }`}>
                {c.author_role !== "technician" && (
                  <p className="text-[10px] font-semibold mb-1 opacity-70">
                    {c.author_role === "manager" ? "Менеджер" : "Клиент"}{c.author_name ? `: ${c.author_name}` : ""}
                  </p>
                )}
                <p>{c.text}</p>
                <p className="text-[10px] mt-1 opacity-60">
                  {c.created_at ? new Date(c.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            value={comment}
            onChange={e => onCommentChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAddComment(); }
            }}
            placeholder="Написать комментарий... (Enter — отправить)"
            rows={2}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3ca615] resize-none"
          />
          <button
            onClick={onAddComment}
            disabled={saving || !comment.trim()}
            className="w-10 h-10 self-end bg-[#3ca615] text-white rounded-xl flex items-center justify-center hover:bg-[#2d8a10] transition-colors disabled:opacity-60 shrink-0"
          >
            {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
