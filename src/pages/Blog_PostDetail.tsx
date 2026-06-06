import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import { Post } from "@/lib/blog-api";
import { CommentSection } from "./Blog_CommentSection";
import { getYouTubeId, getYouTubeEmbed, TYPE_LABELS, TYPE_ICONS, cleanText } from "./Blog_Cards";

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
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen font-golos bg-white">
      <SEO
        title={`${post.title} — ПРОФИКС`}
        description={post.excerpt || post.title}
        image={post.cover_url || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : undefined)}
        type="article"
        publishedTime={post.created_at}
        canonical={`/blog/${post.id}`}
      />

      <Navbar
        scrolled={scrolled}
        activeSection=""
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(v => !v)}
        onScrollTo={() => {}}
      />

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-10">
        <div className="flex gap-6 items-start">

          {/* ── Левая навигационная панель ─────────────────────────── */}
          <aside
            ref={sidebarRef}
            className={`hidden lg:flex flex-col self-start sticky top-20 shrink-0 transition-all duration-200 ${sidebarCollapsed ? "w-12" : "w-52"}`}
          >
            {/* Кнопка сворачивания */}
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              title={sidebarCollapsed ? "Развернуть" : "Свернуть"}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 hover:bg-[#edf7e8] hover:text-[#3ca615] text-gray-400 transition-colors mb-3 self-end"
            >
              <Icon name={sidebarCollapsed ? "ChevronRight" : "ChevronLeft"} size={15} />
            </button>

            {/* Разделы блога */}
            <div className={`flex flex-col gap-1 ${sidebarCollapsed ? "items-center" : ""}`}>
              {!sidebarCollapsed && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-3">Разделы</p>
              )}
              {[
                { path: "/blog",             label: "Все",      icon: "LayoutGrid"    },
                { path: "/blog?type=news",   label: "Новости",  icon: "Newspaper"     },
                { path: "/blog?type=article",label: "Статьи",   icon: "FileText"      },
                { path: "/blog?type=video",  label: "Видео",    icon: "Play"          },
                { path: "/blog?type=forum",  label: "Форум",    icon: "MessageSquare" },
              ].map(item => (
                <button key={item.path}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className={`flex items-center gap-2.5 rounded-xl text-sm font-medium transition-all
                    text-gray-600 hover:bg-[#edf7e8] hover:text-[#3ca615]
                    ${sidebarCollapsed ? "w-10 h-10 justify-center p-0" : "px-3 py-2 w-full text-left"}`}>
                  <Icon name={item.icon as "LayoutGrid"} size={15} className="shrink-0" />
                  {!sidebarCollapsed && item.label}
                </button>
              ))}

              {/* Разделитель */}
              <div className={`my-3 border-t border-gray-100 ${sidebarCollapsed ? "w-8" : "w-full"}`} />

              {/* Другие публикации */}
              {!sidebarCollapsed && posts.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 px-3">Другие публикации</p>
                  <div className="flex flex-col gap-1">
                    {posts.slice(0, 7).map(p => {
                      const sid = p.video_url ? getYouTubeId(p.video_url) : null;
                      const sThumb = sid ? `https://img.youtube.com/vi/${sid}/mqdefault.jpg` : p.cover_url;
                      return (
                        <button key={p.id}
                          onClick={() => { navigate(`/blog/${p.id}`); window.scrollTo(0, 0); }}
                          className="flex gap-2 text-left group hover:bg-gray-50 rounded-xl p-1.5 transition-colors w-full">
                          <div className="w-12 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                            {sThumb
                              ? <img src={sThumb} alt={p.title} className="w-full h-full object-cover object-center" />
                              : <div className="w-full h-full flex items-center justify-center"><Icon name="FileText" size={12} className="text-gray-400" /></div>}
                            {(sid || p.type === "video") && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Icon name="Play" size={10} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-gray-800 line-clamp-2 leading-snug group-hover:text-[#3ca615] transition-colors">{p.title}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {/* В свёрнутом состоянии — иконки других постов */}
              {sidebarCollapsed && posts.slice(0, 5).map(p => {
                const sid = p.video_url ? getYouTubeId(p.video_url) : null;
                const sThumb = sid ? `https://img.youtube.com/vi/${sid}/mqdefault.jpg` : p.cover_url;
                return (
                  <button key={p.id}
                    title={p.title}
                    onClick={() => { navigate(`/blog/${p.id}`); window.scrollTo(0, 0); }}
                    className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 hover:ring-2 hover:ring-[#3ca615] transition-all">
                    {sThumb
                      ? <img src={sThumb} alt={p.title} className="w-full h-full object-cover object-center" />
                      : <div className="w-full h-full flex items-center justify-center"><Icon name="FileText" size={12} className="text-gray-400" /></div>}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Основной контент */}
          <div className="flex-1 min-w-0">
            {embed ? (
              <div className="rounded-2xl overflow-hidden aspect-video mb-5">
                <iframe src={embed} title={post.title}
                  className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen />
              </div>
            ) : post.cover_url ? (
              <div className="rounded-2xl overflow-hidden mb-5" style={{ height: 340 }}>
                <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover object-center" />
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

            <h1 className="font-oswald text-2xl sm:text-3xl font-bold mb-4 leading-tight text-[#0D1B2A]">{post.title}</h1>

            {/* Автор + реакции */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 mb-5">
              <div className="w-9 h-9 rounded-full bg-[#3ca615] flex items-center justify-center">
                <Icon name="Wrench" size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">ПРОФИКС</p>
                {subscribersCount && <p className="text-xs text-gray-500">{subscribersCount} подписчиков</p>}
              </div>
              {youtubeChannel && (
                <a href={youtubeChannel} target="_blank" rel="noopener noreferrer"
                  className="ml-auto px-4 py-2 bg-[#3ca615] text-white rounded-full text-sm font-semibold hover:bg-[#2d9010] transition-colors">
                  Подписаться
                </a>
              )}
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-1">
                <button onClick={() => onReact("like")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${myReaction === "like" ? "text-[#3ca615]" : "text-gray-600"}`}>
                  <Icon name="ThumbsUp" size={15} />{reactions.like || 0}
                </button>
                <div className="w-px h-5 bg-gray-300" />
                <button onClick={() => onReact("dislike")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${myReaction === "dislike" ? "text-red-500" : "text-gray-600"}`}>
                  <Icon name="ThumbsDown" size={15} />{reactions.dislike || 0}
                </button>
              </div>
            </div>

            {/* Описание / контент */}
            {(post.excerpt || post.content) && (
              <div className="mb-6">
                {post.excerpt && (
                  <p className="text-gray-700 text-sm font-medium mb-4 leading-relaxed border-l-4 border-[#3ca615] pl-4 bg-[#edf7e8] py-3 rounded-r-xl">
                    {cleanText(post.excerpt)}
                  </p>
                )}
                {post.content && (
                  <div
                    className="text-gray-800 text-sm leading-relaxed prose prose-sm max-w-none
                      [&_a]:text-[#3ca615] [&_a]:underline [&_a]:underline-offset-2
                      [&_p]:mb-3 [&_p:last-child]:mb-0
                      [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2
                      [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-1
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
                      [&_li]:mb-1"
                    dangerouslySetInnerHTML={{
                      __html: post.content
                        .replace(/&nbsp;/gi, " ")
                        .replace(/&amp;/gi, "&")
                        .replace(/&[a-z#0-9]+;/gi, (m) =>
                          ["&lt;","&gt;","&quot;","&#39;","&amp;"].includes(m.toLowerCase()) ? m : " "
                        )
                    }}
                  />
                )}
              </div>
            )}

            {post.tags && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.split(",").map(tag => tag.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer">#{tag}</span>
                ))}
              </div>
            )}

            <CommentSection
              postId={post.id}
              comments={post.comments || []}
              commentsMode={post.comments_mode || "users"}
              onCommentAdded={() => {}}
            />
          </div>{/* конец основного контента */}
        </div>{/* конец flex */}
      </div>
    </div>
  );
}