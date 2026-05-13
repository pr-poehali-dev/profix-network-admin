import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
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

function getYouTubeEmbed(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  if (url.includes("vk.com/video") || url.includes("vkvideo.ru")) return url;
  return url;
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const embed = post.video_url ? getYouTubeEmbed(post.video_url) : null;
  return (
    <button onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#3ca615]/30 transition-all group overflow-hidden">
      {post.cover_url && !embed && (
        <div className="h-44 overflow-hidden">
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      {embed && (
        <div className="h-44 bg-black flex items-center justify-center relative overflow-hidden">
          <img src={`https://img.youtube.com/vi/${embed.split("/embed/")[1]?.split("?")[0]}/mqdefault.jpg`}
            alt={post.title} className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl">
              <Icon name="Play" size={24} className="text-white ml-1" />
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 text-xs font-semibold text-[#3ca615] bg-[#edf7e8] px-2 py-0.5 rounded-lg">
            <Icon name={TYPE_ICONS[post.type] as "Newspaper"} size={11} />
            {TYPE_LABELS[post.type] || post.type}
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long" })}
          </span>
        </div>
        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#3ca615] transition-colors">{post.title}</h3>
        {post.excerpt && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Icon name="Eye" size={11} />{post.views}</span>
          <span className="flex items-center gap-1"><Icon name="MessageCircle" size={11} />{post.comment_count || 0}</span>
          {post.reactions?.like && <span className="flex items-center gap-1"><Icon name="ThumbsUp" size={11} className="text-[#3ca615]" />{post.reactions.like}</span>}
        </div>
      </div>
    </button>
  );
}

function CommentSection({ postId, comments: initialComments, onCommentAdded }: {
  postId: number;
  comments: Comment[];
  onCommentAdded: (c: Comment) => void;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactions, setReactions] = useState<Record<number, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<number, string>>({});
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Клиент авторизован?
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
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
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
    <div className="mt-6">
      <h3 className="font-oswald font-bold text-base text-gray-900 mb-4 flex items-center gap-2">
        <Icon name="MessageCircle" size={16} className="text-[#3ca615]" />
        Комментарии ({comments.length})
      </h3>

      {comments.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-2xl mb-4">
          Будьте первым, кто оставит комментарий!
        </div>
      )}

      <div className="space-y-3 mb-5">
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
                <Icon name="ThumbsUp" size={12} />
                {(reactions[c.id] || {}).like || 0}
              </button>
              <button onClick={() => handleReact(c.id, "dislike")}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${myReactions[c.id] === "dislike" ? "bg-red-100 text-red-700" : "text-gray-400 hover:bg-gray-100"}`}>
                <Icon name="ThumbsDown" size={12} />
                {(reactions[c.id] || {}).dislike || 0}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Форма комментария — только для авторизованных */}
      {clientLoading ? (
        <div className="flex items-center justify-center py-4">
          <Icon name="Loader2" size={20} className="animate-spin text-gray-300" />
        </div>
      ) : !clientName ? (
        <div className="bg-[#edf7e8] border border-green-200 rounded-2xl p-5 text-center">
          <Icon name="Lock" size={24} className="text-[#3ca615] mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-800 mb-1">Войдите, чтобы комментировать</p>
          <p className="text-xs text-gray-500 mb-4">Комментарии доступны только для зарегистрированных пользователей</p>
          <a href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: "#3ca615" }}>
            <Icon name="LogIn" size={15} />
            Войти в личный кабинет
          </a>
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

export default function Blog() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { str } = useSiteContent();

  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const sessionId = blogApi.getSessionId();

  const youtubeChannel = str("blog.youtube_channel", "");

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

  async function handleReact(reaction: "like" | "dislike") {
    if (!post) return;
    const res = await blogApi.react(post.id, reaction);
    if (res.ok) {
      setReactions(res.reactions);
      setMyReaction(reaction);
    }
  }

  const embed = post?.video_url ? getYouTubeEmbed(post.video_url) : null;

  if (id && post) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] font-golos">
        <SEO
          title={post.title}
          description={post.excerpt || post.title}
          image={post.cover_url}
          type="article"
          publishedTime={post.created_at}
          canonical={`/blog/${post.id}`}
        />
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <button onClick={() => navigate("/blog")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <span className="font-oswald text-lg font-bold">
              <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-semibold text-[#3ca615] bg-[#edf7e8] px-2.5 py-1 rounded-lg">
              <Icon name={TYPE_ICONS[post.type] as "Newspaper"} size={12} />
              {TYPE_LABELS[post.type]}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
              <Icon name="Eye" size={12} />{post.views}
            </span>
          </div>

          <h1 className="font-oswald text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>

          {post.author_name && (
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-full bg-[#edf7e8] flex items-center justify-center">
                <Icon name="User" size={13} className="text-[#3ca615]" />
              </div>
              <span className="text-sm text-gray-500">{post.author_name}</span>
            </div>
          )}

          {post.cover_url && !embed && (
            <div className="rounded-2xl overflow-hidden mb-6 max-h-80">
              <img src={post.cover_url} alt={post.title} className="w-full object-cover" />
            </div>
          )}

          {embed && (
            <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
              <iframe src={embed} title={post.title}
                className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          )}

          {post.content && (
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
              {post.content}
            </div>
          )}

          {post.tags && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                <span key={tag} className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          )}

          {/* Реакции на пост */}
          <div className="flex items-center gap-3 py-4 border-t border-gray-100 mb-6">
            <span className="text-sm text-gray-500">Оценить:</span>
            <button onClick={() => handleReact("like")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${myReaction === "like" ? "bg-green-100 text-green-700" : "border border-gray-200 text-gray-600 hover:border-[#3ca615] hover:text-[#3ca615]"}`}>
              <Icon name="ThumbsUp" size={16} />
              {reactions.like || 0}
            </button>
            <button onClick={() => handleReact("dislike")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${myReaction === "dislike" ? "bg-red-100 text-red-700" : "border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"}`}>
              <Icon name="ThumbsDown" size={16} />
              {reactions.dislike || 0}
            </button>
          </div>

          <CommentSection
            postId={post.id}
            comments={post.comments || []}
            onCommentAdded={() => {}}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      <SEO
        title="Блог — новости, статьи, видео об IT в Якутске"
        description="Полезные статьи, новости IT-рынка Якутска, видео о ремонте оборудования и автоматизации бизнеса от компании ProFiX. Советы по 1С, кассам, сетям."
        keywords="IT блог Якутск, новости IT Якутия, ремонт компьютеров советы Якутск, 1С статьи Якутск, видео о ккт"
        canonical="/blog"
      />

      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
            <Icon name="ChevronLeft" size={20} />
          </button>
          <span className="font-oswald text-lg font-bold">
            <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
          </span>
          <span className="text-gray-400 text-sm hidden sm:block">/ Блог</span>
          {youtubeChannel && (
            <a href={youtubeChannel} target="_blank" rel="noopener noreferrer"
              className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition">
              <Icon name="Play" size={13} />
              YouTube канал
            </a>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-oswald text-3xl font-bold text-gray-900 mb-1">Блог ProFiX</h1>
          <p className="text-gray-500 text-sm">Новости, статьи, видео и советы об IT в Якутске</p>
        </div>

        {/* Фильтры */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[{ v: "all", l: "Все" }, { v: "news", l: "Новости" }, { v: "article", l: "Статьи" }, { v: "video", l: "Видео" }, { v: "forum", l: "Форум" }].map(f => (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f.v ? "bg-[#3ca615] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-[#3ca615] hover:text-[#3ca615]"}`}>
              {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-[#3ca615]" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
            <p>Публикаций пока нет</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map(p => (
              <PostCard key={p.id} post={p} onClick={() => navigate(`/blog/${p.id}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}