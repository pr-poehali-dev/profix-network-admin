import Icon from "@/components/ui/icon";
import { Ticket, Technician, Client, STATUS_COLORS } from "@/lib/crm-api";
import { EditFields, STATUS_OPTIONS, PRIORITY_OPTIONS, formatDate, formatDateTime, formatHour } from "./AdminContentUtils";

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
