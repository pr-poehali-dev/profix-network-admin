import Icon from "@/components/ui/icon";
import { Ticket, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/crm-api";

// ── Список заявок ────────────────────────────────────────────────────────────

interface TicketListProps {
  tickets: Ticket[];
  error: string;
  client: { name?: string; phone: string; email?: string; avatar_url?: string | null } | null;
  onOpenTicket: (t: Ticket) => void;
  onNewTicket: () => void;
  onReview: () => void;
  onProfile: () => void;
}

export function CabinetTicketList({ tickets, error, client, onOpenTicket, onNewTicket, onReview, onProfile }: TicketListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {tickets.length === 0
            ? "У вас пока нет заявок"
            : `${tickets.length} ${tickets.length === 1 ? "заявка" : tickets.length < 5 ? "заявки" : "заявок"}`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onReview}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#3ca615] text-sm font-medium border border-[#3ca615] hover:bg-[#edf7e8] transition"
          >
            <Icon name="Star" size={15} />
            Отзыв
          </button>
          <button
            onClick={onNewTicket}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition"
            style={{ backgroundColor: "#3ca615" }}
          >
            <Icon name="Plus" size={15} />
            Заявка
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3 mb-4">
          <Icon name="AlertCircle" size={15} />
          {error}
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="FileText" size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Здесь будут отображаться ваши заявки</p>
          <button
            onClick={onNewTicket}
            className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "#3ca615" }}
          >
            Создать первую заявку
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onOpenTicket(ticket)}
              className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left hover:shadow-md hover:border-gray-200 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-400">#{ticket.id}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-500"}`}>
                      {ticket.status_label}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-500"}`}>
                      {ticket.priority_label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#3ca615] transition">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ticket.created_at).toLocaleDateString("ru-RU")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {ticket.amount != null && ticket.amount > 0 && (
                    <span className="text-sm font-semibold text-gray-800">
                      {ticket.amount.toLocaleString("ru-RU")} ₽
                    </span>
                  )}
                  <Icon name="ChevronRight" size={16} className="text-gray-300 group-hover:text-[#3ca615] transition" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Кнопка перехода в профиль */}
      <button
        onClick={onProfile}
        className="mt-6 w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-[#3ca615] hover:shadow-md transition-all group text-left"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#edf7e8] flex items-center justify-center shrink-0 border-2 border-[#3ca615]/20">
          {client?.avatar_url
            ? <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
            : <Icon name="User" size={22} className="text-[#3ca615]" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{client?.name || "Без имени"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{client?.phone}{client?.email ? ` · ${client.email}` : ""}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#3ca615] font-medium shrink-0">
          <Icon name="Settings" size={14} />
          <span className="hidden sm:inline">Профиль</span>
        </div>
      </button>
    </div>
  );
}

// ── Просмотр заявки ──────────────────────────────────────────────────────────

interface TicketDetailProps {
  ticket: Ticket;
  comment: string;
  setComment: (v: string) => void;
  loading: boolean;
  error: string;
  onAddComment: () => void;
}

