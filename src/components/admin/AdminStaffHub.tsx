import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { managerSession } from "@/lib/crm-api";
import { tgStaffApi, TechContact, TgMessage, StaffTask } from "@/lib/tg-staff-api";

// ── утилиты ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = new Date(iso), now = new Date();
  const s = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "только что";
  if (s < 3600) return `${Math.floor(s / 60)} мин`;
  if (s < 86400) return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" }); }
function fmtShort(iso: string) { return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }); }
function isOverdue(due: string | null) { return due ? new Date(due) < new Date() : false; }
function isToday(due: string | null) {
  if (!due) return false;
  const d = new Date(due), n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
}
function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-100 text-red-700", high: "bg-orange-100 text-orange-700",
  normal: "bg-blue-50 text-blue-600", low: "bg-gray-100 text-gray-500",
};
const PRIORITY_LABEL: Record<string, string> = { urgent:"Срочно", high:"Высокий", normal:"Норм.", low:"Низкий" };
const STATUS_BADGE: Record<string, string> = {
  open:"bg-yellow-50 text-yellow-700", in_progress:"bg-blue-50 text-blue-700",
  done:"bg-green-50 text-green-700", cancelled:"bg-gray-100 text-gray-500",
};
const STATUS_LABEL: Record<string, string> = { open:"Открыта", in_progress:"В работе", done:"Закрыта", cancelled:"Отменена" };
const SCHEDULE_TYPE: Record<string, { label: string; color: string }> = {
  work:     { label:"Работает",   color:"bg-green-100 text-green-700" },
  day_off:  { label:"Выходной",   color:"bg-gray-200 text-gray-600" },
  sick:     { label:"Больничный", color:"bg-orange-100 text-orange-700" },
  vacation: { label:"Отпуск",     color:"bg-blue-100 text-blue-700" },
  training: { label:"Обучение",   color:"bg-purple-100 text-purple-700" },
};

const TABS = [
  { k: "chat",     l: "Чат",      icon: "MessageCircle" },
  { k: "tasks",    l: "Задачи",   icon: "CheckSquare" },
  { k: "fixies",   l: "Фиксики",  icon: "Star" },
  { k: "schedule", l: "График",   icon: "Calendar" },
  { k: "contacts", l: "Контакты", icon: "Users" },
];

