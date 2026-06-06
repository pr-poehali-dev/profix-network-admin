import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import SEO from "@/components/SEO";
import Navbar from "@/components/Navbar";
import { Post } from "@/lib/blog-api";
import { VideoCard, ArticleCard, ForumCard } from "./Blog_Cards";

interface BannerProps {
  blogBannerBg: string;
  blogBannerImg: string;
  blogBannerDark: boolean;
  blogPageBg: string;
  youtubeChannel: string;
  subscribersCount: string;
  channelDesc: string;
  postsCount: number;
  filter: string;
  loading: boolean;
  posts: Post[];
  isLoggedIn: boolean;
  changeFilter: (f: string) => void;
  reactionsMap?: Record<number, Record<string, number>>;
  myReactionsMap?: Record<number, string>;
  onReact?: (postId: number, r: "like" | "dislike") => void;
}

export function BlogPostList({
  blogBannerBg, blogBannerImg, blogBannerDark,
  blogPageBg, youtubeChannel, subscribersCount, channelDesc,
  postsCount, filter, loading, posts, isLoggedIn, changeFilter,
  reactionsMap = {}, myReactionsMap = {}, onReact,
}: BannerProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Скролл к посту при возврате — retry с нарастающими задержками
  useEffect(() => {
    if (loading || posts.length === 0) return;
    const scrollToId = sessionStorage.getItem("blog_scroll_to");
    if (!scrollToId) return;
    sessionStorage.removeItem("blog_scroll_to");
    sessionStorage.removeItem("blog_scroll_type");

    let attempts = 0;
    function tryScroll() {
      const el = document.querySelector(`[data-post-id="${scrollToId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        // Подсвечиваем карточку на миг
        (el as HTMLElement).style.outline = "2px solid #3ca615";
        (el as HTMLElement).style.borderRadius = "16px";
        setTimeout(() => { (el as HTMLElement).style.outline = ""; }, 1500);
      } else if (attempts < 5) {
        attempts++;
        setTimeout(tryScroll, 200 * attempts);
      }
    }
    setTimeout(tryScroll, 100);
  }, [loading, posts]);

  const videoPosts   = posts.filter(p => p.type === "video");
  const otherPosts   = posts.filter(p => p.type !== "video");
  const forumPosts   = posts.filter(p => p.type === "forum");

  const bannerStyle: React.CSSProperties = blogBannerBg ? { backgroundColor: blogBannerBg } : {};
  if (blogBannerImg) {
    bannerStyle.backgroundImage = `url(${blogBannerImg})`;
    bannerStyle.backgroundSize = "cover";
    bannerStyle.backgroundPosition = "center";
  }
  const textPrimary   = blogBannerDark ? "text-white" : "text-[#0D1B2A]";
  const textSecondary = blogBannerDark ? "text-gray-400" : "text-[#4B5563]";
  const textMuted     = blogBannerDark ? "text-gray-500" : "text-gray-500";
  const filterActive  = blogBannerDark ? "bg-white text-gray-900" : "bg-[#0D1B2A] text-white";
  const filterIdle    = blogBannerDark ? "bg-white/10 text-gray-400" : "bg-black/10 text-gray-600";

  const FILTERS = [{ v: "all", l: "Все" }, { v: "video", l: "Видео" }, { v: "news", l: "Новости" }, { v: "article", l: "Статьи" }, { v: "forum", l: "Форум" }];

  return (
    <div className="min-h-screen font-golos" style={{ backgroundColor: blogPageBg }}>
      <SEO
        title="Блог ПРОФИКС — IT-советы, новости и видео из Якутска"
        description="Полезные статьи, новости IT-рынка Якутска, видео о ремонте оборудования и автоматизации бизнеса от компании ПРОФИКС. Советы по 1С, кассам, сетям."
        keywords="IT блог Якутск, новости IT Якутия, ремонт компьютеров советы Якутск, 1С статьи Якутск, видео ккт"
        canonical="/blog"
      />

      <Navbar
        scrolled={scrolled}
        activeSection=""
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(v => !v)}
        onScrollTo={() => {}}
      />

      {/* Баннер канала */}
      <div className={`border-b mt-14 ${blogBannerBg ? "border-black/10" : "bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8] border-gray-200"}`}
        style={bannerStyle}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#3ca615] flex items-center justify-center shrink-0 shadow-lg shadow-[#3ca615]/30">
              <Icon name="Wrench" size={36} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`font-oswald text-2xl sm:text-3xl font-bold mb-1 ${textPrimary}`}>ПРОФИКС</h1>
              <p className={`text-sm ${textSecondary}`}>{channelDesc}</p>
              <div className={`flex items-center gap-4 mt-2 text-xs ${textMuted}`}>
                {subscribersCount && <span className="flex items-center gap-1"><Icon name="Users" size={11} />{subscribersCount} подписчиков</span>}
                <span className="flex items-center gap-1"><Icon name="FileText" size={11} />{postsCount || "…"} публикаций</span>
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
          <div className="sm:hidden flex gap-2 mt-5 overflow-x-auto pb-1 -mx-1 px-1">
            {FILTERS.map(f => (
              <button key={f.v} onClick={() => changeFilter(f.v)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f.v ? filterActive : filterIdle}`}>
                {f.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* ── Левая навигационная колонка ─────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-1 w-44 shrink-0 self-start sticky top-20">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">Разделы</p>
            {[
              { v: "all",     l: "Все публикации", icon: "LayoutGrid" },
              { v: "news",    l: "Новости",         icon: "Newspaper" },
              { v: "article", l: "Статьи",          icon: "FileText" },
              { v: "video",   l: "Видео",           icon: "Play" },
              { v: "forum",   l: "Форум",           icon: "MessageSquare" },
            ].map(f => (
              <button key={f.v} onClick={() => changeFilter(f.v)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-left transition-all ${
                  filter === f.v
                    ? "bg-[#edf7e8] text-[#3ca615] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}>
                <Icon name={f.icon as "LayoutGrid"} size={15} className={filter === f.v ? "text-[#3ca615]" : "text-gray-400"} />
                {f.l}
              </button>
            ))}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">Навигация</p>
              <button onClick={() => navigate("/")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full text-left">
                <Icon name="Home" size={15} className="text-gray-400" />
                На главную
              </button>
              <button onClick={() => navigate("/shop")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full text-left">
                <Icon name="ShoppingCart" size={15} className="text-gray-400" />
                Магазин
              </button>
            </div>
          </aside>

          {/* ── Основной контент ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
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
          <div className="space-y-10">
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
                    <div key={p.id} data-post-id={p.id}>
                      <VideoCard post={p} onClick={() => navigate(`/blog/${p.id}`)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {otherPosts.filter(p => p.type !== "forum").length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-oswald text-xl font-bold text-gray-900">Новости и статьи</h2>
                  <button onClick={() => changeFilter("news")} className="text-xs text-[#3ca615] hover:underline font-medium">Смотреть все</button>
                </div>
                <div className="flex flex-col gap-4">
                  {otherPosts.filter(p => p.type !== "forum").slice(0, 9).map(p => (
                    <div key={p.id} data-post-id={p.id}>
                      <ArticleCard post={p} onClick={() => navigate(`/blog/${p.id}`)}
                        reactions={reactionsMap[p.id]} myReaction={myReactionsMap[p.id]}
                        onReact={onReact ? (r) => onReact(p.id, r) : undefined} />
                    </div>
                  ))}
                </div>
              </section>
            )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {posts.map(p => (
              <div key={p.id} data-post-id={p.id}>
                <VideoCard post={p} onClick={() => navigate(`/blog/${p.id}`)} />
              </div>
            ))}
          </div>
        ) : filter === "forum" ? (
          <div>
            {!isLoggedIn && (
              <div className="bg-gradient-to-r from-[#3ca615]/10 to-blue-50 border border-[#3ca615]/20 rounded-2xl p-5 mb-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 bg-[#3ca615] rounded-full flex items-center justify-center shrink-0">
                  <Icon name="Users" size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-gray-900 mb-1">Присоединяйтесь к сообществу ПРОФИКС</p>
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
              {posts.map(p => (
                <div key={p.id} data-post-id={p.id}>
                  <ForumCard post={p} onClick={() => navigate(`/blog/${p.id}`)} isLoggedIn={isLoggedIn} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map(p => (
              <div key={p.id} data-post-id={p.id}>
                <ArticleCard post={p} onClick={() => navigate(`/blog/${p.id}`)}
                  reactions={reactionsMap[p.id]} myReaction={myReactionsMap[p.id]}
                  onReact={onReact ? (r) => onReact(p.id, r) : undefined} />
              </div>
            ))}
          </div>
        )}
          </div>{/* flex-1 основной контент */}
        </div>{/* flex gap-8 */}
      </main>
    </div>
  );
}