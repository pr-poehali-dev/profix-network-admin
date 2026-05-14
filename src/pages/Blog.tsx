import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SEO from "@/components/SEO";
import { blogApi, Post, Comment } from "@/lib/blog-api";
import { useSiteContent } from "@/hooks/useSiteContent";
import { clientSession, clientApi } from "@/lib/crm-api";

const EMOJI_LIST = ["😀","😂","👍","❤️","🔥","👏","😮","🤔","💡","✅","🙏","💪","📌","⚡","🛠️","💻","📞","🏆"];

const TYPE_LABELS: Record<string, string> = {
  news: "Новости",
  article: "Статьи",
  video: "Видео",
  forum: "Форум",
};

const TYPE_ICONS: Record<string, string> = {
  news: "Newspaper",
  article: "FileText",
  video: "Play",
  forum: "MessageSquare",
};

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function getYouTubeEmbed(url: string): string | null {
  const id = getYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  if (url.includes("vk.com/video") || url.includes("vkvideo.ru")) return url;
  return url;
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "К";
  return String(n);
}

// ── Карточка в стиле YouTube ──────────────────────────────────────────────────
function VideoCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const ytId = post.video_url ? getYouTubeId(post.video_url) : null;
  const thumb = ytId
    ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
    : post.cover_url || null;

  return (
    <button onClick={onClick} className="w-full text-left group">
      {/* Превью */}
      <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video mb-3">
        {thumb ? (
          <img src={thumb} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <Icon name="FileText" size={32} className="text-gray-600" />
          </div>
        )}
        {ytId && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Icon name="Play" size={20} className="text-white ml-0.5" />
            </div>
          </div>
        )}
        {!ytId && post.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="Play" size={20} className="text-white ml-0.5" />
            </div>
          </div>
        )}
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-black/60 text-white">
          {TYPE_LABELS[post.type] || post.type}
        </span>
      </div>
      {/* Мета */}
      <div className="flex gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#3ca615] flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="Wrench" size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#3ca615] transition-colors">{post.title}</h3>
          <p className="text-xs text-gray-500 mt-1">ProFiX · {formatCount(post.views || 0)} просм. · {new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}</p>
          {post.excerpt && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{post.excerpt}</p>}
        </div>
      </div>
    </button>
  );
}

// ── Карточка для новостей/статей ─────────────────────────────────────────────
function ArticleCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full text-left flex gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all group border border-transparent hover:border-gray-100">
      <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {post.cover_url ? (
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name={TYPE_ICONS[post.type] as "Newspaper"} size={20} className="text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-[#3ca615] uppercase tracking-wide">{TYPE_LABELS[post.type]}</span>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#3ca615] transition-colors">{post.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Icon name="Eye" size={10} />{post.views}</span>
          <span className="flex items-center gap-1"><Icon name="MessageCircle" size={10} />{post.comment_count || 0}</span>
          <span>{new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}</span>
        </div>
      </div>
    </button>
  );
}