export default function AdminStaffHub() {
  const token = managerSession.get()!;
  const [activeTab, setActiveTab] = useState("chat");

  const [techs, setTechs]     = useState<TechContact[]>([]);
  const [loadingTechs, setLT] = useState(true);

  // ── Чат ──────────────────────────────────────────────────────────────────
  const [activeTech, setActiveTech]   = useState<TechContact | null>(null);
  const [messages, setMessages]       = useState<TgMessage[]>([]);
  const [chatText, setChatText]       = useState("");
  const [sending, setSending]         = useState(false);
  const [loadingMsgs, setLM]          = useState(false);
  const [linkPopup, setLinkPopup]     = useState<string | null>(null);
  const [linkLoading, setLL]          = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);
  const [chatSearch, setChatSearch]   = useState("");
  const [pendingFile, setPendingFile] = useState<{ b64: string; name: string; mime: string; preview?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef   = useRef(0);
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  // ── Задачи ────────────────────────────────────────────────────────────────
  const [tasks, setTasks]               = useState<StaffTask[]>([]);
  const [taskFilter, setTaskFilter]     = useState("open");
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [taskLogs, setTaskLogs]         = useState<Record<number, {id:number;author_name:string;action:string;text:string;created_at:string}[]>>({});
  const [showNewTask, setShowNewTask]   = useState(false);
  const [newTask, setNewTask]           = useState({ title:"", description:"", assigned_to:0, due_at:"", priority:"normal", fixies_reward:10 });
  const [showExtend, setShowExtend]     = useState<number | null>(null);
  const [extendDate, setExtendDate]     = useState("");
  const [extendComment, setExtendComment] = useState("");

  // ── Фиксики ───────────────────────────────────────────────────────────────
  const [fixieTechs, setFixieTechs]     = useState<{id:number;name:string;balance:number;is_active:boolean}[]>([]);
  const [fixieHistory, setFixieHistory] = useState<Record<number, {id:number;amount:number;reason:string;created_at:string}[]>>({});
  const [expandedFixie, setExpandedFixie] = useState<number | null>(null);
  const [showAddFixie, setShowAddFixie]   = useState<number | null>(null);
  const [fixieAmount, setFixieAmount]     = useState("");
  const [fixieReason, setFixieReason]     = useState("");
  const [totalFixies, setTotalFixies]     = useState(0);

  // ── График ────────────────────────────────────────────────────────────────
  const now = new Date();
  const [schedYear, setSchedYear]   = useState(now.getFullYear());
  const [schedMonth, setSchedMonth] = useState(now.getMonth() + 1);
  const [schedule, setSchedule]     = useState<{tech_id:number;name:string;date:string;type:string;note:string}[]>([]);
  const [schedCell, setSchedCell]   = useState<{tech_id:number;date:string}|null>(null);
  const [schedType, setSchedType]   = useState("day_off");
  const [schedNote, setSchedNote]   = useState("");

  // ── Контакты ──────────────────────────────────────────────────────────────
  const [contacts, setContacts]       = useState<TechContact[]>([]);
  const [editContact, setEditContact] = useState<TechContact | null>(null);
  const [editDept, setEditDept]       = useState("");
  const [editPos, setEditPos]         = useState("");
  const [editEmail, setEditEmail]     = useState("");
  const [editTg, setEditTg]           = useState("");
  const [editVk, setEditVk]           = useState("");
  const [editNotes, setEditNotes]     = useState("");

  // ── Загрузка ──────────────────────────────────────────────────────────────
  const loadTechs = useCallback(async () => {
    const res = await tgStaffApi.list(token);
    if (res.techs) { setTechs(res.techs); setLT(false); }
  }, [token]);

  useEffect(() => { loadTechs(); }, [loadTechs]);

  const loadHistory = useCallback(async (techId: number, afterId = 0) => {
    if (afterId === 0) setLM(true);
    const res = await tgStaffApi.history(token, techId, afterId);
    if (res.messages?.length) {
      if (afterId === 0) {
        setMessages(res.messages);
        lastMsgIdRef.current = res.messages[res.messages.length - 1].id;
      } else {
        setMessages(prev => {
          const ids = new Set(prev.map((m: TgMessage) => m.id));
          const nm = res.messages.filter((m: TgMessage) => !ids.has(m.id));
          if (nm.length) lastMsgIdRef.current = nm[nm.length - 1].id;
          return [...prev, ...nm];
        });
        setTechs(prev => prev.map(t => t.id === techId ? { ...t, unread: 0 } : t));
      }
    }
    setLM(false);
  }, [token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!activeTech || activeTab !== "chat") { if (pollRef.current) clearInterval(pollRef.current); return; }
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { loadHistory(activeTech.id, lastMsgIdRef.current); loadTechs(); }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTech, activeTab, loadHistory, loadTechs]);

  function selectTech(tech: TechContact) {
    setActiveTech(tech); setMessages([]); lastMsgIdRef.current = 0; setChatText(""); setPendingFile(null);
    loadHistory(tech.id, 0);
    setTechs(prev => prev.map(t => t.id === tech.id ? { ...t, unread: 0 } : t));
  }

  async function handleSend() {
    if (!activeTech || (!chatText.trim() && !pendingFile) || sending) return;
    setSending(true);
    await tgStaffApi.send(token, activeTech.id, chatText.trim(), pendingFile || undefined);
    setChatText(""); setPendingFile(null);
    await loadHistory(activeTech.id, lastMsgIdRef.current);
    setSending(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      setPendingFile({ b64, name: file.name, mime: file.type, preview: file.type.startsWith("image/") ? ev.target?.result as string : undefined });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function getLink(tech: TechContact) {
    setLL(true);
    const res = await tgStaffApi.getLink(token, tech.id);
    setLL(false);
    if (res.link) setLinkPopup(res.link);
    else alert(res.error || "Войдите в портал специалиста сначала");
  }

  // ── Задачи ────────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setLoadingTasks(true);
    const p: Record<string, string> = taskFilter === "all" ? {} : taskFilter === "overdue" ? { status: "overdue" } : { status: taskFilter };
    const res = await tgStaffApi.tasks(token, p);
    if (res.tasks) setTasks(res.tasks);
    setLoadingTasks(false);
  }, [token, taskFilter]);

  useEffect(() => { if (activeTab === "tasks") loadTasks(); }, [activeTab, loadTasks]);

  async function createTask() {
    if (!newTask.title || !newTask.assigned_to) return;
    await tgStaffApi.taskCreate(token, newTask);
    setShowNewTask(false);
    setNewTask({ title:"", description:"", assigned_to:0, due_at:"", priority:"normal", fixies_reward:10 });
    loadTasks();
  }

  async function extendTask(taskId: number) {
    if (!extendDate) return;
    await tgStaffApi.taskUpdate(token, { task_id: taskId, due_at: extendDate, comment: extendComment, log_action: "extend" });
    setShowExtend(null); setExtendDate(""); setExtendComment(""); loadTasks();
  }

  async function penaltyTask(taskId: number) {
    const amt = prompt("Размер штрафа (фиксиков):", "5"); if (!amt) return;
    const reason = prompt("Причина:") || "";
    await tgStaffApi.taskUpdate(token, { task_id: taskId, penalty: parseInt(amt), comment: reason, log_action: "penalty" });
    loadTasks();
  }

  async function closeTask(taskId: number, cancel = false) {
    const comment = prompt(cancel ? "Причина отмены:" : "Комментарий:") ?? "";
    await tgStaffApi.taskUpdate(token, { task_id: taskId, status: cancel ? "cancelled" : "done", comment, log_action: "close" });
    loadTasks();
  }

  async function toggleTaskLogs(taskId: number) {
    if (expandedTask === taskId) { setExpandedTask(null); return; }
    setExpandedTask(taskId);
    if (!taskLogs[taskId]) {
      const res = await tgStaffApi.taskLogs(token, taskId);
      setTaskLogs(prev => ({ ...prev, [taskId]: res.logs || [] }));
    }
  }

  // ── Фиксики ────────────────────────────────────────────────────────────────
  const loadFixies = useCallback(async () => {
    const res = await tgStaffApi.fixies(token);
    if (res.techs) { setFixieTechs(res.techs); setTotalFixies(res.techs.reduce((s: number, t: {balance:number}) => s + (t.balance||0), 0)); }
  }, [token]);

  useEffect(() => { if (activeTab === "fixies") loadFixies(); }, [activeTab, loadFixies]);

  async function toggleFixieHistory(techId: number) {
    if (expandedFixie === techId) { setExpandedFixie(null); return; }
    setExpandedFixie(techId);
    if (!fixieHistory[techId]) {
      const res = await tgStaffApi.fixiesHistory(token, techId);
      setFixieHistory(prev => ({ ...prev, [techId]: res.transactions || [] }));
    }
  }

  async function addFixies() {
    if (!showAddFixie || !fixieAmount || !fixieReason) return;
    await tgStaffApi.fixiesAdd(token, { tech_id: showAddFixie, amount: parseInt(fixieAmount), reason: fixieReason });
    setShowAddFixie(null); setFixieAmount(""); setFixieReason(""); setFixieHistory({});
    loadFixies();
  }

  // ── График ────────────────────────────────────────────────────────────────
  const loadSchedule = useCallback(async () => {
    const res = await tgStaffApi.schedule(token, schedYear, schedMonth);
    if (res.schedule) setSchedule(res.schedule);
  }, [token, schedYear, schedMonth]);

  useEffect(() => { if (activeTab === "schedule") loadSchedule(); }, [activeTab, loadSchedule]);

  async function saveScheduleCell() {
    if (!schedCell) return;
    await tgStaffApi.scheduleSet(token, { tech_id: schedCell.tech_id, date: schedCell.date, type: schedType, note: schedNote });
    setSchedCell(null); setSchedNote(""); loadSchedule();
  }

  function getCell(techId: number, day: number) {
    const d = `${schedYear}-${String(schedMonth).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return schedule.find(s => s.tech_id === techId && s.date === d);
  }

  // ── Контакты ──────────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    const res = await tgStaffApi.contacts(token);
    if (res.contacts) setContacts(res.contacts);
  }, [token]);

  useEffect(() => { if (activeTab === "contacts") loadContacts(); }, [activeTab, loadContacts]);

  function openContactEdit(c: TechContact) {
    setEditContact(c); setEditDept(c.department||""); setEditPos(c.position||"");
    setEditEmail(c.email||""); setEditTg(c.c_tg||c.tg_username||"");
    setEditVk(c.vk_url||""); setEditNotes(c.notes||"");
  }

  async function saveContact() {
    if (!editContact) return;
    await tgStaffApi.contactSave(token, { tech_id: editContact.id, department: editDept, position: editPos, email: editEmail, tg_username: editTg, vk_url: editVk, notes: editNotes });
    setEditContact(null); loadContacts();
  }

  // ── Производные ───────────────────────────────────────────────────────────
  const chatFiltered = techs.filter(t => t.name.toLowerCase().includes(chatSearch.toLowerCase()) || (t.phone||"").includes(chatSearch));
  const groupedMsgs: { date: string; msgs: TgMessage[] }[] = [];
  for (const m of messages) {
    const d = fmtDate(m.created_at);
    if (!groupedMsgs.length || groupedMsgs[groupedMsgs.length-1].date !== d) groupedMsgs.push({ date: d, msgs: [m] });
    else groupedMsgs[groupedMsgs.length-1].msgs.push(m);
  }
  const depts = Array.from(new Set(contacts.map(c => c.department || "Без отдела")));
  const days = daysInMonth(schedYear, schedMonth);

  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      {/* Табы */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-100 shrink-0">
        {TABS.map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab===t.k ? "bg-[#3ca615] text-white" : "text-gray-500 hover:bg-gray-100"}`}>
            <Icon name={t.icon as "MessageCircle"} size={14} />{t.l}
          </button>
        ))}
        {activeTab==="tasks" && (
          <button onClick={() => setShowNewTask(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#3ca615] text-white">
            <Icon name="Plus" size={14} />Новая задача
          </button>
        )}
        {activeTab==="fixies" && (
          <span className="ml-auto text-xs text-gray-500 flex items-center gap-1">
            <Icon name="Star" size={12} className="text-yellow-500" />
            Всего: <b className="text-gray-900 ml-1">{totalFixies} фикс.</b>
          </span>
        )}
      </div>

      {/* ── ЧАТ ────────────────────────────────────────────────────────────── */}
      {activeTab==="chat" && (
        <div className="flex flex-1 min-h-0">
          <div className="w-64 shrink-0 border-r border-gray-100 flex flex-col bg-white">
            <div className="p-3 border-b border-gray-50">
              <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Поиск..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingTechs
                ? <div className="flex items-center justify-center py-10"><Icon name="Loader2" size={22} className="animate-spin text-gray-300" /></div>
                : chatFiltered.map(tech => {
                    const isAct = activeTech?.id === tech.id;
                    return (
                      <button key={tech.id} onClick={() => selectTech(tech)}
                        className={`w-full flex items-center gap-2.5 px-3 py-3 text-left border-b border-gray-50 transition-colors ${isAct ? "bg-[#edf7e8] border-l-2 border-l-[#3ca615]" : "hover:bg-gray-50"}`}>
                        <div className="relative shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${tech.tg_chat_id ? "bg-[#3ca615]" : "bg-gray-300"}`}>
                            {tech.name[0].toUpperCase()}
                          </div>
                          {tech.tg_chat_id && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center"><Icon name="Send" size={7} className="text-white" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900 truncate">{tech.name}</span>
                            {tech.last_at && <span className="text-[10px] text-gray-400 ml-1 shrink-0">{timeAgo(tech.last_at)}</span>}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className="text-xs text-gray-400 truncate flex-1">{tech.last_text || (tech.tg_chat_id ? "Нет сообщений" : "TG не привязан")}</p>
                            {tech.unread > 0 && <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">{tech.unread}</span>}
                            {tech.overdue > 0 && <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">!</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })
              }
            </div>
          </div>

          {activeTech ? (
            <div className="flex-1 flex flex-col min-w-0 bg-[#F7F9FC]">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${activeTech.tg_chat_id ? "bg-[#3ca615]" : "bg-gray-300"}`}>{activeTech.name[0].toUpperCase()}</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">{activeTech.name}</p>
                  <p className="text-xs text-gray-400">{activeTech.tg_chat_id ? <><span className="text-blue-400">●</span> TG: @{activeTech.tg_username||"привязан"}</> : "TG не привязан"}</p>
                </div>
                <div className="flex gap-1.5">
                  {activeTech.tg_chat_id && activeTech.tg_username && (
                    <a href={`https://t.me/${activeTech.tg_username}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100">
                      <Icon name="Send" size={12} />Открыть TG
                    </a>
                  )}
                  {!activeTech.tg_chat_id && (
                    <button onClick={() => getLink(activeTech)} disabled={linkLoading} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100">
                      {linkLoading ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Link" size={12} />}Привязать TG
                    </button>
                  )}
                  <span className="text-xs text-[#3ca615] font-bold bg-[#edf7e8] px-2 py-1.5 rounded-xl">💰{activeTech.fixies_balance}</span>
                </div>
              </div>
              {linkPopup && (
                <div className="mx-3 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2">
                  <code className="text-xs flex-1 truncate text-gray-700">{linkPopup}</code>
                  <button onClick={() => { navigator.clipboard.writeText(linkPopup); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }} className="text-blue-500"><Icon name={copiedLink ? "Check" : "Copy"} size={14} /></button>
                  <button onClick={() => setLinkPopup(null)} className="text-gray-400"><Icon name="X" size={14} /></button>
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {loadingMsgs
                  ? <div className="flex items-center justify-center py-10"><Icon name="Loader2" size={22} className="animate-spin text-gray-300" /></div>
                  : messages.length === 0
                  ? <div className="flex items-center justify-center h-full text-gray-400 text-sm flex-col gap-2"><Icon name="MessageCircle" size={36} className="opacity-20" />{activeTech.tg_chat_id ? "Нет сообщений" : "Привяжите Telegram"}</div>
                  : groupedMsgs.map(g => (
                      <div key={g.date}>
                        <div className="flex items-center gap-2 my-3"><div className="flex-1 h-px bg-gray-200"/><span className="text-[10px] text-gray-400">{g.date}</span><div className="flex-1 h-px bg-gray-200"/></div>
                        {g.msgs.map(m => (
                          <div key={m.id} className={`flex mb-2 ${m.from_role==="manager" ? "justify-end" : "justify-start"}`}>
                            {m.from_role!=="manager" && <div className="w-6 h-6 rounded-full bg-[#3ca615] flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-1.5 mt-1">{activeTech.name[0]}</div>}
                            <div className="max-w-[70%]" style={{ display:"flex", flexDirection:"column", alignItems: m.from_role==="manager" ? "flex-end" : "flex-start" }}>
                              {m.file_url && m.file_type==="image" && <img src={m.file_url} alt="" className="rounded-xl mb-1 max-w-[180px] cursor-pointer" onClick={() => window.open(m.file_url!, "_blank")} />}
                              {m.file_url && m.file_type==="file" && <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-xl mb-1"><Icon name="FileText" size={12} />{m.file_name}</a>}
                              {m.text && <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.from_role==="manager" ? "bg-[#3ca615] text-white rounded-br-sm" : "bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm"}`}>{m.text}</div>}
                              <span className="text-[10px] text-gray-400 mt-0.5">{fmtTime(m.created_at)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                }
                <div ref={messagesEndRef} />
              </div>
              {pendingFile && (
                <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-2">
                  {pendingFile.preview ? <img src={pendingFile.preview} className="w-10 h-10 rounded-lg object-cover" alt="" /> : <Icon name="FileText" size={22} className="text-gray-400" />}
                  <span className="text-xs text-gray-600 flex-1 truncate">{pendingFile.name}</span>
                  <button onClick={() => setPendingFile(null)} className="text-gray-400"><Icon name="X" size={14} /></button>
                </div>
              )}
              <div className="px-3 py-2.5 bg-white border-t border-gray-100 shrink-0">
                {!activeTech.tg_chat_id
                  ? <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-700"><Icon name="AlertCircle" size={14} className="shrink-0" />Telegram не привязан</div>
                  : <div className="flex items-end gap-2">
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                      <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-[#3ca615] transition-colors shrink-0"><Icon name="Paperclip" size={18} /></button>
                      <textarea value={chatText} onChange={e => setChatText(e.target.value)}
                        onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={`Написать ${activeTech.name}...`} rows={1}
                        className="flex-1 border border-gray-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615] resize-none" style={{ maxHeight: 100, overflowY: "auto" }} />
                      <button onClick={handleSend} disabled={(!chatText.trim() && !pendingFile) || sending}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-50 shrink-0" style={{ background: "#3ca615" }}>
                        {sending ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
                      </button>
                    </div>
                }
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#F7F9FC] flex-col gap-3 text-gray-400">
              <Icon name="MessageCircle" size={40} className="opacity-20" />
              <p className="text-sm">Выберите специалиста слева</p>
            </div>
          )}
        </div>
      )}

      {/* ── ЗАДАЧИ ──────────────────────────────────────────────────────────── */}
      {activeTab==="tasks" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {[["all","Все"],["open","Открытые"],["overdue","Просроченные"],["done","Закрытые"]].map(([v,l]) => (
              <button key={v} onClick={() => setTaskFilter(v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${taskFilter===v ? (v==="overdue" ? "bg-red-500 text-white" : "bg-[#3ca615] text-white") : "bg-white border border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}>
                {l}
              </button>
            ))}
          </div>
          {loadingTasks
            ? <div className="flex justify-center py-10"><Icon name="Loader2" size={24} className="animate-spin text-gray-300" /></div>
            : tasks.length === 0 ? <div className="text-center py-12 text-gray-400">Задач нет</div>
            : <div className="space-y-2">
                {tasks.map(task => {
                  const over = isOverdue(task.due_at) && !["done","cancelled"].includes(task.status);
                  const tod  = isToday(task.due_at) && task.status !== "done";
                  const isExp = expandedTask === task.id;
                  return (
                    <div key={task.id} className={`bg-white rounded-2xl border shadow-sm ${over ? "border-red-200" : "border-gray-100"}`}>
                      <div className="p-3.5 flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${PRIORITY_BADGE[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${STATUS_BADGE[task.status]}`}>{STATUS_LABEL[task.status]}</span>
                            <span className="text-[10px] text-[#3ca615] font-bold bg-[#edf7e8] px-1.5 py-0.5 rounded-md">💰{task.fixies_reward}</span>
                            {task.penalty_fixies > 0 && <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-md">штраф {task.penalty_fixies}</span>}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                          {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>👷 {task.tech_name}</span>
                            {task.due_at && <span className={`font-medium ${over ? "text-red-600" : tod ? "text-orange-500" : ""}`}>⏰ {fmtShort(task.due_at)}{over?" (просрочена)":""}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                          {!["done","cancelled"].includes(task.status) && (<>
                            <button onClick={() => { setShowExtend(task.id); setExtendDate(""); setExtendComment(""); }} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100">Продлить</button>
                            <button onClick={() => penaltyTask(task.id)} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-50 text-red-500 hover:bg-red-100">Штраф</button>
                            <button onClick={() => closeTask(task.id)} className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-green-50 text-green-700 hover:bg-green-100">Закрыть</button>
                            <button onClick={() => closeTask(task.id, true)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 text-[10px]">Отменить</button>
                          </>)}
                          <button onClick={() => toggleTaskLogs(task.id)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"><Icon name={isExp?"ChevronUp":"ChevronDown"} size={14} /></button>
                        </div>
                      </div>
                      {showExtend===task.id && (
                        <div className="px-3.5 pb-3 border-t border-gray-50 pt-2 flex items-end gap-2">
                          <div className="flex-1 space-y-1.5">
                            <input type="datetime-local" value={extendDate} onChange={e => setExtendDate(e.target.value)} className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none" />
                            <input value={extendComment} onChange={e => setExtendComment(e.target.value)} placeholder="Комментарий..." className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none" />
                          </div>
                          <button onClick={() => extendTask(task.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background:"#3ca615" }}>OK</button>
                          <button onClick={() => setShowExtend(null)} className="text-gray-400"><Icon name="X" size={14} /></button>
                        </div>
                      )}
                      {isExp && taskLogs[task.id] && (
                        <div className="px-3.5 pb-3 border-t border-gray-50 pt-2 space-y-1">
                          {taskLogs[task.id].length === 0 && <p className="text-xs text-gray-400">Нет истории</p>}
                          {taskLogs[task.id].map(log => (
                            <div key={log.id} className="flex gap-2 text-xs text-gray-500 py-0.5">
                              <span className="font-semibold text-gray-700 shrink-0">{log.author_name}</span>
                              <span className="text-gray-400">[{log.action}]</span>
                              <span className="flex-1">{log.text}</span>
                              <span className="shrink-0 text-gray-400">{fmtShort(log.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          }
          {showNewTask && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-bold text-gray-900">Новая задача</h3><button onClick={() => setShowNewTask(false)} className="text-gray-400"><Icon name="X" size={18} /></button></div>
                <input value={newTask.title} onChange={e => setNewTask(p=>({...p,title:e.target.value}))} placeholder="Заголовок *" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                <textarea value={newTask.description} onChange={e => setNewTask(p=>({...p,description:e.target.value}))} placeholder="Описание" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-[#3ca615]" />
                <select value={newTask.assigned_to} onChange={e => setNewTask(p=>({...p,assigned_to:+e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                  <option value={0}>Назначить специалиста *</option>
                  {techs.filter(t=>t.is_active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select value={newTask.priority} onChange={e => setNewTask(p=>({...p,priority:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="low">Низкий</option><option value="normal">Нормальный</option><option value="high">Высокий</option><option value="urgent">Срочно</option>
                  </select>
                  <div className="flex items-center gap-1.5 border border-gray-200 rounded-xl px-3">
                    <span>💰</span>
                    <input type="number" value={newTask.fixies_reward} onChange={e => setNewTask(p=>({...p,fixies_reward:+e.target.value}))} className="w-full text-sm py-2.5 focus:outline-none" min={0} />
                  </div>
                </div>
                <input type="datetime-local" value={newTask.due_at} onChange={e => setNewTask(p=>({...p,due_at:e.target.value}))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none" />
                <button onClick={createTask} disabled={!newTask.title||!newTask.assigned_to} className="w-full py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ background:"#3ca615" }}>Создать задачу</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ФИКСИКИ ─────────────────────────────────────────────────────────── */}
      {activeTab==="fixies" && (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {fixieTechs.map((t, i) => (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 p-3.5">
                  <span className="text-sm font-bold text-gray-400 w-5 text-center">{i+1}</span>
                  <div className="w-9 h-9 rounded-full bg-[#3ca615] flex items-center justify-center text-white font-bold text-sm shrink-0">{t.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className={`text-xs font-bold ${t.balance>=0 ? "text-[#3ca615]" : "text-red-500"}`}>{t.balance>=0?"+":""}{t.balance} 💰 фиксиков</p>
                  </div>
                  <button onClick={() => { setShowAddFixie(t.id); setFixieAmount(""); setFixieReason(""); }} className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#edf7e8] text-[#3ca615] hover:bg-green-100 flex items-center gap-1"><Icon name="Plus" size={12} /></button>
                  <button onClick={() => toggleFixieHistory(t.id)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-xl"><Icon name={expandedFixie===t.id?"ChevronUp":"ChevronDown"} size={14} /></button>
                </div>
                {showAddFixie===t.id && (
                  <div className="px-3.5 pb-3 border-t border-gray-50 pt-2 flex items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                      <input type="number" value={fixieAmount} onChange={e => setFixieAmount(e.target.value)} placeholder="Кол-во (− = штраф)" className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none" />
                      <input value={fixieReason} onChange={e => setFixieReason(e.target.value)} placeholder="Причина *" className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none" />
                    </div>
                    <button onClick={addFixies} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{background:"#3ca615"}}>OK</button>
                    <button onClick={() => setShowAddFixie(null)} className="text-gray-400"><Icon name="X" size={14} /></button>
                  </div>
                )}
                {expandedFixie===t.id && fixieHistory[t.id] && (
                  <div className="px-3.5 pb-3 border-t border-gray-50 pt-2">
                    {fixieHistory[t.id].length===0 && <p className="text-xs text-gray-400">Нет транзакций</p>}
                    {fixieHistory[t.id].slice(0,10).map(tx => (
                      <div key={tx.id} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50 last:border-0">
                        <span className={`font-bold w-10 shrink-0 ${tx.amount>=0?"text-[#3ca615]":"text-red-500"}`}>{tx.amount>=0?"+":""}{tx.amount}</span>
                        <span className="flex-1 text-gray-600 truncate">{tx.reason}</span>
                        <span className="text-gray-400 shrink-0">{fmtShort(tx.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ГРАФИК ──────────────────────────────────────────────────────────── */}
      {activeTab==="schedule" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <button onClick={() => { if (schedMonth===1) { setSchedYear(y=>y-1); setSchedMonth(12); } else setSchedMonth(m=>m-1); }} className="p-1.5 rounded-lg hover:bg-gray-100"><Icon name="ChevronLeft" size={18} /></button>
            <span className="font-bold text-gray-900">{new Date(schedYear, schedMonth-1).toLocaleString("ru-RU",{month:"long",year:"numeric"})}</span>
            <button onClick={() => { if (schedMonth===12) { setSchedYear(y=>y+1); setSchedMonth(1); } else setSchedMonth(m=>m+1); }} className="p-1.5 rounded-lg hover:bg-gray-100"><Icon name="ChevronRight" size={18} /></button>
            <div className="ml-auto flex gap-2 flex-wrap">
              {Object.entries(SCHEDULE_TYPE).map(([k,v]) => <span key={k} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${v.color}`}>{v.label}</span>)}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left py-2 pr-3 font-semibold text-gray-600 sticky left-0 bg-white z-10 min-w-[120px]">Специалист</th>
                  {Array.from({length:days},(_,i)=>i+1).map(d => {
                    const isNow = d===now.getDate() && schedMonth===now.getMonth()+1 && schedYear===now.getFullYear();
                    return <th key={d} className={`w-8 text-center py-1 font-semibold rounded-t-lg ${isNow ? "text-white" : "text-gray-500"}`} style={isNow?{background:"#3ca615"}:{}}>{d}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {techs.map(tech => (
                  <tr key={tech.id} className="border-t border-gray-50">
                    <td className="py-1.5 pr-3 font-medium text-gray-800 sticky left-0 bg-white z-10 whitespace-nowrap">{tech.name}</td>
                    {Array.from({length:days},(_,i)=>i+1).map(d => {
                      const cell = getCell(tech.id, d);
                      const ti = cell ? SCHEDULE_TYPE[cell.type] : null;
                      const dateStr = `${schedYear}-${String(schedMonth).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                      return (
                        <td key={d} className="p-0.5">
                          <button onClick={() => { setSchedCell({tech_id:tech.id,date:dateStr}); setSchedType(cell?.type||"day_off"); setSchedNote(cell?.note||""); }}
                            className={`w-7 h-7 rounded-lg text-center text-[9px] font-bold transition-all hover:opacity-70 ${ti ? ti.color : "hover:bg-gray-100"}`}
                            title={cell ? `${ti?.label}${cell.note?": "+cell.note:""}` : "Нажмите"}>
                            {ti ? ti.label[0] : ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {schedCell && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-bold text-gray-900">{schedCell.date}</h3><button onClick={() => setSchedCell(null)}><Icon name="X" size={18} className="text-gray-400" /></button></div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(SCHEDULE_TYPE).map(([k,v]) => (
                    <button key={k} onClick={() => setSchedType(k)} className={`py-2 rounded-xl text-xs font-semibold border-2 ${schedType===k ? "border-gray-900" : "border-transparent"} ${v.color}`}>{v.label}</button>
                  ))}
                </div>
                <input value={schedNote} onChange={e => setSchedNote(e.target.value)} placeholder="Заметка (необязательно)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
                <button onClick={saveScheduleCell} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{background:"#3ca615"}}>Сохранить</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── КОНТАКТЫ ────────────────────────────────────────────────────────── */}
      {activeTab==="contacts" && (
        <div className="flex-1 overflow-y-auto p-4">
          {contacts.length===0
            ? <div className="text-center py-12 text-gray-400">Контакты не заполнены. Нажмите ✏️ на карточке специалиста.</div>
            : depts.map(dept => (
                <div key={dept} className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{dept}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {contacts.filter(c=>(c.department||"Без отдела")===dept).map(c => (
                      <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-[#3ca615] flex items-center justify-center text-white text-xl font-bold shrink-0">{c.name[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900">{c.name}</p>
                            {c.position && <p className="text-xs text-gray-500">{c.position}</p>}
                            <p className="text-[10px] text-[#3ca615] font-bold mt-0.5">💰{c.fixies_balance} фикс.</p>
                          </div>
                          <button onClick={() => openContactEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"><Icon name="Pencil" size={14} /></button>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-[#3ca615]"><Icon name="Phone" size={11} />{c.phone}</a>}
                          {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-[#3ca615] truncate"><Icon name="Mail" size={11} />{c.email}</a>}
                          {c.vk_url && <a href={c.vk_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline"><Icon name="Globe" size={11} />VK</a>}
                        </div>
                        {(c.tg_chat_id || c.tg_username) && (
                          <button onClick={() => { setActiveTab("chat"); const tech = techs.find(t=>t.id===c.id); if (tech) selectTech(tech); }}
                            className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100">
                            <Icon name="Send" size={12} />Написать в Telegram
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
          }
          {editContact && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl p-5 w-full max-w-md space-y-3 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">{editContact.name}</h3>
                  <button onClick={() => setEditContact(null)}><Icon name="X" size={18} className="text-gray-400" /></button>
                </div>
                {([["Отдел",editDept,(v:string)=>setEditDept(v)],["Должность",editPos,(v:string)=>setEditPos(v)],["Email",editEmail,(v:string)=>setEditEmail(v)],["Telegram (@username)",editTg,(v:string)=>setEditTg(v)],["VK URL",editVk,(v:string)=>setEditVk(v)],["Заметки",editNotes,(v:string)=>setEditNotes(v)]] as [string,string,(v:string)=>void][]).map(([lbl,val,set]) => (
                  <div key={lbl}>
                    <label className="text-xs text-gray-500 mb-1 block">{lbl}</label>
                    <input value={val} onChange={e => set(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
                  </div>
                ))}
                <button onClick={saveContact} className="w-full py-2.5 rounded-xl text-white text-sm font-bold" style={{background:"#3ca615"}}>Сохранить</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
