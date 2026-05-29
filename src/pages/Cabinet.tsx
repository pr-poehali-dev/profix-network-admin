import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { clientApi, clientSession, reviewsApi, Ticket } from "@/lib/crm-api";
import CabinetProfile from "@/components/cabinet/CabinetProfile";

import { CabinetLogin } from "./cabinet/CabinetLogin";
import { CabinetTicketList, CabinetTicketDetail, CabinetNewTicket, CabinetReview } from "./cabinet/CabinetTickets";
import { CabinetChat, CabinetOrders, CabinetRequisites } from "./cabinet/CabinetSidePanels";

const CHAT_SEND_URL = "https://functions.poehali.dev/52fdb994-24e1-4c9a-ab41-fef309251496";
const CHAT_POLL_URL = "https://functions.poehali.dev/41cfa64a-33a9-4226-847a-d2a2e2e3d987";

function getSessionId() {
  let sid = localStorage.getItem("profix_chat_session");
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("profix_chat_session", sid); }
  return sid;
}
const nowTime = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const BOT_USERNAME = "ProFiXBot";

export default function Cabinet() {
  const navigate = useNavigate();

  const [step, setStep] = useState<"phone" | "code" | "cabinet">("phone");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"email" | "telegram">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [client, setClient] = useState<{ id: number; name?: string; phone: string; email?: string; telegram_id?: number | null; avatar_url?: string | null; delivery_address?: string | null; socials?: Record<string, string> } | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileTgId, setProfileTgId] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<"list" | "ticket" | "new" | "review" | "chat" | "profile" | "orders" | "requisites">("list");
  const [orders, setOrders] = useState<{id:number;invoice_number:string;status:string;payment_status:string;payment_method:string;total:number;items:{name:string;qty:number;price:number}[];delivery_type:string;created_at:string}[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [requisites, setRequisites] = useState({ client_type: "individual", company_name: "", company_inn: "", company_kpp: "", company_address: "" });
  const [reqSaving, setReqSaving] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{id?:number;from:"user"|"bot"|"operator";text:string;time:string}[]>([
    { from: "bot", text: "Здравствуйте! Напишите вопрос — менеджер ответит в ближайшее время.", time: nowTime() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const chatLastIdRef = useRef(0);
  const chatSessionId = useRef(getSessionId());
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewTicketId, setReviewTicketId] = useState<number | undefined>();
  const [reviewSent, setReviewSent] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [comment, setComment] = useState("");
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "normal" });

  // Смена пароля
  const [pwStep, setPwStep] = useState<"idle"|"sent"|"confirm">("idle");
  const [pwCode, setPwCode] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwNew2, setPwNew2] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Смена email
  const [emailStep, setEmailStep] = useState<"idle"|"sent"|"confirm">("idle");
  const [emailNew, setEmailNew] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Смена телефона
  const [phoneStep, setPhoneStep] = useState<"idle"|"sent"|"confirm">("idle");
  const [phoneNew, setPhoneNew] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSuccess, setPhoneSuccess] = useState(false);

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
          } else {
            clientSession.clear();
          }
        } catch {
          clientSession.clear();
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

  async function loadOrders() {
    const token = clientSession.get();
    if (!token) return;
    setOrdersLoading(true);
    try {
      const { shopApi } = await import("@/lib/shop-api");
      const res = await shopApi.getMyOrders(token);
      if (res.orders) setOrders(res.orders);
    } catch { /* ignore */ }
    finally { setOrdersLoading(false); }
  }

  async function handleRequestOtp() {
    if (!phone.trim()) { setError("Введите номер телефона"); return; }
    setError(""); setLoading(true);
    try {
      await clientApi.requestOtp(phone.trim(), channel, channel === "email" ? email.trim() : undefined);
    } catch { /* игнорируем ошибки — письмо могло уйти */ }
    finally { setLoading(false); }
    setStep("code");
  }

  async function handleVerifyOtp() {
    if (!code.trim()) { setError("Введите код подтверждения"); return; }
    setError(""); setLoading(true);
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
    if (!newTicket.title.trim()) { setError("Введите тему заявки"); return; }
    setError(""); setLoading(true);
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
    setError(""); setLoading(true);
    try {
      const res = await clientApi.getTicket(ticket.id);
      if (res.ticket) { setSelectedTicket(res.ticket); }
      else { setSelectedTicket(ticket); }
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
    setError(""); setLoading(true);
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
    setProfileSaving(true); setProfileSuccess(false);
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
    } catch { /* ignore */ }
    finally { setProfileSaving(false); }
  }

  async function handlePasswordRequest() {
    setPwLoading(true); setPwError("");
    try {
      const res = await clientApi.changePasswordRequest();
      if (res.sent) { setPwStep("sent"); }
      else setPwError(res.error || "Ошибка отправки");
    } catch { setPwError("Ошибка соединения"); }
    finally { setPwLoading(false); }
  }

  async function handlePasswordConfirm() {
    if (pwNew !== pwNew2) { setPwError("Пароли не совпадают"); return; }
    if (pwNew.length < 6) { setPwError("Минимум 6 символов"); return; }
    setPwLoading(true); setPwError("");
    try {
      const res = await clientApi.changePasswordConfirm(pwCode, pwNew);
      if (res.changed) { setPwSuccess(true); setPwStep("idle"); setPwCode(""); setPwNew(""); setPwNew2(""); }
      else setPwError(res.error || "Неверный код");
    } catch { setPwError("Ошибка"); }
    finally { setPwLoading(false); }
  }

  async function handleEmailRequest() {
    if (!emailNew.trim()) { setEmailError("Введите новый email"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await clientApi.changeEmailRequest(emailNew.trim());
      if (res.sent) setEmailStep("sent");
      else setEmailError(res.error || "Ошибка отправки");
    } catch { setEmailError("Ошибка соединения"); }
    finally { setEmailLoading(false); }
  }

  async function handleEmailConfirm() {
    if (!emailCode.trim()) { setEmailError("Введите код"); return; }
    setEmailLoading(true); setEmailError("");
    try {
      const res = await clientApi.changeEmailConfirm(emailCode, emailNew.trim());
      if (res.changed) {
        setClient(c => c ? { ...c, email: emailNew.trim() } : c);
        setEmailSuccess(true); setEmailStep("idle"); setEmailNew(""); setEmailCode("");
        setTimeout(() => setEmailSuccess(false), 3000);
      } else setEmailError(res.error || "Неверный код");
    } catch { setEmailError("Ошибка"); }
    finally { setEmailLoading(false); }
  }

  async function handlePhoneRequest() {
    if (!phoneNew.trim()) { setPhoneError("Введите новый телефон"); return; }
    setPhoneLoading(true); setPhoneError("");
    try {
      const res = await clientApi.changePhoneRequest(phoneNew.trim());
      if (res.sent) setPhoneStep("sent");
      else setPhoneError(res.error || "Ошибка отправки");
    } catch { setPhoneError("Ошибка соединения"); }
    finally { setPhoneLoading(false); }
  }

  async function handlePhoneConfirm() {
    if (!phoneCode.trim()) { setPhoneError("Введите код"); return; }
    setPhoneLoading(true); setPhoneError("");
    try {
      const res = await clientApi.changePhoneConfirm(phoneCode, phoneNew.trim());
      if (res.changed) {
        setClient(c => c ? { ...c, phone: phoneNew.trim() } : c);
        setPhoneSuccess(true); setPhoneStep("idle"); setPhoneNew(""); setPhoneCode("");
        setTimeout(() => setPhoneSuccess(false), 3000);
      } else setPhoneError(res.error || "Неверный код");
    } catch { setPhoneError("Ошибка"); }
    finally { setPhoneLoading(false); }
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

  // Chat polling
  const pollChat = useCallback(async () => {
    try {
      const res = await fetch(`${CHAT_POLL_URL}?session_id=${chatSessionId.current}&after_id=${chatLastIdRef.current}`);
      const data = await res.json();
      if (data.messages?.length > 0) {
        setChatMessages(prev => [...prev, ...data.messages.map((m: {id:number;text:string;time:string}) => ({
          id: m.id, from: "operator" as const, text: m.text, time: m.time,
        }))]);
        chatLastIdRef.current = data.messages[data.messages.length - 1].id;
        setChatUnread(prev => prev + data.messages.length);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (step !== "cabinet") return;
    chatPollRef.current = setInterval(pollChat, 4000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [step, pollChat]);

  useEffect(() => {
    if (view === "chat") {
      setChatUnread(0);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [view, chatMessages]);

  function sendChatMessage() {
    const text = chatInput.trim();
    if (!text || chatSending) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { from: "user", text, time: nowTime() }]);
    setChatSending(true);
    fetch(CHAT_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: chatSessionId.current, text }),
    }).catch(() => {});
    setTimeout(() => {
      setChatMessages(prev => [...prev, { from: "bot", text: "Сообщение получено. Менеджер ответит в ближайшее время.", time: nowTime() }]);
      setChatSending(false);
    }, 800);
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

  // ── Экран входа ─────────────────────────────────────────────────────────────

  if (step === "phone" || step === "code") {
    return (
      <CabinetLogin
        step={step}
        phone={phone} setPhone={setPhone}
        channel={channel} setChannel={setChannel}
        email={email} setEmail={setEmail}
        code={code} setCode={setCode}
        loading={loading} error={error}
        setStep={setStep} setCode2={setCode} setError={setError}
        handleRequestOtp={handleRequestOtp}
        handleVerifyOtp={handleVerifyOtp}
      />
    );
  }

  // ── Кабинет ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 shadow-sm h-16 flex items-center px-6">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(view === "ticket" || view === "new" || view === "review" || view === "chat" || view === "profile" || view === "orders" || view === "requisites") && (
              <button
                onClick={() => { setView("list"); setSelectedTicket(null); setError(""); setReviewSent(false); }}
                className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500"
              >
                <Icon name="ArrowLeft" size={18} />
              </button>
            )}
            <span className="font-oswald text-lg font-bold tracking-wide hidden sm:block">
              <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
            </span>
            <span className="font-semibold text-gray-900">
              {view === "list" && "Мои заявки"}
              {view === "new" && "Новая заявка"}
              {view === "ticket" && selectedTicket && `Заявка #${selectedTicket.id}`}
              {view === "review" && "Оставить отзыв"}
              {view === "chat" && "Чат с менеджером"}
              {view === "profile" && "Профиль"}
              {view === "orders" && "Мои заказы"}
              {view === "requisites" && "Реквизиты"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Мои заказы */}
            <button
              onClick={() => { setView("orders"); loadOrders(); }}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${view === "orders" ? "bg-[#3ca615] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Icon name="ShoppingBag" size={15} />
              <span className="hidden sm:inline">Заказы</span>
            </button>
            {/* Кнопка чата */}
            <button
              onClick={() => { setView("chat"); setChatUnread(0); }}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                view === "chat" ? "bg-[#3ca615] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon name="MessageCircle" size={15} />
              <span className="hidden sm:inline">Чат</span>
              {chatUnread > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
                  <span className="text-white text-[10px] font-bold leading-none">{chatUnread}</span>
                </span>
              )}
            </button>
            {/* Аватар/кнопка профиля */}
            <button
              onClick={() => setView("profile")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition ${view === "profile" ? "bg-[#edf7e8]" : "hover:bg-gray-50"}`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#edf7e8] border-2 border-[#3ca615]/20 flex items-center justify-center shrink-0">
                {client?.avatar_url
                  ? <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <Icon name="User" size={15} className="text-[#3ca615]" />}
              </div>
              <span className="text-sm text-gray-600 hidden sm:block max-w-[100px] truncate">
                {client?.name || client?.phone || phone}
              </span>
            </button>
            <button
              onClick={() => setView("requisites")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${view === "requisites" ? "bg-[#3ca615] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <Icon name="Building2" size={15} />
              <span className="hidden sm:inline">Реквизиты</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition"
            >
              <Icon name="LogOut" size={15} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* ── Список заявок ── */}
        {view === "list" && (
          <CabinetTicketList
            tickets={tickets}
            error={error}
            client={client}
            onOpenTicket={handleOpenTicket}
            onNewTicket={() => { setView("new"); setError(""); }}
            onReview={() => { setView("review"); setReviewTicketId(undefined); setReviewSent(false); setError(""); }}
            onProfile={() => setView("profile")}
          />
        )}

        {/* ── Профиль ── */}
        {view === "profile" && client && (
          <CabinetProfile
            client={client}
            onBack={() => setView("list")}
            onClientUpdate={c => setClient(c)}
          />
        )}

        {/* ── Просмотр заявки ── */}
        {view === "ticket" && selectedTicket && (
          <CabinetTicketDetail
            ticket={selectedTicket}
            comment={comment}
            setComment={setComment}
            loading={loading}
            error={error}
            onAddComment={handleAddComment}
          />
        )}

        {/* ── Новая заявка ── */}
        {view === "new" && (
          <CabinetNewTicket
            newTicket={newTicket}
            setNewTicket={setNewTicket}
            loading={loading}
            error={error}
            onSubmit={handleCreateTicket}
            onCancel={() => { setView("list"); setError(""); }}
          />
        )}

        {/* ── Отзыв ── */}
        {view === "review" && (
          <CabinetReview
            tickets={tickets}
            reviewSent={reviewSent}
            reviewRating={reviewRating}
            setReviewRating={setReviewRating}
            reviewText={reviewText}
            setReviewText={setReviewText}
            reviewTicketId={reviewTicketId}
            setReviewTicketId={setReviewTicketId}
            loading={loading}
            error={error}
            onSubmit={handleSubmitReview}
            onCancel={() => { setView("list"); setError(""); }}
            onBack={() => { setView("list"); setReviewSent(false); }}
          />
        )}

        {/* ── Чат с менеджером ── */}
        {view === "chat" && (
          <CabinetChat
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatSending={chatSending}
            chatBottomRef={chatBottomRef}
            sendChatMessage={sendChatMessage}
          />
        )}

        {/* ── Мои заказы ── */}
        {view === "orders" && (
          <CabinetOrders
            orders={orders}
            ordersLoading={ordersLoading}
          />
        )}

        {/* ── Реквизиты ── */}
        {view === "requisites" && (
          <CabinetRequisites
            requisites={requisites}
            setRequisites={setRequisites}
            reqSaving={reqSaving}
            reqSuccess={reqSuccess}
            onSave={async () => {
              setReqSaving(true); setReqSuccess(false);
              await new Promise(r => setTimeout(r, 400));
              localStorage.setItem("profix_requisites", JSON.stringify(requisites));
              setReqSaving(false); setReqSuccess(true);
              setTimeout(() => setReqSuccess(false), 3000);
            }}
          />
        )}

      </main>
    </div>
  );
}