// ── Карточка форума с предпросмотром ──────────────────────────────────────────
function ForumCard({ post, onClick, isLoggedIn }: { post: Post; onClick: () => void; isLoggedIn: boolean }) {
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-100 p-4 hover:border-[#3ca615]/30 hover:shadow-sm transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-[#edf7e8] flex items-center justify-center shrink-0">
          <Icon name="MessageSquare" size={15} className="text-[#3ca615]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#3ca615] transition-colors line-clamp-2">{post.title}</h3>
          {post.excerpt && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Icon name="MessageCircle" size={10} />{post.comment_count || 0} ответ.</span>
            <span className="flex items-center gap-1"><Icon name="Eye" size={10} />{post.views}</span>
            <span>{new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}</span>
          </div>
        </div>
        {!isLoggedIn && (
          <div className="shrink-0">
            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5 font-medium">войти</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Секция комментариев ───────────────────────────────────────────────────────
function CommentSection({ postId, comments: initialComments, onCommentAdded, navigate }: {
  postId: number;
  comments: Comment[];
  onCommentAdded: (c: Comment) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
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

// ═══════════════════════════════════════════════════════════════════════════════
export default function Blog() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { str } = useSiteContent();

  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("type") || "all");
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const youtubeChannel = str("blog.youtube_channel", "");
  const subscribersCount = str("blog.subscribers", "");
  const channelDesc = str("blog.channel_desc", "IT-советы, разборы техники и жизнь сервисного центра в Якутске");

  useEffect(() => {
    const token = clientSession.get();
    if (token) {
      clientApi.verifyToken(token).then(r => setIsLoggedIn(r.valid)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      blogApi.getPost(Number(id))
        .then(r => { if (r.post) { setPost(r.post); setReactions(r.post.reactions || {}); } })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      blogApi.getPosts(filter === "all" ? undefined : filter)
        .then(r => { if (r.posts) setPosts(r.posts); })
        .finally(() => setLoading(false));
    }
  }, [id, filter]);

  function changeFilter(f: string) {
    setFilter(f);
    setSearchParams(f === "all" ? {} : { type: f });
  }

  async function handleReact(reaction: "like" | "dislike") {
    if (!post) return;
    const res = await blogApi.react(post.id, reaction);
    if (res.ok) { setReactions(res.reactions); setMyReaction(reaction); }
  }

  const embed = post?.video_url ? getYouTubeEmbed(post.video_url) : null;
  const videoPosts = posts.filter(p => p.type === "video");
  const otherPosts = posts.filter(p => p.type !== "video");
  const forumPosts = posts.filter(p => p.type === "forum");
  const contentPosts = posts.filter(p => p.type !== "forum");

  // ── Детальный просмотр поста ───────────────────────────────────────────────
  if (id && post) {
    const ytId = post.video_url ? getYouTubeId(post.video_url) : null;
    return (
      <div className="min-h-screen bg-[#0F0F0F] font-golos">
        <SEO
          title={`${post.title} — ProFiX`}
          description={post.excerpt || post.title}
          image={post.cover_url || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : undefined)}
          type="article"
          publishedTime={post.created_at}
          canonical={`/blog/${post.id}`}
        />

        {/* Шапка */}
        <header className="bg-[#0F0F0F] border-b border-white/10 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => navigate("/blog")} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <span className="font-oswald text-lg font-bold">
              <span className="text-[#3ca615]">ПРО</span><span className="text-white">ФИКС</span>
            </span>
            {youtubeChannel && (
              <a href={youtubeChannel} target="_blank" rel="noopener noreferrer"
                className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition">
                <Icon name="Play" size={13} />Подписаться
              </a>
            )}
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Основной контент */}
            <div className="lg:col-span-2">
              {/* Видео или обложка */}
              {embed ? (
                <div className="rounded-2xl overflow-hidden aspect-video mb-5">
                  <iframe src={embed} title={post.title}
                    className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen />
                </div>
              ) : post.cover_url ? (
                <div className="rounded-2xl overflow-hidden max-h-96 mb-5">
                  <img src={post.cover_url} alt={post.title} className="w-full object-cover" />
                </div>
              ) : null}

              {/* Тип + дата */}
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1 text-xs font-semibold text-[#3ca615] bg-[#3ca615]/10 px-2.5 py-1 rounded-lg">
                  <Icon name={TYPE_ICONS[post.type] as "Newspaper"} size={12} />
                  {TYPE_LABELS[post.type]}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                  <Icon name="Eye" size={12} />{post.views}
                </span>
              </div>

              <h1 className="font-oswald text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">{post.title}</h1>

              {/* Автор + реакции */}
              <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-5">
                <div className="w-9 h-9 rounded-full bg-[#3ca615] flex items-center justify-center">
                  <Icon name="Wrench" size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">ProFiX</p>
                  {subscribersCount && <p className="text-xs text-gray-400">{subscribersCount} подписчиков</p>}
                </div>
                {youtubeChannel && (
                  <a href={youtubeChannel} target="_blank" rel="noopener noreferrer"
                    className="ml-auto px-4 py-2 bg-white text-gray-900 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors">
                    Подписаться
                  </a>
                )}
                <div className="flex items-center gap-2 bg-white/10 rounded-full px-1">
                  <button onClick={() => handleReact("like")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${myReaction === "like" ? "text-[#3ca615]" : "text-white"}`}>
                    <Icon name="ThumbsUp" size={15} />{reactions.like || 0}
                  </button>
                  <div className="w-px h-5 bg-white/20" />
                  <button onClick={() => handleReact("dislike")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${myReaction === "dislike" ? "text-red-400" : "text-white"}`}>
                    <Icon name="ThumbsDown" size={15} />{reactions.dislike || 0}
                  </button>
                </div>
              </div>

              {/* Описание / контент */}
              {(post.excerpt || post.content) && (
                <div className="bg-white/5 rounded-2xl p-4 mb-6">
                  {post.excerpt && <p className="text-gray-300 text-sm font-medium mb-2">{post.excerpt}</p>}
                  {post.content && (
                    <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</div>
                  )}
                </div>
              )}

              {post.tags && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="text-xs text-gray-400 bg-white/10 px-2.5 py-1 rounded-full hover:bg-white/20 transition-colors cursor-pointer">#{tag}</span>
                  ))}
                </div>
              )}

              <CommentSection
                postId={post.id}
                comments={post.comments || []}
                onCommentAdded={() => {}}
                navigate={navigate}
              />
            </div>

            {/* Боковой список */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-sm">Другие публикации</h3>
              <div className="space-y-4">
                {posts.slice(0, 8).map(p => {
                  const sid = p.video_url ? getYouTubeId(p.video_url) : null;
                  const sThumb = sid ? `https://img.youtube.com/vi/${sid}/mqdefault.jpg` : p.cover_url;
                  return (
                    <button key={p.id} onClick={() => { navigate(`/blog/${p.id}`); window.scrollTo(0, 0); }}
                      className="w-full flex gap-2 text-left group">
                      <div className="w-28 h-16 rounded-lg overflow-hidden bg-gray-800 shrink-0 relative">
                        {sThumb ? <img src={sThumb} alt={p.title} className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon name="FileText" size={16} className="text-gray-600" />
                          </div>
                        )}
                        {(sid || p.type === "video") && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Icon name="Play" size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-[#3ca615] transition-colors">{p.title}</p>
                        <p className="text-[10px] text-gray-500 mt-1">ProFiX · {formatCount(p.views || 0)} просм.</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Список постов ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      <SEO
        title="Блог ProFiX — IT-советы, новости и видео из Якутска"
        description="Полезные статьи, новости IT-рынка Якутска, видео о ремонте оборудования и автоматизации бизнеса от компании ProFiX. Советы по 1С, кассам, сетям."
        keywords="IT блог Якутск, новости IT Якутия, ремонт компьютеров советы Якутск, 1С статьи Якутск, видео ккт"
        canonical="/blog"
      />

      {/* Шапка */}
      <header className="bg-[#0F0F0F] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={20} />
          </button>
          <span className="font-oswald text-lg font-bold">
            <span className="text-[#3ca615]">ПРО</span><span className="text-white">ФИКС</span>
          </span>

          {/* Фильтры в шапке */}
          <div className="hidden sm:flex items-center gap-1 ml-4">
            {[{ v: "all", l: "Все" }, { v: "video", l: "Видео" }, { v: "news", l: "Новости" }, { v: "article", l: "Статьи" }, { v: "forum", l: "Форум" }].map(f => (
              <button key={f.v} onClick={() => changeFilter(f.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f.v ? "bg-white text-gray-900" : "text-gray-400 hover:text-white"}`}>
                {f.l}
              </button>
            ))}
          </div>

          {youtubeChannel && (
            <a href={youtubeChannel} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition shrink-0">
              <Icon name="Play" size={13} />
              <span className="hidden sm:inline">YouTube канал</span>
              <span className="sm:hidden">YouTube</span>
            </a>
          )}
        </div>
      </header>

      {/* Баннер канала */}
      <div className="bg-gradient-to-b from-[#0F0F0F] to-[#1a1a1a] border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#3ca615] flex items-center justify-center shrink-0 shadow-lg shadow-[#3ca615]/30">
              <Icon name="Wrench" size={36} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-oswald text-2xl sm:text-3xl font-bold text-white mb-1">ProFiX</h1>
              <p className="text-gray-400 text-sm">{channelDesc}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {subscribersCount && <span className="flex items-center gap-1"><Icon name="Users" size={11} />{subscribersCount} подписчиков</span>}
                <span className="flex items-center gap-1"><Icon name="FileText" size={11} />{posts.length || "…"} публикаций</span>
              </div>
            </div>
            {youtubeChannel && (
              <a href={youtubeChannel} target="_blank" rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors">
                <Icon name="Play" size={16} className="text-red-600" />
                Подписаться
              </a>
            )}
          </div>

          {/* Фильтры на мобилке */}
          <div className="sm:hidden flex gap-2 mt-5 overflow-x-auto pb-1 -mx-1 px-1">
            {[{ v: "all", l: "Все" }, { v: "video", l: "Видео" }, { v: "news", l: "Новости" }, { v: "article", l: "Статьи" }, { v: "forum", l: "Форум" }].map(f => (
              <button key={f.v} onClick={() => changeFilter(f.v)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.v ? "bg-white text-gray-900" : "bg-white/10 text-gray-400"}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-[#3ca615]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
            <p>Публикаций пока нет</p>
          </div>
        ) : filter === "all" ? (
          // ── Главная страница: YouTube-раскладка ──────────────────────────
          <div className="space-y-10">
            {/* Видео-сетка */}
            {videoPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-oswald text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-600 rounded-md flex items-center justify-center">
                      <Icon name="Play" size={12} className="text-white ml-0.5" />
                    </div>
                    Видео
                  </h2>
                  <button onClick={() => changeFilter("video")} className="text-xs text-[#3ca615] hover:underline font-medium">Смотреть все</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {videoPosts.slice(0, 8).map(p => (
                    <VideoCard key={p.id} post={p} onClick={() => navigate(`/blog/${p.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Новости и статьи */}
            {otherPosts.filter(p => p.type !== "forum").length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-oswald text-xl font-bold text-gray-900">Новости и статьи</h2>
                  <button onClick={() => changeFilter("news")} className="text-xs text-[#3ca615] hover:underline font-medium">Смотреть все</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {otherPosts.filter(p => p.type !== "forum").slice(0, 8).map(p => (
                    <ArticleCard key={p.id} post={p} onClick={() => navigate(`/blog/${p.id}`)} />
                  ))}
                </div>
              </section>
            )}

            {/* Форум — предпросмотр + баннер регистрации */}
            {forumPosts.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-oswald text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Icon name="MessageSquare" size={20} className="text-[#3ca615]" />
                    Форум
                  </h2>
                  <button onClick={() => changeFilter("forum")} className="text-xs text-[#3ca615] hover:underline font-medium">Все темы</button>
                </div>

                {!isLoggedIn && (
                  <div className="bg-gradient-to-r from-[#3ca615]/10 to-blue-50 border border-[#3ca615]/20 rounded-2xl p-4 mb-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#3ca615] rounded-full flex items-center justify-center shrink-0">
                      <Icon name="Users" size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">Участвуйте в обсуждениях</p>
                      <p className="text-xs text-gray-500">Зарегистрируйтесь, чтобы писать и отвечать на вопросы</p>
                    </div>
                    <button onClick={() => navigate("/cabinet?tab=register")}
                      className="shrink-0 px-4 py-2 rounded-xl text-white text-xs font-bold"
                      style={{ background: "#3ca615" }}>
                      Войти
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {forumPosts.slice(0, 5).map(p => (
                    <ForumCard key={p.id} post={p} onClick={() => navigate(`/blog/${p.id}`)} isLoggedIn={isLoggedIn} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : filter === "video" ? (
          // ── Сетка видео ──────────────────────────────────────────────────
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {posts.map(p => <VideoCard key={p.id} post={p} onClick={() => navigate(`/blog/${p.id}`)} />)}
          </div>
        ) : filter === "forum" ? (
          // ── Форум с баннером регистрации ─────────────────────────────────
          <div>
            {!isLoggedIn && (
              <div className="bg-gradient-to-r from-[#3ca615]/10 to-blue-50 border border-[#3ca615]/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 bg-[#3ca615] rounded-full flex items-center justify-center shrink-0">
                  <Icon name="Users" size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900 mb-1">Присоединяйтесь к сообществу ProFiX</p>
                  <p className="text-sm text-gray-500">Задавайте вопросы, делитесь опытом и получайте ответы от IT-специалистов Якутска</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => navigate("/cabinet?tab=register")}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-bold"
                    style={{ background: "#3ca615" }}>
                    Зарегистрироваться
                  </button>
                  <button onClick={() => navigate("/cabinet?tab=login")}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Войти
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {posts.map(p => <ForumCard key={p.id} post={p} onClick={() => navigate(`/blog/${p.id}`)} isLoggedIn={isLoggedIn} />)}
            </div>
          </div>
        ) : (
          // ── Новости/Статьи ────────────────────────────────────────────────
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-w-3xl">
            {posts.map(p => <ArticleCard key={p.id} post={p} onClick={() => navigate(`/blog/${p.id}`)} />)}
          </div>
        )}
      </main>
    </div>
  );
}
