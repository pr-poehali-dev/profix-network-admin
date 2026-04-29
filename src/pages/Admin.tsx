import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { managerApi, managerSession, reviewsApi, Ticket, Client, Technician } from "@/lib/crm-api";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  AdminDashboard,
  AdminTickets,
  AdminTicketDetail,
  AdminClients,
  EditFields,
} from "@/components/admin/AdminContent";
import { AdminTechnicians, AdminManagers } from "@/components/admin/AdminStaff";

export default function Admin() {
  const navigate = useNavigate();

  const [loggedIn, setLoggedIn] = useState(false);
  const [manager, setManager] = useState<{ id: number; name: string; role: string } | null>(null);
  const [section, setSection] = useState("dashboard");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<{ id: number; login: string; name: string; role: string }[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    by_status: Record<string, number>;
    clients: number;
    paid: number;
    revenue: number;
  } | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [techSchedule, setTechSchedule] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [newManager, setNewManager] = useState({ login: "", password: "", name: "", role: "manager" });
  const [newTech, setNewTech] = useState({ name: "", phone: "", specialization: "" });
  const [reviews, setReviews] = useState<{ id: number; name: string; rating: number; text: string; published: boolean; created_at: string; service?: string }[]>([]);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const lastCommentIdRef = useRef<number>(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({
    status: "",
    priority: "",
    amount: "",
    paid: false,
    technician_id: "",
    scheduled_date: "",
    scheduled_hour: "",
    tech_notes: "",
  });

  // ── Загрузка данных ──────────────────────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        managerApi.getStats(),
        managerApi.getTickets(),
      ]);
      if (statsRes.total !== undefined) setStats(statsRes);
      if (ticketsRes.tickets) setTickets(ticketsRes.tickets);
    } catch {
      setError("Не удалось загрузить данные дашборда");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTickets = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      const res = await managerApi.getTickets(status || undefined);
      if (res.tickets) setTickets(res.tickets);
    } catch {
      setError("Не удалось загрузить заявки");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.getClients();
      if (res.clients) setClients(res.clients);
    } catch {
      setError("Не удалось загрузить клиентов");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadManagers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.getManagers();
      if (res.managers) setManagers(res.managers);
    } catch {
      setError("Не удалось загрузить менеджеров");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      const res = await managerApi.getTechnicians();
      if (res.technicians) setTechnicians(res.technicians);
    } catch {
      setError("Не удалось загрузить специалистов");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const token = managerSession.get()!;
      const res = await reviewsApi.getAll(token);
      if (res.reviews) setReviews(res.reviews);
    } catch {
      setError("Не удалось загрузить отзывы");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Проверка сессии ──────────────────────────────────────────────────────────

  useEffect(() => {
    const token = managerSession.get();
    if (token) {
      (async () => {
        try {
          setLoading(true);
          const res = await managerApi.verifyToken(token);
          if (res.valid && res.manager) {
            setManager(res.manager);
            setLoggedIn(true);
            await loadDashboard();
          }
        } catch {
          // token invalid
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [loadDashboard]);

  // ── Polling новых комментариев от техспециалистов ───────────────────────────

  const pollNewComments = useCallback(async () => {
    try {
      const res = await managerApi.getTickets();
      const allTickets: Ticket[] = res.tickets ?? [];
      let maxId = lastCommentIdRef.current;
      let newCount = 0;
      let lastTicketTitle = "";
      let lastAuthor = "";

      for (const t of allTickets) {
        if (!t.comments) continue;
        for (const c of t.comments) {
          const cId = c.id ?? 0;
          if (cId > maxId) {
            maxId = cId;
            if (lastCommentIdRef.current > 0) {
              newCount++;
              lastTicketTitle = t.title;
              lastAuthor = c.author ?? "Специалист";
            }
          }
        }
      }

      if (lastCommentIdRef.current === 0) {
        lastCommentIdRef.current = maxId;
        return;
      }

      if (newCount > 0) {
        lastCommentIdRef.current = maxId;
        setNewCommentCount(prev => prev + newCount);

        if (Notification.permission === "granted") {
          new Notification("ProFiX — новый комментарий", {
            body: `${lastAuthor}: заявка «${lastTicketTitle}»`,
            icon: "https://cdn.poehali.dev/files/14883a12-7574-4223-bfd4-68dc3e490534.png",
          });
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!loggedIn) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    pollIntervalRef.current = setInterval(pollNewComments, 15000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loggedIn, pollNewComments]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function handleLogin() {
    if (!loginForm.login.trim() || !loginForm.password.trim()) {
      setError("Заполните логин и пароль");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.login(loginForm.login.trim(), loginForm.password.trim());
      if (res.token) {
        managerSession.set(res.token);
        setManager(res.manager);
        setLoggedIn(true);
        await loadDashboard();
      } else {
        setError(res.error || "Неверный логин или пароль");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    managerSession.clear();
    setLoggedIn(false);
    setManager(null);
    setTickets([]);
    setClients([]);
    setManagers([]);
    setTechnicians([]);
    setStats(null);
    setSelectedTicket(null);
    setSelectedTech(null);
    navigate("/");
  }

  function handleSectionChange(s: string) {
    setSection(s);
    setError("");
    setSelectedTicket(null);
    setSelectedTech(null);
    if (s === "tickets" || s === "dashboard") setNewCommentCount(0);
    if (s === "dashboard") loadDashboard();
    if (s === "tickets") loadTickets(statusFilter);
    if (s === "clients") loadClients();
    if (s === "managers") loadManagers();
    if (s === "technicians") loadTechnicians();
    if (s === "reviews") loadReviews();
  }

  function handleFilterChange(f: string) {
    setStatusFilter(f);
    loadTickets(f);
  }

  async function handleOpenTicket(ticket: Ticket) {
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.getTicket(ticket.id);
      const t: Ticket = res.ticket || ticket;
      setSelectedTicket(t);
      setEditFields({
        status: t.status,
        priority: t.priority,
        amount: t.amount != null ? String(t.amount) : "",
        paid: t.paid ?? false,
        technician_id: t.technician?.id ? String(t.technician.id) : "",
        scheduled_date: t.scheduled_date ?? "",
        scheduled_hour: t.scheduled_hour != null ? String(t.scheduled_hour) : "",
        tech_notes: t.tech_notes ?? "",
      });
      setSection("ticket_detail");
    } catch {
      setSelectedTicket(ticket);
      setEditFields({
        status: ticket.status,
        priority: ticket.priority,
        amount: ticket.amount != null ? String(ticket.amount) : "",
        paid: ticket.paid ?? false,
        technician_id: ticket.technician?.id ? String(ticket.technician.id) : "",
        scheduled_date: ticket.scheduled_date ?? "",
        scheduled_hour: ticket.scheduled_hour != null ? String(ticket.scheduled_hour) : "",
        tech_notes: ticket.tech_notes ?? "",
      });
      setSection("ticket_detail");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateTicket() {
    if (!selectedTicket) return;
    setError("");
    setLoading(true);
    try {
      const updateData: {
        id: number; status: string; priority: string; paid: boolean;
        amount?: number; technician_id?: number;
        scheduled_date?: string; scheduled_hour?: number; tech_notes?: string;
      } = {
        id: selectedTicket.id,
        status: editFields.status,
        priority: editFields.priority,
        paid: editFields.paid,
      };
      if (editFields.amount !== "") updateData.amount = parseFloat(editFields.amount) || 0;
      if (editFields.technician_id !== "") updateData.technician_id = parseInt(editFields.technician_id);
      if (editFields.scheduled_date !== "") updateData.scheduled_date = editFields.scheduled_date;
      if (editFields.scheduled_hour !== "") updateData.scheduled_hour = parseInt(editFields.scheduled_hour);
      if (editFields.tech_notes !== "") updateData.tech_notes = editFields.tech_notes;

      const res = await managerApi.updateTicket(updateData);
      if (res.ok || res.ticket || res.updated) {
        const updated = await managerApi.getTicket(selectedTicket.id);
        if (updated.ticket) {
          const t: Ticket = updated.ticket;
          setSelectedTicket(t);
          setEditFields({
            status: t.status,
            priority: t.priority,
            amount: t.amount != null ? String(t.amount) : "",
            paid: t.paid ?? false,
            technician_id: t.technician?.id ? String(t.technician.id) : "",
            scheduled_date: t.scheduled_date ?? "",
            scheduled_hour: t.scheduled_hour != null ? String(t.scheduled_hour) : "",
            tech_notes: t.tech_notes ?? "",
          });
        }
      } else {
        setError(res.error || "Ошибка обновления заявки");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment() {
    if (!comment.trim() || !selectedTicket) return;
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.addComment(selectedTicket.id, comment.trim());
      if (res.ok || res.comment || res.id) {
        setComment("");
        const updated = await managerApi.getTicket(selectedTicket.id);
        if (updated.ticket) setSelectedTicket(updated.ticket);
      } else {
        setError(res.error || "Ошибка добавления комментария");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateManager() {
    if (!newManager.login.trim() || !newManager.password.trim() || !newManager.name.trim()) {
      setError("Заполните все поля");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.createManager(newManager);
      if (res.ok || res.manager || res.id) {
        setNewManager({ login: "", password: "", name: "", role: "manager" });
        await loadManagers();
      } else {
        setError(res.error || "Ошибка создания менеджера");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTechnician() {
    if (!newTech.name.trim()) {
      setError("Укажите имя специалиста");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.createTechnician(newTech);
      if (res.ok || res.technician || res.id) {
        setNewTech({ name: "", phone: "", specialization: "" });
        await loadTechnicians();
      } else {
        setError(res.error || "Ошибка создания специалиста");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTech(tech: Technician) {
    setSelectedTech(tech);
    setError("");
    setLoading(true);
    try {
      const res = await managerApi.getSchedule(tech.id);
      setTechSchedule(res.tickets ?? res.schedule ?? []);
    } catch {
      setTechSchedule([]);
    } finally {
      setLoading(false);
    }
  }

  // ── Экран входа ──────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return (
      <AdminLogin
        loginForm={loginForm}
        loading={loading}
        error={error}
        onChangeForm={setLoginForm}
        onLogin={handleLogin}
      />
    );
  }

  // ── Основной layout ──────────────────────────────────────────────────────────

  const activeSection = section === "ticket_detail" ? "tickets" : section;

  return (
    <div className="flex min-h-screen font-golos bg-[#F7F9FC]">
      <AdminSidebar
        manager={manager}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onLogout={handleLogout}
        newCommentCount={newCommentCount}
      />

      <main className="flex-1 overflow-auto">
        {/* Глобальная ошибка */}
        {error && (
          <div className="mx-6 mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {section === "dashboard" && (
          <AdminDashboard
            stats={stats}
            tickets={tickets}
            loading={loading}
            onOpenTicket={handleOpenTicket}
            onGoTickets={() => handleSectionChange("tickets")}
          />
        )}

        {section === "tickets" && (
          <AdminTickets
            tickets={tickets}
            loading={loading}
            statusFilter={statusFilter}
            onFilterChange={handleFilterChange}
            onOpenTicket={handleOpenTicket}
          />
        )}

        {section === "ticket_detail" && selectedTicket && (
          <AdminTicketDetail
            ticket={selectedTicket}
            technicians={technicians.length > 0 ? technicians : []}
            editFields={editFields}
            comment={comment}
            loading={loading}
            onEditChange={setEditFields}
            onCommentChange={setComment}
            onSave={handleUpdateTicket}
            onAddComment={handleAddComment}
            onBack={() => handleSectionChange("tickets")}
          />
        )}

        {section === "clients" && (
          <AdminClients clients={clients} loading={loading} />
        )}

        {section === "technicians" && (
          <AdminTechnicians
            technicians={technicians}
            selectedTech={selectedTech}
            techSchedule={techSchedule}
            newTech={newTech}
            loading={loading}
            onSelectTech={handleSelectTech}
            onNewTechChange={setNewTech}
            onCreateTech={handleCreateTechnician}
          />
        )}

        {section === "managers" && manager?.role === "admin" && (
          <AdminManagers
            managers={managers}
            newManager={newManager}
            loading={loading}
            onNewManagerChange={setNewManager}
            onCreateManager={handleCreateManager}
          />
        )}

        {section === "reviews" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-gray-900">Отзывы клиентов</h1>
              <button
                onClick={loadReviews}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Обновить
              </button>
            </div>
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
                Отзывов пока нет
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <span key={i} className={i < r.rating ? "text-yellow-400" : "text-gray-200"}>★</span>
                            ))}
                          </div>
                          <span className="font-medium text-sm text-gray-800">{r.name}</span>
                          <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("ru-RU")}</span>
                          {r.service && <span className="text-xs text-gray-400">— {r.service}</span>}
                        </div>
                        <p className="text-sm text-gray-700">«{r.text}»</p>
                      </div>
                      <button
                        onClick={async () => {
                          await reviewsApi.publish(r.id, !r.published, managerSession.get()!);
                          await loadReviews();
                        }}
                        className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition ${
                          r.published
                            ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600"
                            : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
                        }`}
                      >
                        {r.published ? "Опубликован" : "Опубликовать"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Индикатор загрузки */}
        {loading && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Загрузка...
          </div>
        )}
      </main>
    </div>
  );
}