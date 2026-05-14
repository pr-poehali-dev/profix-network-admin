import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Icon from "@/components/ui/icon";
import { managerApi, managerSession, Ticket, STATUS_COLORS, fixiesApi } from "@/lib/crm-api";
import { shopApi } from "@/lib/shop-api";

const STATUS_LABELS: Record<string, string> = {
  new: "Новая", in_progress: "В работе", waiting: "Ожидание",
  done: "Выполнена", cancelled: "Отменена",
};

// ── Утилиты звука ─────────────────────────────────────────────────────────────
function playBeep(type: "ticket" | "comment") {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    const freqs = type === "ticket" ? [440, 660] : [520];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.25);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch { /* ignore */ }
}

function notify(title: string, body: string) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "https://cdn.poehali.dev/files/14883a12-7574-4223-bfd4-68dc3e490534.png",
    });
  }
}

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  pending:        { label: "Ожидает оплаты",  color: "bg-yellow-50 text-yellow-700 border border-yellow-200", icon: "Clock" },
  proof_uploaded: { label: "Чек загружен",     color: "bg-blue-50 text-blue-700 border border-blue-200",      icon: "Upload" },
  paid:           { label: "Оплачен",          color: "bg-green-50 text-green-700 border border-green-200",    icon: "CheckCircle" },
  rejected:       { label: "Отклонён",         color: "bg-red-50 text-red-700 border border-red-200",          icon: "XCircle" },
  not_required:   { label: "Без оплаты",       color: "bg-gray-50 text-gray-500 border border-gray-200",       icon: "Minus" },
};

