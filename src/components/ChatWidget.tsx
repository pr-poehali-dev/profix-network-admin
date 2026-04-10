import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

interface Message {
  from: "user" | "bot";
  text: string;
  time: string;
}

const QUICK_QUESTIONS = [
  "Сколько стоит внедрение 1С?",
  "Как зарегистрировать онлайн-кассу?",
  "Какие ТСД вы продаёте?",
  "Заправка картриджей — цены?",
  "Монтаж локальной сети",
];

const BOT_ANSWERS: Record<string, string> = {
  "Сколько стоит внедрение 1С?": "Стоимость внедрения 1С зависит от конфигурации и объёма работ. Оставьте заявку — мы свяжемся и рассчитаем под ваши задачи.",
  "Как зарегистрировать онлайн-кассу?": "Мы поможем подобрать, купить и поставить на учёт ККТ в ФНС под ключ. Позвоните нам или оставьте заявку!",
  "Какие ТСД вы продаёте?": "Продаём и настраиваем ТСД АТОЛ, POScenter и другие модели. Поддержка Честного знака и интеграция с 1С включены.",
  "Заправка картриджей — цены?": "Заправляем лазерные и струйные картриджи. Цена зависит от модели. Уточните марку — скажем стоимость сразу.",
  "Монтаж локальной сети": "Проектируем и монтируем локальные сети для офисов, складов и магазинов. Оставьте заявку — выедем и оценим объём работ.",
};

const now = () =>
  new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const GREETING: Message = {
  from: "bot",
  text: "Здравствуйте! Я помогу ответить на ваши вопросы. Выберите тему или напишите сообщение:",
  time: now(),
};

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const addMessage = (msg: Message) =>
    setMessages((prev) => [...prev, msg]);

  const notifyTelegram = (question: string) => {
    fetch("https://functions.poehali.dev/27bacb22-5ee1-4b45-8d95-45c4816274e0", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }).catch(() => {});
  };

  const handleQuick = (q: string) => {
    addMessage({ from: "user", text: q, time: now() });
    notifyTelegram(q);
    setSending(true);
    setTimeout(() => {
      addMessage({
        from: "bot",
        text: BOT_ANSWERS[q] || "Спасибо за вопрос! Мы свяжемся с вами в ближайшее время.",
        time: now(),
      });
      setSending(false);
    }, 700);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addMessage({ from: "user", text, time: now() });
    notifyTelegram(text);
    setSending(true);
    setTimeout(() => {
      addMessage({
        from: "bot",
        text: "Спасибо за вопрос! Наш специалист свяжется с вами в ближайшее время. Или позвоните нам: +7 (914) 272-71-87",
        time: now(),
      });
      setSending(false);
    }, 800);
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
                    : "bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100"
                }`}>
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
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3ca615] rounded-full border-2 border-white" />
        )}
      </button>
    </>
  );
};

export default ChatWidget;