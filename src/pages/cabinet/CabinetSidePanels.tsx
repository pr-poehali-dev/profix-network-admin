import { useRef, RefObject } from "react";
import Icon from "@/components/ui/icon";

// ── Чат с менеджером ─────────────────────────────────────────────────────────

interface ChatMessage {
  id?: number;
  from: "user" | "bot" | "operator";
  text: string;
  time: string;
}

interface ChatProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  chatSending: boolean;
  chatBottomRef: RefObject<HTMLDivElement>;
  sendChatMessage: () => void;
}

export function CabinetChat({ chatMessages, chatInput, setChatInput, chatSending, chatBottomRef, sendChatMessage }: ChatProps) {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Шапка чата */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111827] shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#3ca615] flex items-center justify-center shrink-0">
          <Icon name="MessageCircle" size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">Поддержка ProFiX</p>
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
            Онлайн — отвечаем за 5 минут
          </p>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f7f9fc]">
        {chatMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.from !== "user" && (
              <div className="w-7 h-7 rounded-full bg-[#3ca615] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Icon name={msg.from === "operator" ? "UserCheck" : "Bot"} size={13} className="text-white" />
              </div>
            )}
            <div className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.from === "user"
                ? "bg-[#3ca615] text-white rounded-br-sm"
                : msg.from === "operator"
                ? "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-green-100"
                : "bg-white text-gray-600 rounded-bl-sm shadow-sm border border-gray-100"
            }`}>
              {msg.from === "operator" && (
                <p className="text-[10px] text-[#3ca615] font-bold mb-1">Менеджер</p>
              )}
              <p>{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-green-200" : "text-gray-400"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
        {chatSending && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-7 h-7 rounded-full bg-[#3ca615] flex items-center justify-center shrink-0">
              <Icon name="UserCheck" size={13} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Ввод */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendChatMessage()}
          placeholder="Напишите сообщение..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] transition"
        />
        <button
          onClick={sendChatMessage}
          disabled={!chatInput.trim() || chatSending}
          className="w-10 h-10 rounded-full flex items-center justify-center transition disabled:opacity-50 shrink-0"
          style={{ backgroundColor: "#3ca615" }}
        >
          <Icon name="Send" size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Мои заказы ───────────────────────────────────────────────────────────────

interface Order {
  id: number;
  invoice_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
  delivery_type: string;
  created_at: string;
}

interface OrdersProps {
  orders: Order[];
  ordersLoading: boolean;
}

export function CabinetOrders({ orders, ordersLoading }: OrdersProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {ordersLoading ? "Загружаем..." : orders.length === 0 ? "Заказов пока нет" : `${orders.length} ${orders.length === 1 ? "заказ" : orders.length < 5 ? "заказа" : "заказов"}`}
        </p>
      </div>
      {orders.length === 0 && !ordersLoading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icon name="ShoppingBag" size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">Здесь будут ваши заказы из магазина</p>
        </div>
      )}
      <div className="space-y-3">
        {orders.map(order => {
          const st = { new: { label: "Новый", color: "#6366f1" }, in_progress: { label: "В обработке", color: "#f59e0b" }, waiting: { label: "Ожидание", color: "#8b5cf6" }, done: { label: "Выполнен", color: "#3ca615" } }[order.status] || { label: order.status, color: "#9ca3af" };
          const ps = { pending: { label: "Ожидает оплаты", color: "#f59e0b" }, paid: { label: "Оплачен", color: "#3ca615" }, not_required: { label: "Не требуется", color: "#9ca3af" } }[order.payment_status] || { label: order.payment_status, color: "#9ca3af" };
          const pm: Record<string, string> = { cash: "Наличными", card: "Картой", invoice: "По счёту", qr: "QR / СБП" };
          const dt: Record<string, string> = { pickup: "Самовывоз", physical: "Доставка", digital: "Электронная" };
          return (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{order.invoice_number}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(order.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: st.color }}>{st.label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: ps.color }}>{ps.label}</span>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                {order.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span className="truncate flex-1 mr-2">{it.name} ×{it.qty}</span>
                    <span className="font-medium shrink-0">{(it.price * it.qty).toLocaleString("ru-RU")} ₽</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{dt[order.delivery_type] || order.delivery_type}</span>
                  {order.payment_method && <span>{pm[order.payment_method] || order.payment_method}</span>}
                </div>
                <p className="font-bold text-gray-900 text-sm">{order.total.toLocaleString("ru-RU")} ₽</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Реквизиты ────────────────────────────────────────────────────────────────

interface Requisites {
  client_type: string;
  company_name: string;
  company_inn: string;
  company_kpp: string;
  company_address: string;
}

interface RequisitesProps {
  requisites: Requisites;
  setRequisites: (fn: (prev: Requisites) => Requisites) => void;
  reqSaving: boolean;
  reqSuccess: boolean;
  onSave: () => void;
}

export function CabinetRequisites({ requisites, setRequisites, reqSaving, reqSuccess, onSave }: RequisitesProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Тип получателя</p>
        <div className="grid grid-cols-2 gap-2">
          {[{ key: "individual", label: "Физическое лицо", icon: "User" }, { key: "company", label: "Юридическое лицо", icon: "Building2" }].map(opt => (
            <button key={opt.key} type="button"
              onClick={() => setRequisites(p => ({ ...p, client_type: opt.key }))}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${requisites.client_type === opt.key ? "border-[#3ca615] bg-[#edf7e8] text-[#2d6a0a]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              <Icon name={opt.icon as "User"} size={15} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {requisites.client_type === "company" && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Название организации</label>
            <input value={requisites.company_name} onChange={e => setRequisites(p => ({ ...p, company_name: e.target.value }))}
              placeholder="ООО «Название»"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ИНН</label>
              <input value={requisites.company_inn} onChange={e => setRequisites(p => ({ ...p, company_inn: e.target.value }))}
                placeholder="1234567890"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">КПП</label>
              <input value={requisites.company_kpp} onChange={e => setRequisites(p => ({ ...p, company_kpp: e.target.value }))}
                placeholder="123456789"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Юридический адрес</label>
            <input value={requisites.company_address} onChange={e => setRequisites(p => ({ ...p, company_address: e.target.value }))}
              placeholder="г. Якутск, ул. ..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
        </div>
      )}
      {reqSuccess && <p className="text-sm text-[#3ca615] font-medium">✓ Реквизиты сохранены</p>}
      <button
        onClick={onSave}
        className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
        style={{ background: "#3ca615", color: "#ffffff" }}
        disabled={reqSaving}
      >
        {reqSaving ? "Сохраняем..." : "Сохранить реквизиты"}
      </button>
      <p className="text-xs text-gray-400 text-center">Реквизиты будут автоматически подставляться при оформлении заказов</p>
    </div>
  );
}