// ── Детальный вид заявки ──────────────────────────────────────────────────────
function TicketDetail({ ticket, onBack, onRefresh }: {
  ticket: Ticket; onBack: () => void; onRefresh: (t: Ticket) => void;
}) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  const ext = ticket as Ticket & { invoice_number?: string; payment_status?: string; payment_proof_url?: string };

  async function handleConfirmPayment(status: "paid" | "rejected") {
    if (!ext.invoice_number) return;
    setConfirmingPayment(true);
    await shopApi.confirmPayment(ticket.id, status);
    const r = await managerApi.getTicket(ticket.id);
    if (r.ticket) onRefresh(r.ticket);
    setConfirmingPayment(false);
  }

  async function sendComment() {
    if (!comment.trim()) return;
    setSaving(true);
    await managerApi.addComment(ticket.id, comment.trim());
    setComment("");
    const r = await managerApi.getTicket(ticket.id);
    if (r.ticket) onRefresh(r.ticket);
    setSaving(false);
  }

  async function saveStatus() {
    if (newStatus === ticket.status) return;
    setSaving(true);
    await managerApi.updateTicket({ id: ticket.id, status: newStatus, priority: ticket.priority, paid: ticket.paid });
    const r = await managerApi.getTicket(ticket.id);
    if (r.ticket) onRefresh(r.ticket);
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-800">
          <Icon name="ChevronLeft" size={22} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{ticket.title}</p>
          <p className="text-xs text-gray-400">#{ticket.id} · {ticket.client_name || (ticket as {client?: {name:string}}).client?.name || "—"}</p>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${STATUS_COLORS[ticket.status] || "bg-gray-100 text-gray-500"}`}>
          {STATUS_LABELS[ticket.status]}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Смена статуса */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">Статус</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(STATUS_LABELS).map(([val, lbl]) => (
              <button key={val} onClick={() => setNewStatus(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${newStatus === val ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
                style={newStatus === val ? { background: "#3ca615" } : {}}>
                {lbl}
              </button>
            ))}
          </div>
          {newStatus !== ticket.status && (
            <button onClick={saveStatus} disabled={saving}
              className="mt-3 w-full py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
              style={{ background: "#3ca615" }}>
              {saving ? "Сохраняю..." : "Сохранить статус"}
            </button>
          )}
        </div>

        {/* Описание */}
        {ticket.description && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-2">Описание</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>
        )}

        {/* Оплата / Счёт */}
        {ext.invoice_number && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400">Счёт и оплата</p>
              {ext.payment_status && PAYMENT_STATUS_LABELS[ext.payment_status] && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl ${PAYMENT_STATUS_LABELS[ext.payment_status].color}`}>
                  <Icon name={PAYMENT_STATUS_LABELS[ext.payment_status].icon as "Clock"} size={12} />
                  {PAYMENT_STATUS_LABELS[ext.payment_status].label}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Номер счёта:</span>
              <span className="font-mono font-semibold text-gray-900">{ext.invoice_number}</span>
            </div>
            {ticket.amount != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Сумма:</span>
                <span className="font-bold text-gray-900">{ticket.amount.toLocaleString("ru-RU")} ₽</span>
              </div>
            )}

            <a href={`/invoice/${ext.invoice_number}`} target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#3ca615] text-[#3ca615] text-sm font-semibold hover:bg-[#edf7e8] transition-colors">
              <Icon name="FileText" size={15} />
              Открыть счёт
            </a>

            {/* Чек от клиента */}
            {ext.payment_status === "proof_uploaded" && ext.payment_proof_url && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-blue-600">Клиент загрузил чек — требует проверки:</p>
                <a href={ext.payment_proof_url} target="_blank" rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-blue-200">
                  <img src={ext.payment_proof_url} alt="Чек оплаты" className="w-full max-h-48 object-cover" />
                </a>
                <div className="flex gap-2">
                  <button onClick={() => handleConfirmPayment("paid")} disabled={confirmingPayment}
                    className="flex-1 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors">
                    <Icon name="CheckCircle" size={14} />
                    Подтвердить
                  </button>
                  <button onClick={() => handleConfirmPayment("rejected")} disabled={confirmingPayment}
                    className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors">
                    <Icon name="XCircle" size={14} />
                    Отклонить
                  </button>
                </div>
              </div>
            )}

            {ext.payment_status === "paid" && (
              <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
                <Icon name="CheckCircle" size={14} className="text-green-600 shrink-0" />
                <p className="text-xs text-green-700 font-medium">Оплата подтверждена</p>
              </div>
            )}
          </div>
        )}

        {/* Комментарии */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-400 mb-3">
            Комментарии {ticket.comments?.length ? `(${ticket.comments.length})` : ""}
          </p>
          {ticket.comments?.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">Нет комментариев</p>
          )}
          <div className="space-y-3 mb-4">
            {(ticket.comments || []).map((c: {id:number; author_name:string; author_role:string; text:string; created_at:string}) => (
              <div key={c.id} className={`rounded-xl p-3 ${c.author_role === "technician" ? "bg-blue-50 border border-blue-100" : "bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    {c.author_role === "technician" && <Icon name="Wrench" size={11} className="text-blue-500" />}
                    {c.author_role === "manager" && <Icon name="UserCheck" size={11} className="text-green-600" />}
                    {c.author_name || (c.author_role === "technician" ? "Специалист" : "Менеджер")}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(c.created_at).toLocaleString("ru-RU", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{c.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendComment()}
              placeholder="Написать комментарий..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
            <button onClick={sendComment} disabled={saving || !comment.trim()}
              className="p-2.5 rounded-xl text-white disabled:opacity-40"
              style={{ background: "#3ca615" }}>
              <Icon name="Send" size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────
export default function ManagerApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [manager, setManager] = useState<{id:number; name:string; role:string} | null>(null);
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [loginErr, setLoginErr] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"tickets" | "new">("tickets");
  const [newTicket, setNewTicket] = useState({ title: "", description: "", phone: "", name: "" });
  const [creating, setCreating] = useState(false);
  const [notifBadge, setNotifBadge] = useState(0);
  const lastTicketIdRef = useRef(0);
  const lastCommentIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fixiesBalance, setFixiesBalance] = useState<number | null>(null);
  const [tariffInfo, setTariffInfo] = useState<{name:string;speed_tiers?:{hours:number;fixies:number}[]} | null>(null);
  const [showFixies, setShowFixies] = useState(false);
  const [fixiesHistory, setFixiesHistory] = useState<{amount:number;reason:string;created_at:string}[]>([]);

  // Polling уведомлений
  const poll = useCallback(async () => {
    try {
      const res = await managerApi.getTickets();
      const all: Ticket[] = res.tickets || [];
      const maxTid = all.reduce((m, t) => Math.max(m, t.id || 0), 0);

      if (lastTicketIdRef.current === 0) {
        lastTicketIdRef.current = maxTid;
      } else if (maxTid > lastTicketIdRef.current) {
        const added = all.filter(t => (t.id || 0) > lastTicketIdRef.current);
        lastTicketIdRef.current = maxTid;
        setNotifBadge(p => p + added.length);
        const last = added[added.length - 1];
        playBeep("ticket");
        notify("ProFiX — новая заявка", `#${last.id} ${last.title}`);
      }

      let maxCid = lastCommentIdRef.current;
      let newCmts = 0; let lastTitle = ""; let lastAuthor = "";
      for (const t of all) {
        for (const c of (t.comments || [])) {
          const cid = c.id || 0;
          if (cid > maxCid) { maxCid = cid; if (lastCommentIdRef.current > 0) { newCmts++; lastTitle = t.title; lastAuthor = c.author || "Специалист"; } }
        }
      }
      if (lastCommentIdRef.current === 0) lastCommentIdRef.current = maxCid;
      else if (newCmts > 0) {
        lastCommentIdRef.current = maxCid;
        setNotifBadge(p => p + newCmts);
        playBeep("comment");
        notify("ProFiX — новый комментарий", `${lastAuthor}: ${lastTitle}`);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    if (Notification.permission === "default") Notification.requestPermission();
    pollRef.current = setInterval(poll, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loggedIn, poll]);

  // Проверка токена
  useEffect(() => {
    const token = managerSession.get();
    if (token) {
      managerApi.verifyToken(token).then(r => {
        if (r.valid && r.manager) { setManager(r.manager); setLoggedIn(true); }
      });
    }
  }, []);

  async function loadTickets() {
    setLoading(true);
    const res = await managerApi.getTickets(filter === "active" ? undefined : filter === "done" ? "done" : undefined);
    if (res.tickets) setTickets(res.tickets);
    setNotifBadge(0);
    setLoading(false);
  }

  useEffect(() => { if (loggedIn) loadTickets(); }, [loggedIn, filter]);

  useEffect(() => {
    if (!loggedIn) return;
    const token = managerSession.get();
    if (!token) return;
    fixiesApi.getMyFixies(token, "manager").then(res => {
      if (res.balance !== undefined) setFixiesBalance(res.balance);
      if (res.tariff?.name) setTariffInfo(res.tariff);
      if (res.history) setFixiesHistory(res.history);
    }).catch(() => {});
  }, [loggedIn]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr("");
    const res = await managerApi.login(loginForm.login, loginForm.password);
    if (res.token) { managerSession.set(res.token); setManager(res.manager); setLoggedIn(true); }
    else setLoginErr(res.error || "Неверный логин или пароль");
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await managerApi.createTicket({ title: newTicket.title, description: newTicket.description, client_name: newTicket.name, client_phone: newTicket.phone });
    setNewTicket({ title: "", description: "", phone: "", name: "" });
    setCreating(false);
    setTab("tickets");
    loadTickets();
  }

  const filteredTickets = tickets.filter(t => {
    if (filter === "active") return !["done", "cancelled"].includes(t.status);
    if (filter === "done") return t.status === "done";
    return true;
  });

  // Экран входа
  if (!loggedIn) return (
    <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex items-center justify-center px-4">
      <Helmet><title>ProFiX Manager</title></Helmet>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm">
        <div className="text-center mb-7">
          <img src="https://cdn.poehali.dev/files/14883a12-7574-4223-bfd4-68dc3e490534.png"
            alt="ProFiX" className="w-14 h-14 mx-auto mb-3 object-contain" />
          <p className="text-[#3ca615] text-xs font-semibold uppercase tracking-widest mb-1">ProFiX</p>
          <h1 className="font-oswald text-2xl font-bold text-[#0D1B2A]">Менеджер</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {loginErr && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">{loginErr}</div>}
          <input value={loginForm.login} onChange={e => setLoginForm(p => ({...p, login: e.target.value}))}
            required placeholder="Логин"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400" />
          <input type="password" value={loginForm.password} onChange={e => setLoginForm(p => ({...p, password: e.target.value}))}
            required placeholder="Пароль"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400" />
          <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90"
            style={{ background: "#3ca615" }}>
            Войти
          </button>
        </form>
      </div>
    </div>
  );

  // Детали заявки
  if (selectedTicket) return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos flex flex-col max-w-lg mx-auto">
      <Helmet><title>Заявка #{selectedTicket.id} — ProFiX</title></Helmet>
      <TicketDetail
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        onRefresh={t => setSelectedTicket(t)}
      />
    </div>
  );

  // Главный экран
  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos flex flex-col max-w-lg mx-auto">
      <Helmet><title>ProFiX Менеджер</title></Helmet>

      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center gap-3">
          <img src="https://cdn.poehali.dev/files/14883a12-7574-4223-bfd4-68dc3e490534.png"
            alt="" className="w-7 h-7 object-contain" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 leading-none">{manager?.name}</p>
            <p className="text-[10px] text-gray-400 capitalize">{manager?.role}</p>
          </div>
          {fixiesBalance !== null && (
            <button onClick={() => setShowFixies(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#edf7e8] text-[#3ca615] text-xs font-bold hover:bg-green-100 transition-colors">
              💰{fixiesBalance}
            </button>
          )}
          <button onClick={() => { managerSession.clear(); setLoggedIn(false); setManager(null); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <Icon name="LogOut" size={18} />
          </button>
        </div>
        {/* Панель фиксиков */}
        {showFixies && (
          <div className="px-4 py-3 border-t border-gray-50 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">
                💰 Мои фиксики
                {tariffInfo?.name && <span className="ml-2 font-normal text-gray-400">({tariffInfo.name})</span>}
              </span>
              <span className={`text-sm font-bold ${(fixiesBalance||0)>=0?"text-[#3ca615]":"text-red-500"}`}>
                {(fixiesBalance||0)>=0?"+":""}{fixiesBalance}
              </span>
            </div>
            {tariffInfo?.speed_tiers && (
              <div className="flex flex-wrap gap-1 mb-2">
                {tariffInfo.speed_tiers.map((t,i) => (
                  <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">⚡&lt;{t.hours}ч → +{t.fixies}💰</span>
                ))}
              </div>
            )}
            {fixiesHistory.slice(0,5).map((tx, i) => (
              <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-gray-100 last:border-0">
                <span className={`font-bold w-8 text-right shrink-0 ${tx.amount>=0?"text-[#3ca615]":"text-red-500"}`}>{tx.amount>=0?"+":""}{tx.amount}</span>
                <span className="flex-1 text-gray-500 truncate">{tx.reason}</span>
                <span className="text-gray-400 shrink-0">{new Date(tx.created_at).toLocaleDateString("ru-RU",{day:"2-digit",month:"short"})}</span>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Таббар */}
      <div className="bg-white border-b border-gray-100 flex">
        {[
          { key: "tickets", label: "Заявки", icon: "Ticket" },
          { key: "new", label: "Создать", icon: "Plus" },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 relative ${tab === t.key ? "border-[#3ca615] text-[#3ca615]" : "border-transparent text-gray-500"}`}>
            <Icon name={t.icon as "Ticket"} size={17} />
            {t.label}
            {t.key === "tickets" && notifBadge > 0 && (
              <span className="absolute top-1.5 right-1/4 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {notifBadge > 9 ? "9+" : notifBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Заявки */}
      {tab === "tickets" && (
        <div className="flex-1 flex flex-col">
          {/* Фильтры */}
          <div className="flex gap-2 px-4 py-3 overflow-x-auto">
            {[
              { key: "active", label: "Активные" },
              { key: "all", label: "Все" },
              { key: "done", label: "Выполненные" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-medium border transition-colors ${filter === f.key ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-200"}`}
                style={filter === f.key ? { background: "#3ca615" } : {}}>
                {f.label}
              </button>
            ))}
            <button onClick={loadTickets} className="shrink-0 p-1.5 ml-auto text-gray-400 hover:text-gray-600">
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {filteredTickets.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Icon name="Inbox" size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Заявок нет</p>
                </div>
              )}
              {filteredTickets.map(t => (
                <div key={t.id} onClick={() => setSelectedTicket(t)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-green-200 hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400">#{t.id}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-500"}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <span className="font-medium text-gray-600">{t.client_name || "—"}</span>
                    {t.technician_name && <span>→ {t.technician_name}</span>}
                    {(t.comments?.length || 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Icon name="MessageSquare" size={11} />
                        {t.comments?.length}
                      </span>
                    )}
                    <span className="ml-auto">
                      {new Date(t.created_at).toLocaleDateString("ru-RU", { day:"2-digit", month:"2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Создать заявку */}
      {tab === "new" && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Новая заявка</h3>
              {[
                { key: "name", label: "Имя клиента", placeholder: "Иван Петров" },
                { key: "phone", label: "Телефон", placeholder: "+7 (___) ___-__-__" },
                { key: "title", label: "Тема *", placeholder: "Кратко опишите проблему" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                  <input
                    value={newTicket[f.key as keyof typeof newTicket]}
                    onChange={e => setNewTicket(p => ({...p, [f.key]: e.target.value}))}
                    placeholder={f.placeholder} required={f.key === "title"}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Описание</label>
                <textarea value={newTicket.description} onChange={e => setNewTicket(p => ({...p, description: e.target.value}))}
                  rows={3} placeholder="Подробное описание..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none" />
              </div>
            </div>
            <button type="submit" disabled={creating || !newTicket.title}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 hover:opacity-90"
              style={{ background: "#3ca615" }}>
              {creating ? "Создаю..." : "Создать заявку"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}