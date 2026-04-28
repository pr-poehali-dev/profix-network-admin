import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { clientApi, clientSession, reviewsApi, Ticket, STATUS_COLORS, PRIORITY_COLORS } from "@/lib/crm-api";

const BOT_USERNAME = "ProFiXBot"; // замени на реальный username бота если другой

export default function Cabinet() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"phone" | "code" | "cabinet">("phone");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"email" | "telegram">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [client, setClient] = useState<{ id: number; name?: string; phone: string; email?: string; telegram_id?: number | null } | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileTgId, setProfileTgId] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<"list" | "ticket" | "new" | "review">("list");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewTicketId, setReviewTicketId] = useState<number | undefined>();
  const [reviewSent, setReviewSent] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comment, setComment] = useState("");
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "normal" });

  useEffect(() => {
    const token = clientSession.get();
    if (token) {
      (async () => {
        try {
          setLoading(true);
          const res = await clientApi.verifyToken(token);
          if (res.valid && res.client) {
            setClient(res.client);
            setProfileName(res.client.name || "");
            setProfileTgId(res.client.telegram_id ? String(res.client.telegram_id) : "");
            setStep("cabinet");
            await loadTickets();
          }
        } catch {
          // token invalid, show login
        } finally {
          setLoading(false);
        }
      })();
    }
  }, []);

  async function loadTickets() {
    try {
      const res = await clientApi.getTickets();
      if (res.tickets) setTickets(res.tickets);
    } catch {
      setError("Не удалось загрузить заявки");
    }
  }

  async function handleRequestOtp() {
    if (!phone.trim()) {
      setError("Введите номер телефона");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await clientApi.requestOtp(
        phone.trim(),
        channel,
        channel === "email" ? email.trim() : undefined
      );
    } catch {
      // игнорируем ошибки — письмо могло уйти
    } finally {
      setLoading(false);
    }
    // всегда переходим к вводу кода
    setStep("code");
  }

  async function handleVerifyOtp() {
    if (!code.trim()) {
      setError("Введите код подтверждения");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await clientApi.verifyOtp(phone.trim(), code.trim());
      if (res.token) {
        clientSession.set(res.token);
        setClient(res.client);
        setProfileName(res.client?.name || "");
        setProfileTgId(res.client?.telegram_id ? String(res.client.telegram_id) : "");
        setStep("cabinet");
        await loadTickets();
      } else {
        setError(res.error || "Неверный код");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTicket() {
    if (!newTicket.title.trim()) {
      setError("Введите тему заявки");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await clientApi.createTicket(newTicket);
      if (res.ok || res.ticket) {
        await loadTickets();
        setView("list");
        setNewTicket({ title: "", description: "", priority: "normal" });
      } else {
        setError(res.error || "Ошибка создания заявки");
      }
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenTicket(ticket: Ticket) {
    setError("");
    setLoading(true);
    try {
      const res = await clientApi.getTicket(ticket.id);
      if (res.ticket) {
        setSelectedTicket(res.ticket);
      } else {
        setSelectedTicket(ticket);
      }
      setView("ticket");
    } catch {
      setSelectedTicket(ticket);
      setView("ticket");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment() {
    if (!comment.trim() || !selectedTicket) return;
    setError("");
    setLoading(true);
    try {
      const res = await clientApi.addComment(selectedTicket.id, comment.trim());
      if (res.ok || res.comment) {
        setComment("");
        const updated = await clientApi.getTicket(selectedTicket.id);
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

  async function handleSaveProfile() {
    setProfileSaving(true);
    setProfileSuccess(false);
    try {
      const res = await clientApi.updateProfile({
        name: profileName.trim() || undefined,
        telegram_id: profileTgId.trim() ? parseInt(profileTgId.trim()) : null,
      });
      if (res.client) {
        setClient(res.client);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSubmitReview() {
    if (!reviewText.trim()) { setError("Напишите текст отзыва"); return; }
    setLoading(true); setError("");
    try {
      const res = await reviewsApi.create({ rating: reviewRating, text: reviewText.trim(), ticket_id: reviewTicketId });
      if (res.created) {
        setReviewSent(true);
        setReviewText(""); setReviewRating(5);
      } else {
        setError(res.error || "Ошибка отправки");
      }
    } catch { setError("Ошибка сети"); }
    finally { setLoading(false); }
  }

  function handleLogout() {
    clientSession.clear();
    setClient(null);
    setTickets([]);
    setStep("phone");
    setView("list");
    setPhone("");
    setCode("");
    setEmail("");
    navigate("/");
  }

  // ── Экран входа ────────────────────────────────────────────────────────────

  if (step === "phone" || step === "code") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] flex items-center justify-center px-4 font-golos">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-oswald text-xl font-bold tracking-wide">
              <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
            </span>
          </div>
          <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-2">Личный кабинет</p>
          <h1 className="font-oswald text-3xl font-bold text-[#0D1B2A] mb-6">Личный кабинет</h1>
          <p className="text-sm text-gray-500 mb-6">Войдите по номеру телефона</p>

          {step === "phone" && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                  onKeyDown={(e) => e.key === "Enter" && handleRequestOtp()}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Способ получения кода
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel("email")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                      channel === "email"
                        ? "border-[#3ca615] bg-[#3ca615]/5 text-[#3ca615]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon name="Mail" size={15} />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("telegram")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                      channel === "telegram"
                        ? "border-[#3ca615] bg-[#3ca615]/5 text-[#3ca615]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Icon name="Send" size={15} />
                    Telegram
                  </button>
                </div>
              </div>

              {channel === "email" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email адрес
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.ru"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                  <Icon name="AlertCircle" size={15} />
                  {error}
                </div>
              )}

              <button
                onClick={handleRequestOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#3ca615] font-semibold text-white text-sm shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                {loading ? "Отправка..." : "Получить код"}
              </button>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-5">
              <div className="bg-green-50 rounded-xl px-4 py-3 text-sm text-green-800">
                Код отправлен на{" "}
                <span className="font-medium">
                  {channel === "email" ? email || phone : "Telegram"}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Код подтверждения
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-4 py-3">
                  <Icon name="AlertCircle" size={15} />
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#3ca615] font-semibold text-white text-sm shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 transition-all disabled:opacity-60"
              >
                {loading ? "Проверка..." : "Войти"}
              </button>

              <button
                onClick={() => { setStep("phone"); setCode(""); setError(""); }}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
              >
                Назад
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Кабинет ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 shadow-sm h-16 flex items-center px-6">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(view === "ticket" || view === "new" || view === "review") && (
              <button
                onClick={() => { setView("list"); setSelectedTicket(null); setError(""); setReviewSent(false); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
              >
                <Icon name="ArrowLeft" size={18} />
              </button>
            )}
            <span className="font-oswald text-lg font-bold tracking-wide">
              <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
            </span>
            <span className="font-semibold text-gray-900">
              {view === "list" && "Мои заявки"}
              {view === "new" && "Новая заявка"}
              {view === "ticket" && selectedTicket && `Заявка #${selectedTicket.id}`}
              {view === "review" && "Оставить отзыв"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {client?.name || client?.phone || phone}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition"
            >
              <Icon name="LogOut" size={15} />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* ── Список заявок ── */}
        {view === "list" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                {tickets.length === 0
                  ? "У вас пока нет заявок"
                  : `${tickets.length} ${tickets.length === 1 ? "заявка" : tickets.length < 5 ? "заявки" : "заявок"}`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setView("review"); setReviewTicketId(undefined); setReviewSent(false); setError(""); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#3ca615] text-sm font-medium border border-[#3ca615] hover:bg-[#edf7e8] transition"
                >
                  <Icon name="Star" size={15} />
                  Отзыв
                </button>
                <button
                  onClick={() => { setView("new"); setError(""); }}
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
                  onClick={() => { setView("new"); setError(""); }}
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
                    onClick={() => handleOpenTicket(ticket)}
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

            {/* Профиль и Telegram */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-oswald text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Icon name="User" size={15} />
                Профиль и уведомления
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Ваше имя</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Как к вам обращаться?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                    <Icon name="Send" size={12} />
                    Telegram для уведомлений и входа
                  </label>
                  {client?.telegram_id ? (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                      <Icon name="CheckCircle" size={15} className="text-green-600 shrink-0" />
                      <span className="text-sm text-green-700 font-medium">Telegram привязан</span>
                      <a
                        href={`https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(client.phone)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs text-gray-400 underline hover:text-gray-600"
                      >
                        Переподключить
                      </a>
                    </div>
                  ) : (
                    <a
                      href={`https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(client?.phone || phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#2AABEE] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1e96d6] transition w-full"
                    >
                      <Icon name="Send" size={15} />
                      Привязать Telegram
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-2">После нажатия откроется бот — просто нажмите «Старт»</p>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#3ca615" }}
                >
                  {profileSaving ? (
                    <><Icon name="Loader2" size={14} className="animate-spin" />Сохранение...</>
                  ) : profileSuccess ? (
                    <><Icon name="Check" size={14} />Сохранено!</>
                  ) : (
                    "Сохранить"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Просмотр заявки ── */}
        {view === "ticket" && selectedTicket && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedTicket.status] || "bg-gray-100 text-gray-500"}`}>
                  {selectedTicket.status_label}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[selectedTicket.priority] || "bg-gray-100 text-gray-500"}`}>
                  {selectedTicket.priority_label}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(selectedTicket.created_at).toLocaleDateString("ru-RU")}
                </span>
              </div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">{selectedTicket.title}</h2>
              {selectedTicket.description && (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.description}
                </p>
              )}
              {selectedTicket.amount != null && selectedTicket.amount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Сумма</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {selectedTicket.amount.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              )}
              {selectedTicket.manager_name && (
                <div className="mt-3 flex items-center gap-2">
                  <Icon name="UserCheck" size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Менеджер: {selectedTicket.manager_name}</span>
                </div>
              )}
            </div>

            {/* Комментарии */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Icon name="MessageSquare" size={15} />
                Комментарии
                {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                    {selectedTicket.comments.length}
                  </span>
                )}
              </h3>

              {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                <p className="text-sm text-gray-400 text-center py-4">Комментариев пока нет</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {selectedTicket.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl p-3.5 text-sm ${
                        c.author_role === "client"
                          ? "bg-[#3ca615]/5 ml-8"
                          : "bg-gray-50 mr-8"
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
                  onClick={handleAddComment}
                  disabled={loading || !comment.trim()}
                  className="px-4 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition self-end"
                  style={{ backgroundColor: "#3ca615" }}
                >
                  <Icon name="Send" size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Новая заявка ── */}
        {view === "new" && (
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Описание
                </label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  placeholder="Подробно опишите вашу ситуацию..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#3ca615]/30 focus:border-[#3ca615] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Приоритет
                </label>
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
                  onClick={() => { setView("list"); setError(""); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-medium disabled:opacity-60 transition"
                  style={{ backgroundColor: "#3ca615" }}
                >
                  {loading ? "Создание..." : "Создать заявку"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Отзыв ── */}
        {view === "review" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {reviewSent ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="CheckCircle" size={28} className="text-green-500" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Спасибо за отзыв!</h2>
                <p className="text-sm text-gray-500 mb-6">Он появится на сайте после проверки</p>
                <button
                  onClick={() => { setView("list"); setReviewSent(false); }}
                  className="px-6 py-2.5 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: "#3ca615" }}
                >
                  Вернуться к заявкам
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                <h2 className="text-base font-semibold text-gray-900">Оставить отзыв</h2>

                {/* Выбор заявки */}
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

                {/* Оценка */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Оценка</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition"
                      >
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

                {/* Текст */}
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
                    onClick={() => { setView("list"); setError(""); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmitReview}
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
        )}
      </main>
    </div>
  );
}