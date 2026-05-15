import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { blogApi, Comment } from "@/lib/blog-api";
import { clientSession, clientApi } from "@/lib/crm-api";
import { EMOJI_LIST } from "./Blog_Cards";

export function CommentSection({ postId, comments: initialComments, onCommentAdded }: {
  postId: number;
  comments: Comment[];
  onCommentAdded: (c: Comment) => void;
}) {
  const navigate = useNavigate();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactions, setReactions] = useState<Record<number, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<number, string>>({});
  const textRef = useRef<HTMLTextAreaElement>(null);

  const [clientName, setClientName] = useState("");
  const [clientLoading, setClientLoading] = useState(true);

  useEffect(() => {
    const token = clientSession.get();
    if (token) {
      clientApi.verifyToken(token)
        .then(r => { if (r.valid && r.client) setClientName(r.client.name || r.client.phone || "Клиент"); })
        .catch(() => {})
        .finally(() => setClientLoading(false));
    } else {
      setClientLoading(false);
    }
  }, []);

  async function handleSend() {
    if (!clientName || !text.trim()) return;
    setSending(true);
    try {
      const res = await blogApi.addComment(postId, text.trim());
      if (res.ok) {
        setComments(prev => [...prev, res.comment]);
        onCommentAdded(res.comment);
        setText("");
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  function insertEmoji(emoji: string) {
    const ta = textRef.current;
    if (!ta) { setText(t => t + emoji); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    setText(text.slice(0, start) + emoji + text.slice(end));
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }, 0);
    setShowEmoji(false);
  }

  async function handleReact(commentId: number, reaction: "like" | "dislike") {
    const res = await blogApi.react(null, reaction, commentId);
    if (res.ok) {
      setReactions(prev => ({ ...prev, [commentId]: res.reactions }));
      setMyReactions(prev => ({ ...prev, [commentId]: reaction }));
    }
  }

  return (
    <div className="mt-8">
      <h3 className="font-oswald font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
        <Icon name="MessageCircle" size={18} className="text-[#3ca615]" />
        Комментарии ({comments.length})
      </h3>

      {comments.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl mb-4">
          Будьте первым, кто оставит комментарий!
        </div>
      )}

      <div className="space-y-3 mb-6">
        {comments.map(c => (
          <div key={c.id} className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-[#edf7e8] flex items-center justify-center shrink-0">
                <Icon name="User" size={13} className="text-[#3ca615]" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{c.author_name}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(c.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.text}</p>
            <div className="flex items-center gap-3 mt-2">
              <button onClick={() => handleReact(c.id, "like")}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${myReactions[c.id] === "like" ? "bg-green-100 text-green-700" : "text-gray-400 hover:bg-gray-100"}`}>
                <Icon name="ThumbsUp" size={12} />{(reactions[c.id] || {}).like || 0}
              </button>
              <button onClick={() => handleReact(c.id, "dislike")}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${myReactions[c.id] === "dislike" ? "bg-red-100 text-red-700" : "text-gray-400 hover:bg-gray-100"}`}>
                <Icon name="ThumbsDown" size={12} />{(reactions[c.id] || {}).dislike || 0}
              </button>
            </div>
          </div>
        ))}
      </div>

      {clientLoading ? (
        <div className="flex items-center justify-center py-4">
          <Icon name="Loader2" size={20} className="animate-spin text-gray-300" />
        </div>
      ) : !clientName ? (
        <div className="bg-gradient-to-br from-[#edf7e8] to-white border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#3ca615] rounded-full flex items-center justify-center shrink-0">
              <Icon name="UserPlus" size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Присоединяйтесь к обсуждению!</p>
              <p className="text-xs text-gray-500">Войдите или зарегистрируйтесь, чтобы оставить комментарий</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate("/cabinet?tab=login")}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold text-center"
              style={{ background: "#3ca615" }}>
              Войти
            </button>
            <button onClick={() => navigate("/cabinet?tab=register")}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#3ca615] text-[#3ca615] hover:bg-[#edf7e8] transition-colors text-center">
              Зарегистрироваться
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-gray-500">Комментируете как: <b className="text-[#3ca615]">{clientName}</b></p>
          <div className="relative">
            <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
              placeholder="Напишите комментарий..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] resize-none pr-10" />
            <button onClick={() => setShowEmoji(v => !v)}
              className="absolute right-2 bottom-2 text-gray-400 hover:text-[#3ca615] transition-colors text-lg">
              😊
            </button>
            {showEmoji && (
              <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-20 flex flex-wrap gap-1.5 w-64">
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)}
                    className="text-xl hover:scale-125 transition-transform leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSend} disabled={sending || !text.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition"
            style={{ backgroundColor: "#3ca615" }}>
            {sending ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Send" size={15} />}
            Отправить
          </button>
        </div>
      )}
    </div>
  );
}
