import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { managerSession } from "@/lib/crm-api";
import { tgStaffApi, TechContact, TgMessage } from "@/lib/tg-staff-api";

function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

export default function AdminTgChat() {
  const token = managerSession.get()!;

  const [techs, setTechs] = useState<TechContact[]>([]);
  const [activeTech, setActiveTech] = useState<TechContact | null>(null);
  const [messages, setMessages] = useState<TgMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkPopup, setLinkPopup] = useState<{ techId: number; link: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [search, setSearch] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTechs = useCallback(async () => {
    const res = await tgStaffApi.list(token);
    if (res.techs) setTechs(res.techs);
    setLoadingTechs(false);
  }, [token]);

  useEffect(() => {
    loadTechs();
  }, [loadTechs]);

  const loadHistory = useCallback(async (techId: number, afterId = 0) => {
    if (afterId === 0) setLoadingMsgs(true);
    const res = await tgStaffApi.history(token, techId, afterId);
    if (res.messages?.length) {
      if (afterId === 0) {
        setMessages(res.messages);
        lastMsgIdRef.current = res.messages[res.messages.length - 1].id;
      } else {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          const newMsgs = res.messages.filter(m => !ids.has(m.id));
          if (newMsgs.length) {
            lastMsgIdRef.current = newMsgs[newMsgs.length - 1].id;
            // Обновляем счётчик unread в списке спецов
            setTechs(prev => prev.map(t => t.id === techId ? { ...t, unread: 0 } : t));
          }
          return [...prev, ...newMsgs];
        });
      }
    }
    setLoadingMsgs(false);
  }, [token]);

  // Скролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling новых сообщений
  useEffect(() => {
    if (!activeTech) { if (pollRef.current) clearInterval(pollRef.current); return; }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      loadHistory(activeTech.id, lastMsgIdRef.current);
      loadTechs(); // обновляем счётчики
    }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTech, loadHistory, loadTechs]);

  function selectTech(tech: TechContact) {
    setActiveTech(tech);
    setMessages([]);
    lastMsgIdRef.current = 0;
    setText("");
    loadHistory(tech.id, 0);
    // Сбрасываем unread локально
    setTechs(prev => prev.map(t => t.id === tech.id ? { ...t, unread: 0 } : t));
  }

  async function handleSend() {
    if (!activeTech || !text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    setText("");
    const res = await tgStaffApi.send(token, activeTech.id, msgText);
    if (res.sent) {
      await loadHistory(activeTech.id, lastMsgIdRef.current);
    }
    setSending(false);
  }

  async function handleGetLink(tech: TechContact) {
    setLinkLoading(true);
    const res = await tgStaffApi.getLink(token, tech.id);
    setLinkLoading(false);
    if (res.link) {
      setLinkPopup({ techId: tech.id, link: res.link });
    } else {
      alert(res.error || "Не удалось получить ссылку. Пусть специалист сначала войдёт в портал.");
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const filtered = techs.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.phone || "").includes(search)
  );

  // Группировка сообщений по дате
  const grouped: { date: string; msgs: TgMessage[] }[] = [];
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (!grouped.length || grouped[grouped.length - 1].date !== d) {
      grouped.push({ date: d, msgs: [msg] });
    } else {
      grouped[grouped.length - 1].msgs.push(msg);
    }
  }

  return (
    <div className="flex h-full min-h-0" style={{ height: "calc(100vh - 64px)" }}>
      {/* ── Список специалистов ────────────────────────────────────────────── */}
      <div className="w-72 shrink-0 border-r border-gray-100 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Icon name="MessageCircle" size={18} className="text-[#3ca615]" />
            Чат со спецами
            <span className="ml-auto text-xs font-normal text-gray-400 flex items-center gap-1">
              <Icon name="Send" size={11} />Telegram
            </span>
          </h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск специалиста..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingTechs ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="Loader2" size={24} className="animate-spin text-gray-300" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm px-4">Специалисты не найдены</div>
          ) : (
            filtered.map(tech => {
              const isActive = activeTech?.id === tech.id;
              const hasTg = !!tech.tg_chat_id;
              return (
                <button key={tech.id} onClick={() => selectTech(tech)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${isActive ? "bg-[#edf7e8] border-l-2 border-l-[#3ca615]" : ""}`}>
                  {/* Аватар */}
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${hasTg ? "bg-[#3ca615]" : "bg-gray-300"}`}>
                      {tech.name.charAt(0).toUpperCase()}
                    </div>
                    {hasTg && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Icon name="Send" size={8} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900 truncate">{tech.name}</span>
                      {tech.last_at && <span className="text-[10px] text-gray-400 shrink-0 ml-1">{timeAgo(tech.last_at)}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      {tech.last_text ? (
                        <p className="text-xs text-gray-400 truncate flex-1">{tech.last_text}</p>
                      ) : (
                        <p className="text-xs text-gray-300 italic">{hasTg ? "Нет сообщений" : "Telegram не привязан"}</p>
                      )}
                      {tech.unread > 0 && (
                        <span className="ml-1 shrink-0 w-5 h-5 bg-[#3ca615] rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                          {tech.unread > 9 ? "9+" : tech.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Область чата ───────────────────────────────────────────────────── */}
      {activeTech ? (
        <div className="flex-1 flex flex-col min-w-0 bg-[#F7F9FC]">
          {/* Шапка */}
          <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 shrink-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${activeTech.tg_chat_id ? "bg-[#3ca615]" : "bg-gray-300"}`}>
              {activeTech.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{activeTech.name}</p>
              <p className="text-xs text-gray-400">
                {activeTech.tg_chat_id
                  ? <><span className="text-blue-500">●</span> Telegram привязан{activeTech.tg_username ? ` (@${activeTech.tg_username})` : ""}</>
                  : <><span className="text-gray-300">●</span> Telegram не привязан</>
                }
              </p>
            </div>
            {/* Кнопка привязки Telegram */}
            {!activeTech.tg_chat_id && (
              <button
                onClick={() => handleGetLink(activeTech)}
                disabled={linkLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-colors border border-blue-200"
              >
                {linkLoading
                  ? <Icon name="Loader2" size={13} className="animate-spin" />
                  : <Icon name="Link" size={13} />
                }
                Привязать Telegram
              </button>
            )}
            <button onClick={loadTechs} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
              <Icon name="RefreshCw" size={15} />
            </button>
          </div>

          {/* Попап ссылки привязки */}
          {linkPopup && (
            <div className="mx-4 mt-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Icon name="Link" size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-800 mb-1">Ссылка для привязки Telegram</p>
                  <p className="text-xs text-blue-600 mb-2">Отправьте эту ссылку специалисту {activeTech.name}. Он должен перейти по ней и нажать /start в боте.</p>
                  <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-blue-200">
                    <code className="text-xs text-gray-700 flex-1 truncate">{linkPopup.link}</code>
                    <button onClick={() => copyLink(linkPopup.link)}
                      className="shrink-0 text-blue-500 hover:text-blue-700 transition-colors">
                      <Icon name={copiedLink ? "Check" : "Copy"} size={14} />
                    </button>
                  </div>
                </div>
                <button onClick={() => setLinkPopup(null)} className="text-gray-400 hover:text-gray-600">
                  <Icon name="X" size={15} />
                </button>
              </div>
            </div>
          )}

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {loadingMsgs ? (
              <div className="flex items-center justify-center py-12">
                <Icon name="Loader2" size={24} className="animate-spin text-gray-300" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Icon name="MessageCircle" size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Нет сообщений</p>
                {!activeTech.tg_chat_id && (
                  <p className="text-xs mt-1">Сначала привяжите Telegram специалиста</p>
                )}
              </div>
            ) : (
              grouped.map(group => (
                <div key={group.date}>
                  {/* Разделитель даты */}
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-gray-400 font-medium px-2">{group.date}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {group.msgs.map(msg => {
                    const isManager = msg.from_role === "manager";
                    return (
                      <div key={msg.id} className={`flex mb-2 ${isManager ? "justify-end" : "justify-start"}`}>
                        {!isManager && (
                          <div className="w-7 h-7 rounded-full bg-[#3ca615] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1">
                            {activeTech.name.charAt(0)}
                          </div>
                        )}
                        <div className={`max-w-[70%] ${isManager ? "items-end" : "items-start"} flex flex-col`}>
                          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            isManager
                              ? "bg-[#3ca615] text-white rounded-br-sm"
                              : "bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm"
                          }`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1 mt-0.5 ${isManager ? "flex-row-reverse" : ""}`}>
                            <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                            {isManager && (
                              <Icon name={msg.tg_message_id ? "CheckCheck" : "Check"} size={11} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
            {!activeTech.tg_chat_id ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 rounded-2xl border border-amber-200">
                <Icon name="AlertCircle" size={16} className="text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">Telegram не привязан — нажмите «Привязать Telegram» вверху</p>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Написать ${activeTech.name}...`}
                  rows={1}
                  className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] resize-none"
                  style={{ maxHeight: 120, overflowY: "auto" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-all shrink-0"
                  style={{ background: "#3ca615" }}
                >
                  {sending
                    ? <Icon name="Loader2" size={16} className="animate-spin" />
                    : <Icon name="Send" size={16} />
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Пустой экран */
        <div className="flex-1 flex items-center justify-center bg-[#F7F9FC]">
          <div className="text-center">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-md flex items-center justify-center mx-auto mb-4">
              <Icon name="MessageCircle" size={36} className="text-[#3ca615]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Чат со специалистами</h3>
            <p className="text-sm text-gray-400 max-w-xs">
              Выберите специалиста слева, чтобы начать переписку через Telegram
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Icon name="Send" size={12} className="text-blue-400" />
              Сообщения доставляются в Telegram специалиста
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
