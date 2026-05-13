import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { blogApi, Post } from "@/lib/blog-api";
import { saveContent, fetchContent } from "@/lib/content-api";

const POST_TYPES = [
  { v: "news",    l: "Новость",  icon: "Newspaper" },
  { v: "article", l: "Статья",   icon: "FileText" },
  { v: "video",   l: "Видео",    icon: "Play" },
  { v: "forum",   l: "Форум",    icon: "MessageSquare" },
];

const EMPTY: Partial<Post> = {
  type: "news", title: "", content: "", excerpt: "",
  cover_url: "", video_url: "", tags: "", is_published: false,
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [ytSaving, setYtSaving] = useState(false);

  useEffect(() => {
    loadPosts();
    fetchContent().then(c => setYoutubeChannel(c["blog.youtube_channel"] || ""));
  }, []);

  async function loadPosts() {
    setLoading(true);
    const res = await blogApi.getAdminPosts();
    if (res.posts) setPosts(res.posts);
    setLoading(false);
  }

  async function handleSave() {
    if (!editing?.title?.trim()) { setSavedMsg("❌ Укажите заголовок"); return; }
    setSaving(true);
    try {
      let res;
      if (editing.id) {
        res = await blogApi.updatePost(editing as Post & { id: number });
      } else {
        res = await blogApi.createPost(editing);
      }
      if (res.ok || res.id) {
        setSavedMsg("✅ Сохранено!");
        setTimeout(() => setSavedMsg(""), 2000);
        setEditing(null);
        loadPosts();
      } else {
        setSavedMsg("❌ " + (res.error || "Ошибка"));
      }
    } catch { setSavedMsg("❌ Ошибка соединения"); }
    finally { setSaving(false); }
  }

  async function handleSaveYoutube() {
    setYtSaving(true);
    await saveContent({ "blog.youtube_channel": youtubeChannel });
    setYtSaving(false);
    setSavedMsg("✅ Ссылка сохранена!");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Блог</h2>
          <p className="text-sm text-gray-400 mt-0.5">Посты, видео, форум</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: "#3ca615" }}>
          <Icon name="Plus" size={16} />Новый пост
        </button>
      </div>

      {savedMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-medium ${savedMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
          {savedMsg}
        </div>
      )}

      {/* YouTube канал */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <Icon name="Play" size={15} className="text-red-500" />
          YouTube канал
        </h3>
        <div className="flex gap-2">
          <input value={youtubeChannel} onChange={e => setYoutubeChannel(e.target.value)}
            placeholder="https://youtube.com/@ваш_канал"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
          <button onClick={handleSaveYoutube} disabled={ytSaving}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60"
            style={{ backgroundColor: "#3ca615" }}>
            {ytSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Редактор поста */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900">{editing.id ? "Редактировать пост" : "Новый пост"}</h3>
            <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
              <Icon name="X" size={18} />
            </button>
          </div>

          {/* Тип */}
          <div className="flex gap-2 flex-wrap">
            {POST_TYPES.map(t => (
              <button key={t.v} onClick={() => setEditing(e => ({ ...e, type: t.v as Post["type"] }))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${editing.type === t.v ? "bg-[#3ca615] text-white border-[#3ca615]" : "border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}>
                <Icon name={t.icon as "Newspaper"} size={12} />
                {t.l}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Заголовок *</label>
            <input value={editing.title || ""} onChange={e => setEditing(p => ({ ...p, title: e.target.value }))}
              placeholder="Введите заголовок"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Краткое описание</label>
            <textarea value={editing.excerpt || ""} onChange={e => setEditing(p => ({ ...p, excerpt: e.target.value }))}
              rows={2} placeholder="Описание для карточки и SEO..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Текст статьи</label>
            <textarea value={editing.content || ""} onChange={e => setEditing(p => ({ ...p, content: e.target.value }))}
              rows={8} placeholder="Полный текст публикации..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615] resize-y" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Обложка (URL картинки)</label>
              <input value={editing.cover_url || ""} onChange={e => setEditing(p => ({ ...p, cover_url: e.target.value }))}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Видео (YouTube ссылка)</label>
              <input value={editing.video_url || ""} onChange={e => setEditing(p => ({ ...p, video_url: e.target.value }))}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Теги <span className="font-normal text-gray-400">(через запятую)</span></label>
            <input value={editing.tags || ""} onChange={e => setEditing(p => ({ ...p, tags: e.target.value }))}
              placeholder="1С, касса, ремонт, Якутск"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative shrink-0">
              <input type="checkbox" checked={!!editing.is_published}
                onChange={e => setEditing(p => ({ ...p, is_published: e.target.checked }))} className="sr-only" />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${editing.is_published ? "bg-[#3ca615] border-[#3ca615]" : "border-gray-300"}`}>
                {editing.is_published && <Icon name="Check" size={12} className="text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-700">Опубликовать</span>
          </label>

          <button onClick={handleSave} disabled={saving}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#3ca615" }}>
            {saving ? <><Icon name="Loader2" size={15} className="animate-spin" />Сохранение...</>
              : <><Icon name="Save" size={15} />{editing.id ? "Сохранить изменения" : "Опубликовать"}</>}
          </button>
        </div>
      )}

      {/* Список постов */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Icon name="Loader2" size={28} className="animate-spin text-[#3ca615]" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <Icon name="FileText" size={40} className="mx-auto mb-3 opacity-30" />
          <p>Постов пока нет. Создайте первый!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${p.is_published ? "bg-green-500" : "bg-gray-300"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {POST_TYPES.find(t => t.v === p.type)?.l} · {new Date(p.created_at).toLocaleDateString("ru-RU")} · {p.views} просмотров
                </p>
              </div>
              <button onClick={() => setEditing({ ...p })}
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#3ca615] hover:bg-[#edf7e8] transition-colors shrink-0">
                <Icon name="Pencil" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
