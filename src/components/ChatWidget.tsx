import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  id?: number;
  from: "user" | "bot" | "operator";
  text: string;
  time: string;
}

const CHAT_SEND_URL = "https://functions.poehali.dev/dc27ee8c-eb09-4007-98ec-35f6f9ed8904";
const CHAT_POLL_URL = "https://functions.poehali.dev/78247096-39f8-4785-b253-89644a37d1b1";

const QUICK_QUESTIONS = [
  "Сколько стоит внедрение 1С?",
  "Как зарегистрировать онлайн-кассу?",
  "Какие ТСД вы продаёте?",
  "Заправка картриджей — цены?",
  "Монтаж локальной сети",
];

const BOT_ANSWERS: Record<string, string> = {
  "Сколько стоит внедрение 1С?": "Стоимость зависит от конфигурации и объёма работ. Оператор уточнит детали — обычно отвечаем за 5 минут.",
  "Как зарегистрировать онлайн-кассу?": "Поможем подобрать, купить и поставить на учёт ККТ в ФНС под ключ. Оператор свяжется с вами.",
  "Какие ТСД вы продаёте?": "Продаём ТСД АТОЛ, POScenter и другие. Поддержка Честного знака и интеграция с 1С. Оператор уточнит наличие.",
  "Заправка картриджей — цены?": "Заправляем лазерные и струйные картриджи. Уточните марку у оператора — назовём стоимость сразу.",
  "Монтаж локальной сети": "Проектируем и монтируем сети для офисов, складов и магазинов. Оператор уточнит детали и стоимость.",
};

const now = () =>
  new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const getSessionId = () => {
  let sid = localStorage.getItem("profix_chat_session");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("profix_chat_session", sid);
  }
  return sid;
};

const GREETING: Message = {
  from: "bot",
  text: "Здравствуйте! Напишите вопрос — наш специалист ответит в ближайшее время. Или выберите тему:",
  time: now(),
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const lastIdRef = useRef(0);
  const sessionId = useRef(getSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const pollMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `${CHAT_POLL_URL}?session_id=${sessionId.current}&after_id=${lastIdRef.current}`
      );
      const data = await res.json();
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => [
          ...prev,
          ...data.messages.map((m: { id: number; text: string; time: string }) => ({
            id: m.id,
            from: "operator" as const,
            text: m.text,
            time: m.time,
          })),
        ]);
        lastIdRef.current = data.messages[data.messages.length - 1].id;
        if (!open) setHasNew(true);
      }
    } catch (_e) { /* ignore */ }
  }, [open]);

  useEffect(() => {
    pollRef.current = setInterval(pollMessages, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollMessages]);

  useEffect(() => {
    if (open) setHasNew(false);
  }, [open]);

  const sendToBackend = (text: string) => {
    fetch(CHAT_SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId.current, text }),
    }).catch(() => {});
  };

  const addMessage = (msg: Message) =>
    setMessages((prev) => [...prev, msg]);

  const handleQuick = (q: string) => {
    addMessage({ from: "user", text: q, time: now() });
    sendToBackend(q);
    setSending(true);
    setTimeout(() => {
      addMessage({
        from: "bot",
        text: BOT_ANSWERS[q] || "Вопрос передан оператору. Ожидайте ответа.",
        time: now(),
      });
      setSending(false);
    }, 600);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addMessage({ from: "user", text, time: now() });
    sendToBackend(text);
    setSending(true);
    setTimeout(() => {
      addMessage({
        from: "bot",
        text: "Вопрос передан оператору. Обычно отвечаем за 5 минут. Или звоните: +7 (914) 272-71-87",
        time: now(),
      });
      setSending(false);
    }, 600);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          style={{ height: "480px" }}>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1565C0]">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Icon name="MessageCircle" size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Чат поддержки ProFiX</p>
              <p className="text-blue-200 text-xs">Обычно отвечаем за 5 минут</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <Icon name="X" size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#f7f9fc]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.from === "user"
                    ? "bg-[#1565C0] text-white rounded-br-sm"
                    : msg.from === "operator"
                    ? "bg-[#edf7e8] text-gray-800 rounded-bl-sm shadow-sm border border-green-100"
                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                }`}>
                  {msg.from === "operator" && (
                    <p className="text-[10px] text-[#3ca615] font-semibold mb-1">Оператор</p>
                  )}
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.from === "user" ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-2 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => handleQuick(q)}
                    className="text-xs bg-white border border-[#1565C0]/30 text-[#1565C0] px-3 py-1.5 rounded-full hover:bg-[#1565C0] hover:text-white transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Напишите вопрос..."
              className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-[#1565C0]"
            />
            <button onClick={handleSend}
              className="w-9 h-9 bg-[#1565C0] rounded-full flex items-center justify-center hover:bg-[#1255a8] transition-colors shrink-0">
              <Icon name="Send" size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-[#1565C0] rounded-full shadow-lg flex items-center justify-center hover:bg-[#1255a8] transition-all hover:scale-105">
        <Icon name={open ? "X" : "MessageCircle"} size={26} className="text-white" />
        {!open && hasNew && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">!</span>
          </span>
        )}
        {!open && !hasNew && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3ca615] rounded-full border-2 border-white" />
        )}
      </button>
    </>
  );
};

export default ChatWidget;