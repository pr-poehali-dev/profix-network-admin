import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { internalChatApi } from "@/lib/internal-chat-api";

interface Contact {
  id: number;
  name: string;
  phone?: string;
  role: string;
  unread: number;
}

interface Message {
  id: number;
  from_role?: string;
  from_id?: number;
  from?: string;
  text: string;
  created_at?: string;
  time?: string;
  read?: boolean;
}

interface ClientSession {
  session_id: string;
  created_at: string;
  updated_at: string;
  last_msg: string;
  msg_count: number;
  unread: number;
}

interface Props {
  token: string;
  role: "manager" | "technician";
  userId: number;
  userName: string;
}

export default function AdminNotificationPanel({ token, role, userId, userName }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"internal" | "clients">("internal");
  const [totalUnread, setTotalUnread] = useState(0);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [clientSessions, setClientSessions] = useState<ClientSession[]>([]);
  const [activeSession, setActiveSession] = useState<ClientSession | null>(null);
  const [clientMessages, setClientMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const afterIdRef = useRef(0);
  const clientAfterIdRef = useRef(0);

  // Drag-to-move
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Начальная позиция при открытии — справа сверху
  useEffect(() => {
    if (open && pos === null) {
      setPos({ x: window.innerWidth - 420, y: 80 });
    }
  }, [open]);

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    const cur = pos ?? { x: window.innerWidth - 420, y: 80 };
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: cur.x, initY: cur.y };

    function onMove(ev: MouseEvent) {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const nx = Math.max(0, Math.min(window.innerWidth - 400, dragRef.current.initX + dx));
      const ny = Math.max(0, Math.min(window.innerHeight - 100, dragRef.current.initY + dy));
      setPos({ x: nx, y: ny });
    }
    function onUp() {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  const scrollBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  // Polling count
  const pollCount = useCallback(async () => {
    try {
      const r = await internalChatApi.notifyCount(token);
      setTotalUnread(r.total ?? 0);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    pollCount();
    pollRef.current = setInterval(pollCount, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollCount]);

  // Загрузить контакты
  async function loadContacts() {
    const r = await internalChatApi.getContacts(token);
    setContacts(r.contacts ?? []);
  }

  // Загрузить клиентские сессии
  async function loadClientSessions() {
    const r = await internalChatApi.getClientSessions(token);
    setClientSessions(r.sessions ?? []);
  }

  function handleOpen() {
    setOpen(true);
    loadContacts();
    if (role === "manager") loadClientSessions();
  }

  // Открыть диалог с контактом
  async function openContact(c: Contact) {
    setActiveContact(c);
    setMessages([]);
    afterIdRef.current = 0;
    const r = await internalChatApi.getHistory(token, c.role, c.id);
    const msgs: Message[] = r.messages ?? [];
    setMessages(msgs);
    if (msgs.length) afterIdRef.current = msgs[msgs.length - 1].id;
    scrollBottom();
    // Обновить счётчик в контакте
    setContacts(prev => prev.map(p => p.id === c.id ? { ...p, unread: 0 } : p));
    pollCount();
  }

  // Открыть клиентскую сессию
  async function openClientSession(s: ClientSession) {
    setActiveSession(s);
    setClientMessages([]);
    clientAfterIdRef.current = 0;
    const r = await internalChatApi.getClientHistory(token, s.session_id);
    const msgs: Message[] = r.messages ?? [];
    setClientMessages(msgs);
    if (msgs.length) clientAfterIdRef.current = msgs[msgs.length - 1].id;
    scrollBottom();
    setClientSessions(prev => prev.map(p => p.session_id === s.session_id ? { ...p, unread: 0 } : p));
  }

  // Polling новых сообщений в открытом диалоге
  useEffect(() => {
    if (!activeContact) return;
    const t = setInterval(async () => {
      try {
        const r = await internalChatApi.getHistory(token, activeContact.role, activeContact.id, afterIdRef.current);
        const newMsgs: Message[] = r.messages ?? [];
        if (newMsgs.length) {
          setMessages(prev => [...prev, ...newMsgs]);
          afterIdRef.current = newMsgs[newMsgs.length - 1].id;
          scrollBottom();
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(t);
  }, [activeContact, token]);

  useEffect(() => {
    if (!activeSession) return;
    const t = setInterval(async () => {
      try {
        const r = await internalChatApi.getClientHistory(token, activeSession.session_id, clientAfterIdRef.current);
        const newMsgs: Message[] = r.messages ?? [];
        if (newMsgs.length) {
          setClientMessages(prev => [...prev, ...newMsgs]);
          clientAfterIdRef.current = newMsgs[newMsgs.length - 1].id;
          scrollBottom();
        }
      } catch { /* ignore */ }
    }, 4000);
    return () => clearInterval(t);
  }, [activeSession, token]);

  async function sendInternal() {
    if (!text.trim() || !activeContact || sending) return;
    setSending(true);
    const t = text.trim();
    setText("");
    await internalChatApi.sendInternal(token, activeContact.role, activeContact.id, t);
    // Добавить оптимистично
    const newMsg: Message = {
      id: Date.now(), from_role: role, from_id: userId,
      text: t, created_at: new Date().toISOString(), read: false
    };
    setMessages(prev => [...prev, newMsg]);
    scrollBottom();
    setSending(false);
  }

  async function sendReply() {
    if (!text.trim() || !activeSession || sending) return;
    setSending(true);
    const t = text.trim();
    setText("");
    const r = await internalChatApi.replyClient(token, activeSession.session_id, t);
    const newMsg: Message = { id: r.id ?? Date.now(), from: "operator", text: t, time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) };
    setClientMessages(prev => [...prev, newMsg]);
    scrollBottom();
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (activeContact) sendInternal();
      else if (activeSession) sendReply();
    }
  }

  const totalClientUnread = clientSessions.reduce((s, c) => s + (c.unread || 0), 0);
  const totalInternalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  return (
    <div className="relative">
      {/* Кнопка колокольчика */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/10 transition-colors"
        title="Уведомления и чат"
      >
        <Icon name="Bell" size={19} className="text-gray-300" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center px-0.5">
            <span className="text-white text-[9px] font-bold leading-none">{totalUnread > 99 ? "99+" : totalUnread}</span>
          </span>
        )}
      </button>

      {/* Панель — fixed + draggable */}
      {open && pos && (
        <div
          ref={panelRef}
          className="fixed w-[340px] sm:w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] flex flex-col overflow-hidden"
          style={{ left: pos.x, top: pos.y, maxHeight: "80vh", minHeight: "400px" }}
        >
          {/* Заголовок — drag handle */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-[#111827] cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onDragStart}
          >
            {activeContact ? (
              <div className="flex items-center gap-2">
                <button onMouseDown={e => e.stopPropagation()} onClick={() => { setActiveContact(null); setMessages([]); }} className="text-gray-400 hover:text-white p-1">
                  <Icon name="ChevronLeft" size={16} />
                </button>
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                  {activeContact.name[0]}
                </div>
                <span className="text-white text-sm font-medium">{activeContact.name}</span>
              </div>
            ) : activeSession ? (
              <div className="flex items-center gap-2">
                <button onMouseDown={e => e.stopPropagation()} onClick={() => { setActiveSession(null); setClientMessages([]); }} className="text-gray-400 hover:text-white p-1">
                  <Icon name="ChevronLeft" size={16} />
                </button>
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  К
                </div>
                <span className="text-white text-sm font-medium truncate">
                  {activeSession.session_id.slice(0, 8)}...
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Icon name="GripHorizontal" size={14} className="text-gray-500" />
                <span className="text-white font-semibold text-sm">Уведомления и чат</span>
              </div>
            )}
            <button onMouseDown={e => e.stopPropagation()} onClick={() => setOpen(false)} className="text-gray-400 hover:text-white p-1">
              <Icon name="X" size={16} />
            </button>
          </div>

          {/* Табы (только на главном экране) */}
          {!activeContact && !activeSession && (
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setTab("internal")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${tab === "internal" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Icon name="MessageSquare" size={14} />
                Команда
                {totalInternalUnread > 0 && <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full">{totalInternalUnread}</span>}
              </button>
              {role === "manager" && (
                <button
                  onClick={() => setTab("clients")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${tab === "clients" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                >
                  <Icon name="Users" size={14} />
                  Клиенты
                  {totalClientUnread > 0 && <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full">{totalClientUnread}</span>}
                </button>
              )}
            </div>
          )}

          {/* Список контактов */}
          {!activeContact && !activeSession && tab === "internal" && (
            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Icon name="Users" size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">{role === "manager" ? "Нет активных специалистов" : "Нет менеджеров"}</p>
                </div>
              ) : contacts.map(c => (
                <button key={c.id} onClick={() => openContact(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-bold shrink-0">
                      {c.name[0]}
                    </div>
                    {c.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">{c.unread}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.role === "technician" ? "Специалист" : "Менеджер"}</p>
                  </div>
                  <Icon name="ChevronRight" size={14} className="text-gray-300" />
                </button>
              ))}
            </div>
          )}

          {/* Список клиентских сессий */}
          {!activeContact && !activeSession && tab === "clients" && role === "manager" && (
            <div className="flex-1 overflow-y-auto">
              {clientSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Icon name="MessageCircle" size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">Нет диалогов с клиентами</p>
                </div>
              ) : clientSessions.map(s => (
                <button key={s.session_id} onClick={() => openClientSession(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                      <Icon name="User" size={16} />
                    </div>
                    {s.unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[9px] font-bold">{s.unread}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-xs font-mono text-gray-500 mb-0.5">{s.session_id.slice(0, 12)}...</p>
                    <p className="text-sm text-gray-700 truncate">{s.last_msg || "—"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-gray-400">{s.updated_at ? new Date(s.updated_at).toLocaleDateString("ru-RU", {day:"2-digit",month:"2-digit"}) : ""}</p>
                    <p className="text-[10px] text-gray-400">{s.msg_count} сообщ.</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* История внутреннего чата */}
          {activeContact && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-6">Начните диалог</div>
                )}
                {messages.map(m => {
                  const isMine = m.from_role === role && m.from_id === userId;
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMine ? "bg-green-500 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm"}`}>
                        <p>{m.text}</p>
                        <p className={`text-[10px] mt-0.5 ${isMine ? "text-green-100" : "text-gray-400"}`}>
                          {m.created_at ? new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 px-3 py-2.5 border-t border-gray-100">
                <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Сообщение... (Enter — отправить)"
                  rows={1} className="flex-1 resize-none px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400" />
                <button onClick={sendInternal} disabled={!text.trim() || sending}
                  className="w-9 h-9 self-end bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 disabled:opacity-40 transition-colors">
                  <Icon name="Send" size={15} />
                </button>
              </div>
            </>
          )}

          {/* История клиентского чата */}
          {activeSession && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-50">
                {clientMessages.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-6">Нет сообщений</div>
                )}
                {clientMessages.map(m => {
                  const isMine = m.from === "operator";
                  return (
                    <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${isMine ? "bg-blue-500 text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm shadow-sm"}`}>
                        {!isMine && <p className="text-[10px] font-semibold mb-0.5 opacity-60">Клиент</p>}
                        <p>{m.text}</p>
                        <p className={`text-[10px] mt-0.5 ${isMine ? "text-blue-100" : "text-gray-400"}`}>{m.time}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2 px-3 py-2.5 border-t border-gray-100">
                <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Ответить клиенту..."
                  rows={1} className="flex-1 resize-none px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400" />
                <button onClick={sendReply} disabled={!text.trim() || sending}
                  className="w-9 h-9 self-end bg-blue-500 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 transition-colors">
                  <Icon name="Send" size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}