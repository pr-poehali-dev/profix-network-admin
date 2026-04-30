import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

export interface BellNotification {
  id: string;
  type: "ticket" | "comment" | "review" | "chat";
  title: string;
  body: string;
  time: string;
  read: boolean;
  onClick?: () => void;
}

interface Props {
  notifications: BellNotification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
  onGoChat?: () => void;
}

const TYPE_ICON: Record<string, string> = {
  ticket:  "Ticket",
  comment: "MessageSquare",
  review:  "Star",
  chat:    "MessageCircle",
};

const TYPE_COLOR: Record<string, string> = {
  ticket:  "bg-red-100 text-red-600",
  comment: "bg-blue-100 text-blue-600",
  review:  "bg-yellow-100 text-yellow-600",
  chat:    "bg-green-100 text-green-600",
};

export default function AdminBell({ notifications, onRead, onReadAll, onGoChat }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        title="Уведомления"
      >
        <Icon name="Bell" size={18} className="text-white" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center px-1">
            <span className="text-white text-[10px] font-bold leading-none">{unread > 99 ? "99+" : unread}</span>
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Шапка */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-900">
              Уведомления {unread > 0 && <span className="text-xs text-red-500 font-bold">({unread})</span>}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={onReadAll} className="text-xs text-gray-400 hover:text-green-600 transition-colors">
                  Прочитать все
                </button>
              )}
              {onGoChat && (
                <button onClick={() => { setOpen(false); onGoChat(); }}
                  className="flex items-center gap-1 text-xs text-white px-2 py-1 rounded-lg" style={{background:"#3ca615"}}>
                  <Icon name="MessageCircle" size={12} /> Чат
                </button>
              )}
            </div>
          </div>

          {/* Список */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Icon name="BellOff" size={28} className="mx-auto mb-2 opacity-30" />
                Нет уведомлений
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { onRead(n.id); n.onClick?.(); setOpen(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${!n.read ? "bg-blue-50/40" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${TYPE_COLOR[n.type] || "bg-gray-100 text-gray-500"}`}>
                    <Icon name={TYPE_ICON[n.type] as "Bell"} size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{n.body}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{n.time}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-2" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