export function CabinetTicketDetail({ ticket, comment, setComment, loading, error, onAddComment }: TicketDetailProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-500"}`}>
            {ticket.status_label}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[ticket.priority] || "bg-gray-100 text-gray-500"}`}>
            {ticket.priority_label}
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(ticket.created_at).toLocaleDateString("ru-RU")}
          </span>
        </div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">{ticket.title}</h2>
        {ticket.description && (
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        )}
        {ticket.amount != null && ticket.amount > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Сумма</span>
            <span className="text-sm font-semibold text-gray-800">{ticket.amount.toLocaleString("ru-RU")} ₽</span>
          </div>
        )}
        {ticket.manager_name && (
          <div className="mt-3 flex items-center gap-2">
            <Icon name="UserCheck" size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500">Менеджер: {ticket.manager_name}</span>
          </div>
        )}
      </div>

      {/* Комментарии */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Icon name="MessageSquare" size={15} />
          Комментарии
          {ticket.comments && ticket.comments.length > 0 && (
            <span className="ml-1 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
              {ticket.comments.length}
            </span>
          )}
        </h3>

        {(!ticket.comments || ticket.comments.length === 0) ? (
          <p className="text-sm text-gray-400 text-center py-4">Комментариев пока нет</p>
        ) : (
          <div className="space-y-3 mb-4">
            {ticket.comments.map((c) => (
              <div
                key={c.id}
                className={`rounded-xl p-3.5 text-sm ${
                  c.author_role === "client" ? "bg-[#3ca615]/5 ml-8" : "bg-gray-50 mr-8"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-500">
                    {c.author_role === "client" ? "Вы" : c.author_name || "Менеджер"}
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
            placeholder="Напишите комментарий..."
            rows={2}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
          />
          <button
            onClick={onAddComment}
            disabled={loading || !comment.trim()}
            className="px-4 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition self-end"
            style={{ backgroundColor: "#3ca615" }}
          >
            <Icon name="Send" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Новая заявка ─────────────────────────────────────────────────────────────

interface NewTicketProps {
  newTicket: { title: string; description: string; priority: string };
  setNewTicket: (v: { title: string; description: string; priority: string }) => void;
  loading: boolean;
  error: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export function CabinetNewTicket({ newTicket, setNewTicket, loading, error, onSubmit, onCancel }: NewTicketProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-5">Новая заявка</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Тема заявки <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newTicket.title}
            onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
            placeholder="Кратко опишите проблему или вопрос"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
          <textarea
            value={newTicket.description}
            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
            placeholder="Подробно опишите вашу ситуацию..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Приоритет</label>
          <div className="flex gap-2">
            {[
              { value: "normal", label: "Обычный" },
              { value: "high", label: "Высокий" },
              { value: "urgent", label: "Срочный" },
            ].map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setNewTicket({ ...newTicket, priority: p.value })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                  newTicket.priority === p.value
                    ? "border-[#3ca615] bg-[#3ca615]/5 text-[#3ca615]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
            <Icon name="AlertCircle" size={15} />
            {error}
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
          >
            Отмена
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition"
            style={{ backgroundColor: "#3ca615" }}
          >
            {loading ? "Создание..." : "Создать заявку"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Отзыв ────────────────────────────────────────────────────────────────────

interface ReviewProps {
  tickets: Ticket[];
  reviewSent: boolean;
  reviewRating: number;
  setReviewRating: (v: number) => void;
  reviewText: string;
  setReviewText: (v: string) => void;
  reviewTicketId: number | undefined;
  setReviewTicketId: (v: number | undefined) => void;
  loading: boolean;
  error: string;
  onSubmit: () => void;
  onCancel: () => void;
  onBack: () => void;
}

export function CabinetReview({
  tickets, reviewSent, reviewRating, setReviewRating, reviewText, setReviewText,
  reviewTicketId, setReviewTicketId, loading, error, onSubmit, onCancel, onBack,
}: ReviewProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {reviewSent ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="CheckCircle" size={28} className="text-green-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Спасибо за отзыв!</h2>
          <p className="text-sm text-gray-500 mb-6">Он появится на сайте после проверки</p>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: "#3ca615" }}
          >
            Вернуться к заявкам
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Оставить отзыв</h2>

          {tickets.filter(t => t.status === "done").length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">По какой заявке?</label>
              <select
                value={reviewTicketId || ""}
                onChange={e => setReviewTicketId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
              >
                <option value="">Общий отзыв</option>
                {tickets.filter(t => t.status === "done").map(t => (
                  <option key={t.id} value={t.id}>#{t.id} — {t.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Оценка</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} className="p-1 transition">
                  <Icon
                    name="Star"
                    size={32}
                    className={star <= reviewRating
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200 fill-gray-200 hover:text-yellow-300 hover:fill-yellow-300"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ваш отзыв</label>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Расскажите о своём опыте работы с нами..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
              <Icon name="AlertCircle" size={15} />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition"
              style={{ backgroundColor: "#3ca615" }}
            >
              {loading ? "Отправка..." : "Отправить отзыв"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
