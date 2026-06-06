import Icon from "@/components/ui/icon";
import { Post } from "@/lib/blog-api";

export const EMOJI_LIST = ["😀","😂","👍","❤️","🔥","👏","😮","🤔","💡","✅","🙏","💪","📌","⚡","🛠️","💻","📞","🏆"];

export function cleanText(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function withEllipsis(s: string | undefined | null, maxLen = 220): string {
  const t = cleanText(s);
  if (!t || t.length <= maxLen) return t;
  return t.slice(0, maxLen).replace(/[.,;:!?\s]+$/, "") + "…";
}

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
          <p className="text-xs text-gray-500 mt-1">ПРОФИКС · {formatCount(post.views || 0)} просм. · {new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}</p>
          {post.excerpt && <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{post.excerpt}</p>}
        </div>
      </div>
    </button>
  );
}

// ── Карточка для новостей/статей — лента в одну колонку ──────────────────────
export function ArticleCard({
  post, onClick,
  reactions, myReaction, onReact,
}: {
  post: Post;
  onClick: () => void;
  reactions?: Record<string, number>;
  myReaction?: string | null;
  onReact?: (r: "like" | "dislike") => void;
}) {
  const cleanExcerpt = withEllipsis(post.excerpt);
  const likes = reactions?.like || 0;
  const dislikes = reactions?.dislike || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Картинка */}
      {post.cover_url && (
        <button onClick={onClick} className="block w-full">
          <div className="w-full overflow-hidden bg-gray-100 aspect-video">
            <img src={post.cover_url} alt={post.title}
              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500" />
          </div>
        </button>
      )}

      {/* Контент */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-[#3ca615] uppercase tracking-wide bg-[#edf7e8] px-2 py-0.5 rounded-full">
            {TYPE_LABELS[post.type]}
          </span>
          {post.tags && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
              {post.tags.split(",")[0].trim()}
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto shrink-0">
            {new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>

        <button onClick={onClick} className="block text-left w-full group mb-2">
          <h3 className="font-oswald text-lg font-bold text-gray-900 leading-snug group-hover:text-[#3ca615] transition-colors">
            {post.title}
          </h3>
        </button>

        {cleanExcerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{cleanExcerpt}</p>
        )}

        {/* Лайки + комменты + просмотры */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {onReact ? (
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl px-1">
              <button
                onClick={e => { e.stopPropagation(); onReact("like"); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${myReaction === "like" ? "text-[#3ca615]" : "text-gray-500 hover:text-[#3ca615]"}`}>
                <Icon name="ThumbsUp" size={14} />{likes > 0 && likes}
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <button
                onClick={e => { e.stopPropagation(); onReact("dislike"); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${myReaction === "dislike" ? "text-red-400" : "text-gray-500 hover:text-red-400"}`}>
                <Icon name="ThumbsDown" size={14} />{dislikes > 0 && dislikes}
              </button>
            </div>
          ) : null}

          <button onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-[#3ca615] hover:bg-gray-50 transition-colors">
            <Icon name="MessageCircle" size={14} />
            {post.comment_count ? `${post.comment_count}` : "Комментировать"}
          </button>

          <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            <Icon name="Eye" size={12} />{post.views}
          </span>
        </div>
      </div>
    </div>
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