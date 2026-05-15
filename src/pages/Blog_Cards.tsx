import Icon from "@/components/ui/icon";
import { Post } from "@/lib/blog-api";

export const EMOJI_LIST = ["😀","😂","👍","❤️","🔥","👏","😮","🤔","💡","✅","🙏","💪","📌","⚡","🛠️","💻","📞","🏆"];

export const TYPE_LABELS: Record<string, string> = {
  news: "Новости",
  article: "Статьи",
  video: "Видео",
  forum: "Форум",
};

export const TYPE_ICONS: Record<string, string> = {
  news: "Newspaper",
  article: "FileText",
  video: "Play",
  forum: "MessageSquare",
};

export function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function getYouTubeEmbed(url: string): string | null {
  const id = getYouTubeId(url);
  if (id) return `https://www.youtube.com/embed/${id}`;
  if (url.includes("vk.com/video") || url.includes("vkvideo.ru")) return url;
  return url;
}

export function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "К";
  return String(n);
}

// ── Карточка в стиле YouTube ──────────────────────────────────────────────────
export function VideoCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const ytId = post.video_url ? getYouTubeId(post.video_url) : null;
  const thumb = ytId
    ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
    : post.cover_url || null;

  return (
    <button onClick={onClick} className="w-full text-left group">
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

// ── Карточка для новостей/статей ──────────────────────────────────────────────
export function ArticleCard({ post, onClick }: { post: Post; onClick: () => void }) {
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

// ── Карточка форума ───────────────────────────────────────────────────────────
export function ForumCard({ post, onClick, isLoggedIn }: { post: Post; onClick: () => void; isLoggedIn: boolean }) {
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
