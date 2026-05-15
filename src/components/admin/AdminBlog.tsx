import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { blogApi, Post } from "@/lib/blog-api";
import { saveContent, fetchContent, uploadContentImage } from "@/lib/content-api";

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

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const TYPE_BADGE: Record<string, string> = {
  news: "bg-blue-100 text-blue-700",
  article: "bg-purple-100 text-purple-700",
  video: "bg-red-100 text-red-700",
  forum: "bg-amber-100 text-amber-700",
};

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [preview, setPreview] = useState(false);

  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [subscribersCount, setSubscribersCount] = useState("");
  const [channelDesc, setChannelDesc] = useState("");
  const [headerBg, setHeaderBg] = useState("#ffffff");
  const [headerBgImg, setHeaderBgImg] = useState("");
  const [bgImgUploading, setBgImgUploading] = useState(false);
  const [ytSaving, setYtSaving] = useState(false);
  const bgImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
    fetchContent().then(c => {
      setYoutubeChannel(c["blog.youtube_channel"] || "");
      setSubscribersCount(c["blog.subscribers"] || "");
      setChannelDesc(c["blog.channel_desc"] || "");
      setHeaderBg(c["blog.header_bg"] || "#ffffff");
      setHeaderBgImg(c["blog.header_bg_img"] || "");
    });
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
        setPreview(false);
        loadPosts();
      } else {
        setSavedMsg("❌ " + (res.error || "Ошибка"));
      }
    } catch { setSavedMsg("❌ Ошибка соединения"); }
    finally { setSaving(false); }
  }

  async function handleSaveChannel() {
    setYtSaving(true);
    await saveContent({
      "blog.youtube_channel": youtubeChannel,
      "blog.subscribers": subscribersCount,
      "blog.channel_desc": channelDesc,
      "blog.header_bg": headerBg,
      "blog.header_bg_img": headerBgImg,
    });
    setYtSaving(false);
    setSavedMsg("✅ Настройки канала сохранены!");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить пост? Это действие необратимо.")) return;
    await blogApi.deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  }

  const ytId = editing?.video_url ? getYouTubeId(editing.video_url) : null;
  const thumbPreview = ytId
    ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
    : editing?.cover_url || null;

  const published = posts.filter(p => p.is_published).length;
  const drafts = posts.filter(p => !p.is_published).length;
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Блог</h2>
          <p className="text-sm text-gray-400 mt-0.5">Посты, видео, форум</p>
        </div>
        <button onClick={() => { setEditing({ ...EMPTY }); setPreview(false); }}
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

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Опубликовано", value: published, icon: "CheckCircle", color: "text-green-600 bg-green-50" },
          { label: "Черновики", value: drafts, icon: "FileText", color: "text-amber-600 bg-amber-50" },
          { label: "Просмотры", value: totalViews >= 1000 ? (totalViews / 1000).toFixed(1) + "К" : totalViews, icon: "Eye", color: "text-blue-600 bg-blue-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-3 text-center shadow-sm">
            <div className={`w-8 h-8 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-1.5`}>
              <Icon name={s.icon as "Eye"} size={15} />
            </div>
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-400 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Настройки канала */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
            <Icon name="Play" size={12} className="text-white" />
          </div>
          Настройки канала
        </h3>
        <div className="space-y-2.5">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ссылка на YouTube канал</label>
            <input value={youtubeChannel} onChange={e => setYoutubeChannel(e.target.value)}
              placeholder="https://youtube.com/@profix_yakutsk"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Подписчиков (текст)</label>
              <input value={subscribersCount} onChange={e => setSubscribersCount(e.target.value)}
                placeholder="1,2 тыс."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Описание канала</label>
              <input value={channelDesc} onChange={e => setChannelDesc(e.target.value)}
                placeholder="Короткое описание..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-2">Цвет фона шапки блога</label>
            <div className="flex flex-wrap gap-2 items-center mb-3">
              {[
                { color: "#ffffff", label: "Белый" },
                { color: "#F7F9FC", label: "Светлый" },
                { color: "#0F0F0F", label: "Тёмный" },
                { color: "#1a1a2e", label: "Ночной" },
                { color: "#edf7e8", label: "Зелёный" },
                { color: "#1e3a5f", label: "Синий" },
              ].map(p => (
                <button key={p.color} onClick={() => setHeaderBg(p.color)}
                  title={p.label}
                  className={`w-9 h-9 rounded-xl border-2 transition-all ${headerBg === p.color ? "border-[#3ca615] scale-110 shadow-md" : "border-gray-200"}`}
                  style={{ background: p.color }} />
              ))}
              <div className="flex items-center gap-1.5 ml-1">
                <label className="text-xs text-gray-400">Свой:</label>
                <input type="color" value={headerBg} onChange={e => setHeaderBg(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-gray-200 cursor-pointer p-0.5" />
              </div>
              <div className="ml-auto">
                <div className="h-8 w-24 rounded-lg border border-gray-200 flex items-center justify-center text-[10px] font-bold"
                  style={{ background: headerBg, color: ["#0F0F0F","#1a1a2e","#1e3a5f"].includes(headerBg) ? "white" : "#333" }}>
                  ПРОФИКС
                </div>
              </div>
            </div>
            <label className="block text-xs text-gray-500 mb-1.5">Фоновая картинка шапки (необязательно)</label>
            <div className="flex items-center gap-3">
              {headerBgImg && (
                <div className="relative w-20 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                  <img src={headerBgImg} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setHeaderBgImg("")}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500">
                    <Icon name="X" size={9} />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <input value={headerBgImg} onChange={e => setHeaderBgImg(e.target.value)}
                  placeholder="URL картинки или загрузите файл"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#3ca615] mb-1.5" />
                <button type="button" onClick={() => bgImgRef.current?.click()} disabled={bgImgUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors disabled:opacity-50">
                  <Icon name="Upload" size={12} />{bgImgUploading ? "Загрузка..." : "Загрузить картинку"}
                </button>
                <input ref={bgImgRef} type="file" accept="image/*" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0]; if (!file) return;
                  setBgImgUploading(true);
                  const reader = new FileReader();
                  reader.onload = async ev => {
                    const b64 = (ev.target?.result as string).split(",")[1];
                    const url = await uploadContentImage(b64, file.type);
                    setHeaderBgImg(url);
                    setBgImgUploading(false);
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }} />
              </div>
            </div>
            {headerBgImg && (
              <p className="text-[10px] text-gray-400 mt-1">Картинка накладывается поверх цвета с прозрачностью</p>
            )}
          </div>
          <button onClick={handleSaveChannel} disabled={ytSaving}
            className="w-full py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: "#3ca615" }}>
            {ytSaving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
            Сохранить настройки
          </button>
        </div>
      </div>

      {/* Редактор поста */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{editing.id ? "Редактировать пост" : "Новый пост"}</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setPreview(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${preview ? "bg-[#3ca615] text-white border-[#3ca615]" : "border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}>
                <Icon name="Eye" size={12} />Предпросмотр
              </button>
              <button onClick={() => { setEditing(null); setPreview(false); }} className="text-gray-400 hover:text-gray-600">
                <Icon name="X" size={18} />
              </button>
            </div>
          </div>

          {preview ? (
            // ── Предпросмотр ────────────────────────────────────────────────
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              {/* Мини превью карточки */}
              <div className="relative bg-gray-900 aspect-video">
                {thumbPreview ? (
                  <img src={thumbPreview} alt={editing.title} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="Image" size={40} className="text-gray-600" />
                  </div>
                )}
                {(ytId || editing.type === "video") && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                      <Icon name="Play" size={22} className="text-white ml-1" />
                    </div>
                  </div>
                )}
                <span className="absolute top-3 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-black/60 text-white">
                  {editing.type ? (POST_TYPES.find(t => t.v === editing.type)?.l || editing.type) : "Тип"}
                </span>
              </div>
              <div className="p-4 bg-white">
                <h4 className="font-bold text-gray-900 text-sm mb-1">{editing.title || "Заголовок поста"}</h4>
                {editing.excerpt && <p className="text-xs text-gray-500 line-clamp-2">{editing.excerpt}</p>}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>ProFiX</span>
                  <span>· 0 просм.</span>
                  <span>· {new Date().toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}</span>
                </div>
                {editing.content && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap line-clamp-6">{editing.content}</p>
                  </div>
                )}
                {editing.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {editing.tags.split(",").map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ── Форма редактирования ─────────────────────────────────────────
            <div className="space-y-4">
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
                  {editing.cover_url && !ytId && (
                    <div className="mt-2 h-20 rounded-lg overflow-hidden border border-gray-100">
                      <img src={editing.cover_url} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Видео (YouTube ссылка)</label>
                  <input value={editing.video_url || ""} onChange={e => setEditing(p => ({ ...p, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                  {ytId && (
                    <div className="mt-2 h-20 rounded-lg overflow-hidden border border-gray-100 relative">
                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="yt" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Icon name="Play" size={20} className="text-white" />
                      </div>
                    </div>
                  )}
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
            </div>
          )}

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
              style={{ backgroundColor: "#3ca615" }}>
              {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Save" size={15} />}
              {editing.id ? "Сохранить" : "Опубликовать"}
            </button>
            <button onClick={() => { setEditing(null); setPreview(false); }}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список постов */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700">Все публикации</h3>
          <span className="text-xs text-gray-400">{posts.length} шт.</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={24} className="animate-spin text-gray-300" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Постов пока нет</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {posts.map(p => {
              const ytId = p.video_url ? getYouTubeId(p.video_url) : null;
              const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/default.jpg` : p.cover_url;
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  {/* Миниатюра */}
                  <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="FileText" size={14} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${TYPE_BADGE[p.type] || "bg-gray-100 text-gray-600"}`}>
                        {POST_TYPES.find(t => t.v === p.type)?.l || p.type}
                      </span>
                      <span className={`text-[10px] font-semibold ${p.is_published ? "text-green-600" : "text-amber-500"}`}>
                        {p.is_published ? "Опубликован" : "Черновик"}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5"><Icon name="Eye" size={9} />{p.views || 0}</span>
                      <span>{new Date(p.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditing(p); setPreview(false); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id!)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Icon name="Trash2" size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}