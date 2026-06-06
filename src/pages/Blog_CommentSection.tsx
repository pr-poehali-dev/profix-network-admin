import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { blogApi, Comment } from "@/lib/blog-api";
import { clientSession, clientApi, managerSession, managerApi, techSession, techApi } from "@/lib/crm-api";
import { EMOJI_LIST } from "./Blog_Cards";

export function CommentSection({ postId, comments: initialComments, commentsMode = "users", onCommentAdded }: {
  postId: number;
  comments: Comment[];
  commentsMode?: "open" | "users" | "closed";
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
  const [isModerator, setIsModerator] = useState(false);
  const [clientLoading, setClientLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);

  useEffect(() => {
    async function resolve() {
      const clientToken = clientSession.get();
      if (clientToken) {
        try {
          const r = await clientApi.verifyToken(clientToken);
          if (r.valid && r.client) { setClientName(r.client.name || r.client.phone || "Клиент"); return; }
        } catch { /* ignore */ }
      }
      const mgrToken = managerSession.get();
      if (mgrToken) {
        try {
          const r = await managerApi.getManagerProfile();
          if (r.profile) { setClientName(r.profile.name || "Менеджер"); setIsModerator(true); return; }
        } catch { /* ignore */ }
      }
      const techToken = techSession.get();
      if (techToken) {
        try {
          const r = await techApi.verifyToken(techToken);
          if (r.valid) { setClientName(r.name || r.technician?.name || "Специалист"); return; }
        } catch { /* ignore */ }
      }
    }
    resolve().finally(() => setClientLoading(false));
  }, []);

  async function handleSend() {
    if (!clientName || !text.trim()) return;
    setSending(true);
    try {
      const res = await blogApi.addComment(postId, text.trim());
      if (res.ok) { setComments(prev => [...prev, res.comment]); onCommentAdded(res.comment); setText(""); }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  function startEdit(c: Comment) {
    setEditingId(c.id); setEditText(c.text); setConfirmRemoveId(null);
    setTimeout(() => editRef.current?.focus(), 50);
  }

  function cancelEdit() { setEditingId(null); setEditText(""); }

  async function saveEdit(commentId: number) {
    if (!editText.trim()) return;
    setEditSaving(true);
    try {
      const res = await blogApi.updateComment(commentId, editText.trim());
      if (res.ok) {
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, text: editText.trim(), edited_by: res.edited_by || clientName } : c
        ));
        setEditingId(null);
      }
    } catch { /* ignore */ }
    finally { setEditSaving(false); }
  }

  async function handleRemove(commentId: number) {
    try {
      const res = await blogApi.removeComment(commentId);
      if (res.ok) {
        setComments(prev => prev.map(c =>
          c.id === commentId ? { ...c, is_hidden: true, hidden_by: clientName, text: "[Комментарий удалён]" } : c
        ));
      }
    } catch { /* ignore */ }
    finally { setConfirmRemoveId(null); }
  }

  function insertEmoji(emoji: string) {
    const ta = textRef.current;
    if (!ta) { setText(t => t + emoji); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    setText(text.slice(0, s) + emoji + text.slice(e));
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + emoji.length; ta.focus(); }, 0);
    setShowEmoji(false);
  }

  async function handleReact(commentId: number, reaction: "like" | "dislike") {
    const res = await blogApi.react(null, reaction, commentId);
    if (res.ok) {
      setReactions(prev => ({ ...prev, [commentId]: res.reactions }));
      setMyReactions(prev => ({ ...prev, [commentId]: reaction }));
    }
  }

  const visibleCount = comments.filter(c => !c.is_hidden).length;

  return (
    <div className="mt-8">
      <h3 className="font-oswald font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
        <Icon name="MessageCircle" size={18} className="text-[#3ca615]" />
        Комментарии ({visibleCount})
      </h3>

      {visibleCount === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl mb-4">
          Будьте первым, кто оставит комментарий!
        </div>
      )}

      <div className="space-y-3 mb-6">
        {comments.map(c => {
          const isOwn = !!clientName && c.author_name === clientName;
          const canEdit = (isOwn || isModerator) && !c.is_hidden;
          const canRemove = (isOwn || isModerator) && !c.is_hidden;
          const isEditing = editingId === c.id;
          const isConfirming = confirmRemoveId === c.id;

          // Скрытый комментарий — только модераторы видят детали
          if (c.is_hidden && !isModerator) {
            return (
              <div key={c.id} className="rounded-2xl px-4 py-3 bg-gray-50 border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 italic flex items-center gap-1.5">
                  <Icon name="EyeOff" size={12} />
                  Комментарий удалён модератором
                </p>
              </div>
            );
          }

          return (
            <div key={c.id} className={`rounded-2xl p-4 border transition-colors ${
              isEditing    ? "bg-[#edf7e8] border-[#3ca615]/30" :
              isConfirming ? "bg-red-50 border-red-200" :
              c.is_hidden  ? "bg-gray-50 border-dashed border-gray-300 opacity-70" :
                             "bg-gray-50 border-transparent"
            }`}>

              {/* Шапка */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="w-7 h-7 rounded-full bg-[#edf7e8] flex items-center justify-center shrink-0">
                  <Icon name="User" size={13} className="text-[#3ca615]" />
                </div>
                <span className="text-xs font-semibold text-gray-700">{c.author_name}</span>

                {!isEditing && !isConfirming && (canEdit || canRemove) && (
                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button onClick={() => startEdit(c)}
                        className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-[#3ca615] transition-colors px-1.5 py-0.5 rounded-lg hover:bg-white">
                        <Icon name="Pencil" size={10} />Изменить
                      </button>
                    )}
                    {canRemove && (
                      <button onClick={() => { setConfirmRemoveId(c.id); setEditingId(null); }}
                        className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-red-500 transition-colors px-1.5 py-0.5 rounded-lg hover:bg-white">
                        <Icon name="Trash2" size={10} />Удалить
                      </button>
                    )}
                  </div>
                )}

                <span className="text-xs text-gray-400 ml-auto shrink-0">
                  {new Date(c.created_at).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Подтверждение удаления */}
              {isConfirming && (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-medium">Удалить этот комментарий?</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleRemove(c.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition">
                      <Icon name="Trash2" size={12} />Удалить
                    </button>
                    <button onClick={() => setConfirmRemoveId(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                      <Icon name="X" size={12} />Отмена
                    </button>
                  </div>
                </div>
              )}

              {/* Редактирование */}
              {isEditing && (
                <div className="space-y-2">
                  <textarea ref={editRef} value={editText} onChange={e => setEditText(e.target.value)}
                    rows={3} className="w-full border border-[#3ca615]/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615] resize-none bg-white" />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit(c.id)} disabled={editSaving || !editText.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-semibold disabled:opacity-50 transition"
                      style={{ backgroundColor: "#3ca615" }}>
                      {editSaving ? <Icon name="Loader2" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />}
                      Сохранить
                    </button>
                    <button onClick={cancelEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                      <Icon name="X" size={12} />Отмена
                    </button>
                  </div>
                </div>
              )}

              {/* Текст + пометки */}
              {!isEditing && !isConfirming && (
                <>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${c.is_hidden ? "text-gray-400 italic" : "text-gray-700"}`}>
                    {c.is_hidden ? "[Комментарий удалён]" : c.text}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    {c.edited_by && !c.is_hidden && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Icon name="Pencil" size={9} />
                        изменено{c.edited_by !== c.author_name ? ` модератором (${c.edited_by})` : ""}
                      </span>
                    )}
                    {c.is_hidden && isModerator && c.hidden_by && (
                      <span className="text-[10px] text-red-400 flex items-center gap-1">
                        <Icon name="EyeOff" size={9} />удалено ({c.hidden_by})
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* Лайки */}
              {!isEditing && !isConfirming && !c.is_hidden && (
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
              )}
            </div>
          );
        })}
      </div>

      {/* Форма */}
      {commentsMode === "closed" ? (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-400 text-sm">
          <Icon name="MessageSquareOff" size={18} className="shrink-0" />
          Комментарии к этой публикации отключены
        </div>
      ) : clientLoading ? (
        <div className="flex items-center justify-center py-4">
          <Icon name="Loader2" size={20} className="animate-spin text-gray-300" />
        </div>
      ) : commentsMode === "users" && !clientName ? (
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
              style={{ background: "#3ca615" }}>Войти</button>
            <button onClick={() => navigate("/cabinet?tab=register")}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#3ca615] text-[#3ca615] hover:bg-[#edf7e8] transition-colors text-center">
              Зарегистрироваться</button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs text-gray-500">
            {clientName
              ? <>Комментируете как: <b className="text-[#3ca615]">{clientName}</b>
                  {isModerator && <span className="ml-1 text-amber-600 font-medium">(модератор)</span>}</>
              : "Комментировать может любой посетитель"}
          </p>
          <div className="relative">
            <textarea ref={textRef} value={text} onChange={e => setText(e.target.value)}
              placeholder="Напишите комментарий..." rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] resize-none pr-10" />
            <button onClick={() => setShowEmoji(v => !v)}
              className="absolute right-2 bottom-2 text-gray-400 hover:text-[#3ca615] transition-colors text-lg">😊</button>
            {showEmoji && (
              <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-20 flex flex-wrap gap-1.5 w-64">
                {EMOJI_LIST.map(e => (
                  <button key={e} onClick={() => insertEmoji(e)}
                    className="text-xl hover:scale-125 transition-transform leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">{e}</button>
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
