import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { techApi, techSession, Ticket } from "@/lib/crm-api";
import AdminNotificationPanel from "@/components/admin/AdminNotificationPanel";
import TechLogin from "@/components/tech/TechLogin";
import TechTicketList from "@/components/tech/TechTicketList";
import TechTicketDetail from "@/components/tech/TechTicketDetail";

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
      <TechLogin
        step={step}
        techList={techList}
        pin={pin}
        loading={loading}
        error={error}
        isInstalled={isInstalled}
        installPrompt={installPrompt}
        onSelectTech={id => { setSelectedTechId(id); setStep("pin"); setError(""); }}
        onPinChange={setPin}
        onLogin={handleLogin}
        onBack={() => { setStep("select"); setPin(""); setError(""); }}
        onInstall={handleInstall}
        onNavigateHome={() => navigate("/")}
      />
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
              className="flex items-center gap-1.5 text-sm text-white bg-[#3ca615] px-3 py-1.5 rounded-lg hover:bg-[#2d8a10] transition-colors"
            >
              <Icon name="Download" size={15} />
              <span className="hidden sm:inline">Установить</span>
            </button>
          )}
          {tech && techSession.get() && (
            <div className="bg-[#111827] rounded-xl p-0.5 flex items-center justify-center">
              <AdminNotificationPanel
                token={techSession.get()!}
                role="technician"
                userId={tech.id}
                userName={tech.name}
              />
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <Icon name="LogOut" size={15} />
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

        {selectedTicket ? (
          <TechTicketDetail
            ticket={selectedTicket}
            comment={comment}
            newStatus={newStatus}
            statusComment={statusComment}
            saving={saving}
            onBack={() => setSelectedTicket(null)}
            onCommentChange={setComment}
            onNewStatusChange={setNewStatus}
            onStatusCommentChange={setStatusComment}
            onUpdateStatus={handleUpdateStatus}
            onAddComment={handleAddComment}
            onTicketRefresh={setSelectedTicket}
          />
        ) : (
          <TechTicketList
            tickets={tickets}
            loading={loading}
            filter={filter}
            onFilterChange={setFilter}
            onOpenTicket={openTicket}
            onRefresh={loadTickets}
          />
        )}
      </div>
    </div>
  );
}