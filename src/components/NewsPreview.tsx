import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { blogApi, Post } from "@/lib/blog-api";

export default function NewsPreview() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogApi.getPosts("news", 3)
      .then(r => { if (r.posts) setPosts(r.posts.slice(0, 3)); })
      .finally(() => setLoading(false));
  }, []);

  if (!loading && posts.length === 0) return null;

  return (
    <section className="bg-white py-10 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#edf7e8] flex items-center justify-center">
              <Icon name="Newspaper" size={16} className="text-[#3ca615]" />
            </div>
            <h2 className="font-oswald text-xl font-bold text-[#0D1B2A]">Новости IT</h2>
          </div>
          <button
            onClick={() => navigate("/blog?type=news")}
            className="text-sm text-[#3ca615] font-medium hover:underline flex items-center gap-1"
          >
            Все новости <Icon name="ChevronRight" size={15} />
          </button>
        </div>

        {/* Карточки */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-gray-100 animate-pulse" style={{ height: 260 }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {posts.map(post => {
              const cleanExcerpt = post.excerpt ? post.excerpt.replace(/<[^>]+>/g, "").trim() : "";
              return (
                <button
                  key={post.id}
                  onClick={() => navigate(`/blog/${post.id}`)}
                  className="text-left bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-[#3ca615]/20 transition-all group"
                >
                  {post.cover_url && (
                    <div className="w-full overflow-hidden bg-gray-100" style={{ height: 160 }}>
                      <img
                        src={post.cover_url}
                        alt={post.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {post.tags && (
                        <span className="text-[10px] font-bold text-[#3ca615] bg-[#edf7e8] px-2 py-0.5 rounded-full">
                          {post.tags.split(",")[0].trim()}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(post.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#3ca615] transition-colors mb-1">
                      {post.title}
                    </h3>
                    {cleanExcerpt && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{cleanExcerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Icon name="Eye" size={10} />{post.views}</span>
                      <span className="flex items-center gap-1"><Icon name="MessageCircle" size={10} />{post.comment_count || 0}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}