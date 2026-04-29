import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import Icon from "@/components/ui/icon";
import { managerApi, managerSession, Ticket, STATUS_COLORS } from "@/lib/crm-api";

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

// ── Детальный вид заявки ──────────────────────────────────────────────────────
function TicketDetail({ ticket, onBack, onRefresh }: {
  ticket: Ticket; onBack: () => void; onRefresh: (t: Ticket) => void;
}) {
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);

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
          <button onClick={() => { managerSession.clear(); setLoggedIn(false); setManager(null); }}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <Icon name="LogOut" size={18} />
          </button>
        </div>
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