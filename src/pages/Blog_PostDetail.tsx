import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SEO from "@/components/SEO";
import { Post } from "@/lib/blog-api";
import { CommentSection } from "./Blog_CommentSection";
import { getYouTubeId, getYouTubeEmbed, formatCount, TYPE_LABELS, TYPE_ICONS } from "./Blog_Cards";

interface Props {
  post: Post;
  posts: Post[];
  reactions: Record<string, number>;
  myReaction: string | null;
  youtubeChannel: string;
  subscribersCount: string;
  blogPageBg: string;
  blogDarkHeader: boolean;
  onReact: (r: "like" | "dislike") => void;
}

export function BlogPostDetail({
  post, posts, reactions, myReaction,
  youtubeChannel, subscribersCount,
  blogPageBg, blogDarkHeader, onReact,
}: Props) {
  const navigate = useNavigate();
  const ytId = post.video_url ? getYouTubeId(post.video_url) : null;
  const embed = post.video_url ? getYouTubeEmbed(post.video_url) : null;

  return (
    <div className="min-h-screen font-golos" style={{ backgroundColor: blogPageBg }}>
      <SEO
        title={`${post.title} — ProFiX`}
        description={post.excerpt || post.title}
        image={post.cover_url || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : undefined)}
        type="article"
        publishedTime={post.created_at}
        canonical={`/blog/${post.id}`}
      />

      {/* Навбар — всегда тёмный */}
      <header className="bg-[#0F0F0F] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate("/blog")} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <Icon name="ChevronLeft" size={20} />
          </button>
          <span className="font-oswald text-lg font-bold">
            <span className="text-[#3ca615]">ПРО</span>
            <span className="text-white">ФИКС</span>
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

            <h1 className="font-oswald text-2xl sm:text-3xl font-bold mb-4 leading-tight"
              style={{ color: blogDarkHeader ? "white" : "#0D1B2A" }}>{post.title}</h1>

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
                <button onClick={() => onReact("like")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${myReaction === "like" ? "text-[#3ca615]" : "text-white"}`}>
                  <Icon name="ThumbsUp" size={15} />{reactions.like || 0}
                </button>
                <div className="w-px h-5 bg-white/20" />
                <button onClick={() => onReact("dislike")}
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
