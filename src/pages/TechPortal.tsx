import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { techApi, techSession, Ticket, STATUS_COLORS } from "@/lib/crm-api";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

function formatHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

type TechInfo = { id: number; name: string; phone?: string; specialization?: string };
type TechListItem = { id: number; name: string; specialization?: string };

export default function TechPortal() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"select" | "pin" | "portal">("select");
  const [techList, setTechList] = useState<TechListItem[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [tech, setTech] = useState<TechInfo | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [filter, setFilter] = useState("active");
  const [saving, setSaving] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const pollTicketRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedTicketIdRef = useRef<number | null>(null);

  // PWA установка
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    const prompt = installPrompt as BeforeInstallPromptEvent;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") { setIsInstalled(true); setInstallPrompt(null); }
  }

  // Проверка сохранённого токена
  useEffect(() => {
    const token = techSession.get();
    if (token) {
      (async () => {
        try {
          setLoading(true);
          const res = await techApi.verifyToken(token);
          if (res.valid && res.technician) {
            setTech(res.technician);
            setStep("portal");
          } else {
            techSession.clear();
          }
        } catch {
          techSession.clear();
        } finally {
          setLoading(false);
        }
      })();
    } else {
      loadTechList();
    }
  }, []);

  async function loadTechList() {
    try {
      const res = await techApi.getTechniciansList();
      if (res.technicians) setTechList(res.technicians);
    } catch {
      setError("Не удалось загрузить список специалистов");
    }
  }

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await techApi.getTickets();
      if (res.tickets) setTickets(res.tickets);
    } catch {
      setError("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === "portal") loadTickets();
  }, [step, loadTickets]);

  async function handleLogin() {
    if (!selectedTechId || !pin.trim()) {
      setError("Выберите специалиста и введите PIN");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await techApi.login(selectedTechId, pin.trim());
      if (res.token) {
        techSession.set(res.token);
        setTech(res.technician);
        setStep("portal");
      } else {
        setError(res.error || "Неверный PIN");
      }
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  async function openTicket(ticket: Ticket) {
    setError("");
    try {
      const res = await techApi.getTicket(ticket.id);
      if (res.ticket) {
        setSelectedTicket(res.ticket);
        setNewStatus(res.ticket.status);
        setStatusComment("");
        setComment("");
      }
    } catch {
      setError("Не удалось загрузить заявку");
    }
  }

  async function handleUpdateStatus() {
    if (!selectedTicket || !newStatus) return;
    setSaving(true);
    setError("");
    try {
      await techApi.updateStatus(selectedTicket.id, newStatus);
      if (statusComment.trim()) {
        await techApi.addComment(selectedTicket.id, `[Статус: ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}] ${statusComment.trim()}`);
      }
      const res = await techApi.getTicket(selectedTicket.id);
      if (res.ticket) setSelectedTicket(res.ticket);
      await loadTickets();
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddComment() {
    if (!selectedTicket || !comment.trim()) return;
    setSaving(true);
    try {
      await techApi.addComment(selectedTicket.id, comment.trim());
      setComment("");
      const res = await techApi.getTicket(selectedTicket.id);
      if (res.ticket) setSelectedTicket(res.ticket);
    } catch {
      setError("Ошибка отправки");
    } finally {
      setSaving(false);
    }
  }

  // Автообновление открытой заявки каждые 10 сек
  useEffect(() => {
    selectedTicketIdRef.current = selectedTicket?.id ?? null;
  }, [selectedTicket?.id]);

  useEffect(() => {
    if (!selectedTicket) {
      if (pollTicketRef.current) clearInterval(pollTicketRef.current);
      return;
    }
    pollTicketRef.current = setInterval(async () => {
      const id = selectedTicketIdRef.current;
      if (!id) return;
      try {
        const res = await techApi.getTicket(id);
        if (res.ticket) {
          const newComments = res.ticket.comments?.length ?? 0;
          const oldComments = selectedTicket?.comments?.length ?? 0;
          if (newComments > oldComments) {
            setSelectedTicket(res.ticket);
          }
        }
      } catch { /* ignore */ }
    }, 10000);
    return () => { if (pollTicketRef.current) clearInterval(pollTicketRef.current); };
  }, [selectedTicket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    techSession.clear();
    setTech(null);
    setTickets([]);
    setSelectedTicket(null);
    setStep("select");
    setPin("");
    loadTechList();
  }

  const filteredTickets = tickets.filter(t => {
    if (filter === "active") return !["done", "cancelled"].includes(t.status);
    if (filter === "done") return t.status === "done";
    return true;
  });

  // ── ЭКРАН ЗАГРУЗКИ ───────────────────────────────────────────────────────
  if (loading && step !== "portal") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex items-center justify-center">
        <Icon name="Loader2" size={32} className="animate-spin text-[#3ca615]" />
      </div>
    );
  }

  // ── ФОРМА ВХОДА ─────────────────────────────────────────────────────────
  if (step !== "portal") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 w-full max-w-sm">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-[#edf7e8] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Icon name="Wrench" size={28} className="text-[#3ca615]" />
            </div>
            <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-2">ProFiX</p>
            <h1 className="font-oswald text-3xl font-bold text-[#0D1B2A]">Портал специалиста</h1>
          </div>

          {!isInstalled && installPrompt && (
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 bg-[#3ca615] text-white rounded-xl py-3 text-sm font-semibold mb-5 hover:bg-[#2d8a10] transition"
            >
              <Icon name="Download" size={16} />
              Установить приложение на телефон
            </button>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {step === "select" && (
            <>
              <div className="space-y-2 mb-5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Выберите себя
                </label>
                {techList.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTechId(t.id); setStep("pin"); setError(""); }}
                    className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-[#3ca615] hover:bg-[#edf7e8] transition-all"
                  >
                    <div className="w-10 h-10 bg-[#edf7e8] rounded-xl flex items-center justify-center shrink-0">
                      <Icon name="UserCheck" size={18} className="text-[#3ca615]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#111827]">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.specialization || "Специалист"}</p>
                    </div>
                    <Icon name="ChevronRight" size={16} className="text-gray-300 ml-auto" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => navigate("/")}
                className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← На главную
              </button>
            </>
          )}

          {step === "pin" && (
            <>
              <button
                onClick={() => { setStep("select"); setPin(""); setError(""); }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4 transition-colors"
              >
                <Icon name="ChevronLeft" size={16} /> Назад
              </button>
              <p className="text-sm text-gray-500 mb-4">
                Введите PIN-код для входа
              </p>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="PIN-код"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 mb-4"
              />
              <button
                onClick={handleLogin}
                disabled={loading || !pin.trim()}
                className="w-full bg-[#3ca615] text-white py-3 rounded-xl font-semibold shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Icon name="Loader2" size={18} className="animate-spin" /> : <Icon name="LogIn" size={18} />}
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── ПОРТАЛ СПЕЦИАЛИСТА ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <div className="w-9 h-9 bg-[#edf7e8] rounded-xl flex items-center justify-center">
            <Icon name="Wrench" size={18} className="text-[#3ca615]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-[#111827]">{tech?.name}</p>
            <p className="text-xs text-gray-400">{tech?.specialization || "Технический специалист"}</p>
          </div>
          {!isInstalled && installPrompt && (
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 text-sm text-white bg-[#3ca615] px-3 py-1.5 rounded-lg hover:bg-[#2d8a10] transition-colors mr-1"
            >
              <Icon name="Download" size={15} />
              Установить
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <Icon name="LogOut" size={15} />
            Выйти
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="AlertCircle" size={16} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button onClick={() => setError("")}><Icon name="X" size={14} className="text-red-400" /></button>
          </div>
        )}

        {/* Детали заявки */}
        {selectedTicket ? (
          <div>
            <button
              onClick={() => setSelectedTicket(null)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#3ca615] mb-4 transition-colors"
            >
              <Icon name="ChevronLeft" size={16} /> Назад к заявкам
            </button>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Заявка #{selectedTicket.id}</p>
                  <h2 className="font-bold text-lg text-[#111827]">{selectedTicket.title}</h2>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${STATUS_COLORS[selectedTicket.status] || "bg-gray-100 text-gray-500"}`}>
                  {selectedTicket.status_label}
                </span>
              </div>

              {selectedTicket.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{selectedTicket.description}</p>
              )}

              {selectedTicket.tech_notes && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Заметки от менеджера</p>
                  <p className="text-sm text-yellow-800">{selectedTicket.tech_notes}</p>
                </div>
              )}

              {/* Контакты клиента */}
              {selectedTicket.client && (
                <div className="bg-[#F7F9FC] rounded-xl p-3 mb-4 border border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Клиент</p>
                  <div className="flex flex-col gap-1">
                    {selectedTicket.client.name && (
                      <p className="text-sm font-medium text-[#111827]">{selectedTicket.client.name}</p>
                    )}
                    {selectedTicket.client.phone && (
                      <a href={`tel:${selectedTicket.client.phone}`}
                        className="flex items-center gap-1.5 text-sm text-[#3ca615] hover:underline">
                        <Icon name="Phone" size={13} />
                        {selectedTicket.client.phone}
                      </a>
                    )}
                    {selectedTicket.client.email && (
                      <p className="text-sm text-gray-500">{selectedTicket.client.email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Дата/время выезда */}
              {(selectedTicket.scheduled_date || selectedTicket.scheduled_hour !== null) && (
                <div className="flex items-center gap-2 text-sm text-[#1565C0] mb-4">
                  <Icon name="Calendar" size={15} />
                  <span>
                    {selectedTicket.scheduled_date && new Date(selectedTicket.scheduled_date).toLocaleDateString("ru-RU")}
                    {selectedTicket.scheduled_hour !== null && selectedTicket.scheduled_hour !== undefined &&
                      ` в ${formatHour(selectedTicket.scheduled_hour)}`}
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
                    onClick={() => setNewStatus(s.value)}
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
                onChange={e => setStatusComment(e.target.value)}
                placeholder="Комментарий к смене статуса (необязательно)..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3ca615] resize-none mb-3"
              />
              <button
                onClick={handleUpdateStatus}
                disabled={saving || newStatus === selectedTicket.status}
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
                  Переписка ({selectedTicket.comments?.length || 0})
                </h3>
                <button onClick={async () => {
                  const res = await techApi.getTicket(selectedTicket.id);
                  if (res.ticket) setSelectedTicket(res.ticket);
                }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#3ca615] transition-colors">
                  <Icon name="RefreshCw" size={13} />
                  Обновить
                </button>
              </div>
              <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
                {selectedTicket.comments?.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-4">Комментариев пока нет</p>
                )}
                {selectedTicket.comments?.map(c => (
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
                      <p className={`text-[10px] mt-1 opacity-60`}>
                        {c.created_at ? new Date(c.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddComment(); }
                  }}
                  placeholder="Написать комментарий... (Enter — отправить)"
                  rows={2}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#3ca615] resize-none"
                />
                <button
                  onClick={handleAddComment}
                  disabled={saving || !comment.trim()}
                  className="w-10 h-10 self-end bg-[#3ca615] text-white rounded-xl flex items-center justify-center hover:bg-[#2d8a10] transition-colors disabled:opacity-60 shrink-0"
                >
                  {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={15} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Список заявок */
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
                  onClick={() => setFilter(f.v)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filter === f.v ? "bg-[#3ca615] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#3ca615] hover:text-[#3ca615]"
                  }`}
                >
                  {f.l}
                </button>
              ))}
              <button
                onClick={loadTickets}
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
                    onClick={() => openTicket(t)}
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
        )}
      </div>
    </div>
  );
}