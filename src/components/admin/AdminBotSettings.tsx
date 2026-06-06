import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { fetchBotSettings, saveBotSettings } from "@/lib/content-api";

// URL видео-бота и новостного бота (подставятся из func2url)
import func2url from "../../../backend/func2url.json";

const NEWS_BOT_URL = (func2url as Record<string, string>)["news-bot"] || "";
const VIDEO_BOT_URL = (func2url as Record<string, string>)["video-bot"] || "";

const NEWS_SOURCES = [
  { key: "1С",         label: "1С / ИТС" },
  { key: "Налоги",     label: "Консультант Плюс" },
  { key: "ФНС",        label: "ФНС России" },
  { key: "Маркировка", label: "Честный Знак" },
  { key: "IT",         label: "CNews / Хабр" },
  { key: "Бухгалтерия",label: "Клерк.ру" },
  { key: "Бизнес",     label: "VC.ru" },
];

const VIDEO_TOPICS_DEFAULT = "ккт,1с,тсд,datamobile,ремонт кассовых аппаратов,кассовый аппарат,онлайн-касса,фискальный регистратор";

export default function AdminBotSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"news" | "video" | null>(null);
  const [savedMsg, setSavedMsg] = useState("");
  const [runningBot, setRunningBot] = useState<"news" | "video" | null>(null);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);

  // ── Настройки новостного бота ──────────────────────────────────────────────
  const [newsEnabled, setNewsEnabled] = useState(true);
  const [newsMaxPerRun, setNewsMaxPerRun] = useState("1");
  const [newsRequireImage, setNewsRequireImage] = useState(true);
  const [newsSources, setNewsSources] = useState<string[]>(NEWS_SOURCES.map(s => s.key));
  const [newsKeywords, setNewsKeywords] = useState("");

  // ── Настройки видео-бота ───────────────────────────────────────────────────
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [videoMaxPerRun, setVideoMaxPerRun] = useState("2");
  const [videoYoutube, setVideoYoutube] = useState(true);
  const [videoRutube, setVideoRutube] = useState(true);
  const [videoVk, setVideoVk] = useState(false);
  const [videoTopics, setVideoTopics] = useState(VIDEO_TOPICS_DEFAULT);

  useEffect(() => {
    fetchBotSettings().then(s => {
      // Новостной бот
      if (s["news_bot.enabled"] !== undefined) setNewsEnabled(s["news_bot.enabled"] === "true");
      if (s["news_bot.max_per_run"]) setNewsMaxPerRun(s["news_bot.max_per_run"]);
      if (s["news_bot.require_image"] !== undefined) setNewsRequireImage(s["news_bot.require_image"] === "true");
      if (s["news_bot.sources"]) {
        if (s["news_bot.sources"] === "all") {
          setNewsSources(NEWS_SOURCES.map(src => src.key));
        } else {
          setNewsSources(s["news_bot.sources"].split(",").map(x => x.trim()));
        }
      }
      if (s["news_bot.keywords"] !== undefined) setNewsKeywords(s["news_bot.keywords"]);

      // Видео-бот
      if (s["video_bot.enabled"] !== undefined) setVideoEnabled(s["video_bot.enabled"] === "true");
      if (s["video_bot.max_per_run"]) setVideoMaxPerRun(s["video_bot.max_per_run"]);
      if (s["video_bot.youtube"] !== undefined) setVideoYoutube(s["video_bot.youtube"] === "true");
      if (s["video_bot.rutube"] !== undefined) setVideoRutube(s["video_bot.rutube"] === "true");
      if (s["video_bot.vk"] !== undefined) setVideoVk(s["video_bot.vk"] === "true");
      if (s["video_bot.topics"]) setVideoTopics(s["video_bot.topics"]);
    }).finally(() => setLoading(false));
  }, []);

  function toggleSource(key: string) {
    setNewsSources(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  }

  async function saveNewsBotSettings() {
    setSaving("news");
    const sourcesVal = newsSources.length === NEWS_SOURCES.length
      ? "all"
      : newsSources.join(",");
    const ok = await saveBotSettings({
      "news_bot.enabled":       String(newsEnabled),
      "news_bot.max_per_run":   newsMaxPerRun,
      "news_bot.require_image": String(newsRequireImage),
      "news_bot.sources":       sourcesVal,
      "news_bot.keywords":      newsKeywords,
    });
    setSaving(null);
    setSavedMsg(ok ? "✅ Настройки новостного бота сохранены" : "❌ Ошибка сохранения");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  async function saveVideoBotSettings() {
    setSaving("video");
    const ok = await saveBotSettings({
      "video_bot.enabled":     String(videoEnabled),
      "video_bot.max_per_run": videoMaxPerRun,
      "video_bot.youtube":     String(videoYoutube),
      "video_bot.rutube":      String(videoRutube),
      "video_bot.vk":          String(videoVk),
      "video_bot.topics":      videoTopics,
    });
    setSaving(null);
    setSavedMsg(ok ? "✅ Настройки видео-бота сохранены" : "❌ Ошибка сохранения");
    setTimeout(() => setSavedMsg(""), 3000);
  }

  async function runBot(type: "news" | "video") {
    const url = type === "news" ? NEWS_BOT_URL : VIDEO_BOT_URL;
    if (!url) { setSavedMsg("❌ URL бота не найден"); setTimeout(() => setSavedMsg(""), 3000); return; }
    setRunningBot(type);
    setRunResult(null);
    try {
      const res = await fetch(url + "?run=1", { method: "GET" });
      const data = await res.json();
      setRunResult(data);
    } catch (e) {
      setRunResult({ error: String(e) });
    } finally {
      setRunningBot(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader2" size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Настройки ботов</h2>
          <p className="text-xs text-gray-400 mt-0.5">Авто-публикация новостей и видео в блог</p>
        </div>
      </div>

      {savedMsg && (
        <div className={`text-sm px-4 py-2.5 rounded-xl font-medium ${savedMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {savedMsg}
        </div>
      )}

      {/* ── НОВОСТНОЙ БОТ ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Icon name="Newspaper" size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Новостной бот</h3>
              <p className="text-[11px] text-gray-400">Публикует новости из RSS: 1С, ФНС, маркировка, IT</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <div
              onClick={() => setNewsEnabled(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${newsEnabled ? "bg-[#3ca615]" : "bg-gray-200"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${newsEnabled ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-xs font-medium text-gray-600">{newsEnabled ? "Включён" : "Выключен"}</span>
          </label>
        </div>

        <div className={`transition-all ${newsEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="px-5 py-4 space-y-4">

            {/* Лимит постов */}
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Постов за один запуск</label>
                <div className="flex gap-1">
                  {["1", "2", "3", "5"].map(v => (
                    <button key={v} onClick={() => setNewsMaxPerRun(v)}
                      className={`w-9 h-8 rounded-lg text-sm font-semibold border transition-colors ${newsMaxPerRun === v ? "bg-[#3ca615] text-white border-[#3ca615]" : "border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}
                    >{v}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer self-end mb-0.5">
                <input type="checkbox" checked={newsRequireImage} onChange={e => setNewsRequireImage(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#3ca615]" />
                <span className="text-xs text-gray-600">Только с картинкой</span>
              </label>
            </div>

            {/* Источники */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Источники RSS</label>
              <div className="flex flex-wrap gap-2">
                {NEWS_SOURCES.map(src => (
                  <button key={src.key} onClick={() => toggleSource(src.key)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                      newsSources.includes(src.key)
                        ? "bg-[#3ca615] text-white border-[#3ca615]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    <Icon name={newsSources.includes(src.key) ? "Check" : "Plus"} size={11} />
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Доп. ключевые слова */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Дополнительные ключевые слова <span className="text-gray-400 font-normal">(через запятую, повышают приоритет)</span>
              </label>
              <input
                value={newsKeywords}
                onChange={e => setNewsKeywords(e.target.value)}
                placeholder="датамобайл, тсд, ТСД, Якутск, ОФД..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]"
              />
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
          <button onClick={saveNewsBotSettings} disabled={saving === "news"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60 transition"
            style={{ backgroundColor: "#3ca615" }}>
            {saving === "news" ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Save" size={13} />}
            Сохранить
          </button>
          <button onClick={() => runBot("news")} disabled={runningBot === "news" || !newsEnabled}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 disabled:opacity-50 transition">
            {runningBot === "news" ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Play" size={13} />}
            Запустить сейчас
          </button>
        </div>
      </div>

      {/* ── ВИДЕО-БОТ ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <Icon name="Video" size={16} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Видео-бот</h3>
              <p className="text-[11px] text-gray-400">Публикует видео по темам ККТ, 1С, ТСД с YouTube, RuTube, VK</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer shrink-0">
            <div
              onClick={() => setVideoEnabled(v => !v)}
              className={`w-10 h-5 rounded-full transition-colors relative ${videoEnabled ? "bg-[#3ca615]" : "bg-gray-200"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${videoEnabled ? "left-5" : "left-0.5"}`} />
            </div>
            <span className="text-xs font-medium text-gray-600">{videoEnabled ? "Включён" : "Выключен"}</span>
          </label>
        </div>

        <div className={`transition-all ${videoEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
          <div className="px-5 py-4 space-y-4">

            {/* Платформы */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Платформы</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setVideoYoutube(v => !v)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-medium transition-colors ${videoYoutube ? "bg-red-500 text-white border-red-500" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  <Icon name={videoYoutube ? "Check" : "Plus"} size={11} />
                  YouTube
                </button>
                <button onClick={() => setVideoRutube(v => !v)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-medium transition-colors ${videoRutube ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  <Icon name={videoRutube ? "Check" : "Plus"} size={11} />
                  RuTube
                </button>
                <button onClick={() => setVideoVk(v => !v)}
                  className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-medium transition-colors ${videoVk ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                  <Icon name={videoVk ? "Check" : "Plus"} size={11} />
                  VK Видео
                </button>
              </div>
              {videoVk && (
                <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                  <Icon name="AlertTriangle" size={10} />
                  VK требует токен VK_ACCESS_TOKEN в настройках сервера
                </p>
              )}
            </div>

            {/* Лимит */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Видео за один запуск</label>
              <div className="flex gap-1">
                {["1", "2", "3", "5"].map(v => (
                  <button key={v} onClick={() => setVideoMaxPerRun(v)}
                    className={`w-9 h-8 rounded-lg text-sm font-semibold border transition-colors ${videoMaxPerRun === v ? "bg-[#3ca615] text-white border-[#3ca615]" : "border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}
                  >{v}</button>
                ))}
              </div>
            </div>

            {/* Темы поиска */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Темы поиска <span className="text-gray-400 font-normal">(через запятую — по каждой ищется на всех платформах)</span>
              </label>
              <textarea
                value={videoTopics}
                onChange={e => setVideoTopics(e.target.value)}
                rows={3}
                placeholder="ккт, 1с, тсд, datamobile, ремонт кассовых аппаратов..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615] resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">Видео публикуется только если тема встречается в названии или описании</p>
            </div>
          </div>
        </div>

        {/* Кнопки */}
        <div className="px-5 py-3 border-t border-gray-50 flex items-center gap-2 flex-wrap">
          <button onClick={saveVideoBotSettings} disabled={saving === "video"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60 transition"
            style={{ backgroundColor: "#3ca615" }}>
            {saving === "video" ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Save" size={13} />}
            Сохранить
          </button>
          <button onClick={() => runBot("video")} disabled={runningBot === "video" || !videoEnabled}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition">
            {runningBot === "video" ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Play" size={13} />}
            Запустить сейчас
          </button>
        </div>
      </div>

      {/* Результат запуска */}
      {runResult && (
        <div className="bg-gray-900 rounded-2xl p-4 text-xs font-mono text-green-400 overflow-auto max-h-48">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Результат запуска</span>
            <button onClick={() => setRunResult(null)} className="text-gray-500 hover:text-gray-300">✕</button>
          </div>
          <pre>{JSON.stringify(runResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
