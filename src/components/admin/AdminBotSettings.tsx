import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { fetchBotSettings, saveBotSettings } from "@/lib/content-api";
import func2url from "../../../backend/func2url.json";

const SCHEDULER_URL = (func2url as Record<string, string>)["scheduler"] || "";
const NEWS_BOT_URL  = (func2url as Record<string, string>)["news-bot"]  || "";
const VIDEO_BOT_URL = (func2url as Record<string, string>)["video-bot"] || "";

const NEWS_SOURCES = [
  { key: "1С",          label: "1С / ИТС" },
  { key: "Налоги",      label: "Консультант Плюс" },
  { key: "ФНС",         label: "ФНС России" },
  { key: "Маркировка",  label: "Честный Знак" },
  { key: "IT",          label: "CNews / Хабр" },
  { key: "Бухгалтерия", label: "Клерк.ру" },
  { key: "Бизнес",      label: "VC.ru" },
];

const VIDEO_TOPICS_DEFAULT = "ккт,1с,тсд,datamobile,ремонт кассовых аппаратов,кассовый аппарат,онлайн-касса,фискальный регистратор";

const DAYS = [
  { v: 1, l: "Пн" }, { v: 2, l: "Вт" }, { v: 3, l: "Ср" },
  { v: 4, l: "Чт" }, { v: 5, l: "Пт" }, { v: 6, l: "Сб" }, { v: 7, l: "Вс" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function parseDays(str: string): number[] {
  return str.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
}

function formatLastRun(iso: string): string {
  if (!iso) return "Ещё не запускался";
  try {
    const d = new Date(iso);
    // UTC+9 Якутск
    const local = new Date(d.getTime() + 9 * 3600 * 1000);
    return local.toLocaleString("ru-RU", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", timeZone: "UTC",
    });
  } catch { return iso; }
}

// ── Секция расписания ──────────────────────────────────────────────────────────
function ScheduleSection({
  scheduleEnabled, onToggle,
  hour, onHourChange,
  days, onDayToggle,
  lastRunAt,
}: {
  scheduleEnabled: boolean;
  onToggle: () => void;
  hour: number;
  onHourChange: (h: number) => void;
  days: number[];
  onDayToggle: (d: number) => void;
  lastRunAt: string;
}) {
  return (
    <div className={`border-t border-gray-100 px-5 py-4 space-y-3 transition-all ${scheduleEnabled ? "" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <Icon name="Clock" size={13} className="text-gray-400" />
          Расписание (Якутск UTC+9)
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={onToggle}
            className={`w-8 h-4 rounded-full transition-colors relative ${scheduleEnabled ? "bg-[#3ca615]" : "bg-gray-200"}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${scheduleEnabled ? "left-4" : "left-0.5"}`} />
          </div>
          <span className="text-xs text-gray-500">{scheduleEnabled ? "Авто" : "Вручную"}</span>
        </label>
      </div>

      {scheduleEnabled && (
        <>
          {/* Время */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1.5">Время запуска</label>
            <div className="flex flex-wrap gap-1">
              {HOURS.map(h => (
                <button key={h} onClick={() => onHourChange(h)}
                  className={`w-9 h-7 rounded-lg text-xs font-medium transition-colors border ${
                    hour === h
                      ? "bg-[#3ca615] text-white border-[#3ca615]"
                      : "border-gray-200 text-gray-500 hover:border-[#3ca615]/50"
                  }`}>
                  {String(h).padStart(2, "0")}:00
                </button>
              ))}
            </div>
          </div>

          {/* Дни недели */}
          <div>
            <label className="block text-[11px] text-gray-500 mb-1.5">Дни недели</label>
            <div className="flex gap-1.5">
              {DAYS.map(d => (
                <button key={d.v} onClick={() => onDayToggle(d.v)}
                  className={`w-9 h-8 rounded-xl text-xs font-semibold transition-colors border ${
                    days.includes(d.v)
                      ? "bg-[#3ca615] text-white border-[#3ca615]"
                      : "border-gray-200 text-gray-500 hover:border-[#3ca615]/50"
                  }`}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] text-gray-400 flex items-center gap-1">
        <Icon name="History" size={10} />
        Последний запуск: {formatLastRun(lastRunAt)}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminBotSettings() {
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState<"news" | "video" | null>(null);
  const [savedMsg, setSavedMsg]   = useState("");
  const [runningBot, setRunningBot] = useState<"news" | "video" | null>(null);
  const [runResult, setRunResult] = useState<Record<string, unknown> | null>(null);
  const [scheduleStatus, setScheduleStatus] = useState<Record<string, unknown> | null>(null);

  // Новостной бот
  const [newsEnabled,        setNewsEnabled]        = useState(true);
  const [newsMaxPerRun,      setNewsMaxPerRun]      = useState("1");
  const [newsRequireImage,   setNewsRequireImage]   = useState(true);
  const [newsSources,        setNewsSources]        = useState<string[]>(NEWS_SOURCES.map(s => s.key));
  const [newsKeywords,       setNewsKeywords]       = useState("");
  const [newsScheduleEnabled,setNewsScheduleEnabled]= useState(true);
  const [newsScheduleHour,   setNewsScheduleHour]   = useState(9);
  const [newsScheduleDays,   setNewsScheduleDays]   = useState([1,2,3,4,5]);
  const [newsLastRun,        setNewsLastRun]        = useState("");

  // Видео-бот
  const [videoEnabled,        setVideoEnabled]        = useState(true);
  const [videoMaxPerRun,      setVideoMaxPerRun]      = useState("2");
  const [videoYoutube,        setVideoYoutube]        = useState(true);
  const [videoRutube,         setVideoRutube]         = useState(true);
  const [videoVk,             setVideoVk]             = useState(false);
  const [videoTopics,         setVideoTopics]         = useState(VIDEO_TOPICS_DEFAULT);
  const [videoScheduleEnabled,setVideoScheduleEnabled]= useState(true);
  const [videoScheduleHour,   setVideoScheduleHour]   = useState(11);
  const [videoScheduleDays,   setVideoScheduleDays]   = useState([1,3,5]);
  const [videoLastRun,        setVideoLastRun]        = useState("");

  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchBotSettings().then(s => {
      // Новостной бот
      if (s["news_bot.enabled"] !== undefined)          setNewsEnabled(s["news_bot.enabled"] === "true");
      if (s["news_bot.max_per_run"])                    setNewsMaxPerRun(s["news_bot.max_per_run"]);
      if (s["news_bot.require_image"] !== undefined)    setNewsRequireImage(s["news_bot.require_image"] === "true");
      if (s["news_bot.sources"])                        setNewsSources(s["news_bot.sources"] === "all" ? NEWS_SOURCES.map(x => x.key) : s["news_bot.sources"].split(",").map(x => x.trim()));
      if (s["news_bot.keywords"] !== undefined)         setNewsKeywords(s["news_bot.keywords"]);
      if (s["news_bot.schedule_enabled"] !== undefined) setNewsScheduleEnabled(s["news_bot.schedule_enabled"] === "true");
      if (s["news_bot.schedule_hour"])                  setNewsScheduleHour(parseInt(s["news_bot.schedule_hour"]) || 9);
      if (s["news_bot.schedule_days"])                  setNewsScheduleDays(parseDays(s["news_bot.schedule_days"]));
      if (s["news_bot.last_run_at"] !== undefined)      setNewsLastRun(s["news_bot.last_run_at"]);

      // Видео-бот
      if (s["video_bot.enabled"] !== undefined)          setVideoEnabled(s["video_bot.enabled"] === "true");
      if (s["video_bot.max_per_run"])                    setVideoMaxPerRun(s["video_bot.max_per_run"]);
      if (s["video_bot.youtube"] !== undefined)          setVideoYoutube(s["video_bot.youtube"] === "true");
      if (s["video_bot.rutube"] !== undefined)           setVideoRutube(s["video_bot.rutube"] === "true");
      if (s["video_bot.vk"] !== undefined)               setVideoVk(s["video_bot.vk"] === "true");
      if (s["video_bot.topics"])                         setVideoTopics(s["video_bot.topics"]);
      if (s["video_bot.schedule_enabled"] !== undefined) setVideoScheduleEnabled(s["video_bot.schedule_enabled"] === "true");
      if (s["video_bot.schedule_hour"])                  setVideoScheduleHour(parseInt(s["video_bot.schedule_hour"]) || 11);
      if (s["video_bot.schedule_days"])                  setVideoScheduleDays(parseDays(s["video_bot.schedule_days"]));
      if (s["video_bot.last_run_at"] !== undefined)      setVideoLastRun(s["video_bot.last_run_at"]);
    }).finally(() => setLoading(false));

    // Авто-пинг шедулера раз в час пока открыта страница
    if (SCHEDULER_URL) {
      pingScheduler();
      pingIntervalRef.current = setInterval(pingScheduler, 60 * 60 * 1000);
    }
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    };
  }, []);

  async function pingScheduler() {
    if (!SCHEDULER_URL) return;
    try {
      const res = await fetch(SCHEDULER_URL);
      const data = await res.json();
      if (data.schedule) setScheduleStatus(data.schedule);
      // Обновляем last_run_at из ответа шедулера
      if (data.schedule?.news_bot?.last_run_at) setNewsLastRun(data.schedule.news_bot.last_run_at);
      if (data.schedule?.video_bot?.last_run_at) setVideoLastRun(data.schedule.video_bot.last_run_at);
    } catch { /* ignore */ }
  }

  function toggleSource(key: string) {
    setNewsSources(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  function toggleNewsDay(d: number) {
    setNewsScheduleDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  }

  function toggleVideoDay(d: number) {
    setVideoScheduleDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  }

  function msg(text: string) { setSavedMsg(text); setTimeout(() => setSavedMsg(""), 3500); }

  async function saveNewsBotSettings() {
    setSaving("news");
    const sourcesVal = newsSources.length === NEWS_SOURCES.length ? "all" : newsSources.join(",");
    const ok = await saveBotSettings({
      "news_bot.enabled":          String(newsEnabled),
      "news_bot.max_per_run":      newsMaxPerRun,
      "news_bot.require_image":    String(newsRequireImage),
      "news_bot.sources":          sourcesVal,
      "news_bot.keywords":         newsKeywords,
      "news_bot.schedule_enabled": String(newsScheduleEnabled),
      "news_bot.schedule_hour":    String(newsScheduleHour),
      "news_bot.schedule_days":    newsScheduleDays.join(","),
    });
    setSaving(null);
    msg(ok ? "✅ Настройки новостного бота сохранены" : "❌ Ошибка сохранения");
  }

  async function saveVideoBotSettings() {
    setSaving("video");
    const ok = await saveBotSettings({
      "video_bot.enabled":          String(videoEnabled),
      "video_bot.max_per_run":      videoMaxPerRun,
      "video_bot.youtube":          String(videoYoutube),
      "video_bot.rutube":           String(videoRutube),
      "video_bot.vk":               String(videoVk),
      "video_bot.topics":           videoTopics,
      "video_bot.schedule_enabled": String(videoScheduleEnabled),
      "video_bot.schedule_hour":    String(videoScheduleHour),
      "video_bot.schedule_days":    videoScheduleDays.join(","),
    });
    setSaving(null);
    msg(ok ? "✅ Настройки видео-бота сохранены" : "❌ Ошибка сохранения");
  }

  async function runBot(type: "news" | "video") {
    const url = type === "news" ? NEWS_BOT_URL : VIDEO_BOT_URL;
    if (!url) { msg("❌ URL бота не найден"); return; }
    setRunningBot(type);
    setRunResult(null);
    try {
      const res = await fetch(url + "?run=1");
      const data = await res.json();
      setRunResult(data);
      // Обновим last_run_at
      const now = new Date().toISOString();
      if (type === "news") setNewsLastRun(now);
      else setVideoLastRun(now);
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

  const yakutskNow = new Date(Date.now() + 9 * 3600 * 1000);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Заголовок */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Боты</h2>
          <p className="text-xs text-gray-400 mt-0.5">Авто-публикация новостей и видео в блог</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-1.5 border border-gray-100">
          <Icon name="Clock" size={12} />
          Якутск: {yakutskNow.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
          {scheduleStatus && (
            <span className="text-green-600 ml-1">● планировщик активен</span>
          )}
        </div>
      </div>

      {savedMsg && (
        <div className={`text-sm px-4 py-2.5 rounded-xl font-medium ${savedMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
          {savedMsg}
        </div>
      )}

      {/* ── НОВОСТНОЙ БОТ ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Шапка */}
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Icon name="Newspaper" size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Новостной бот</h3>
              <p className="text-[11px] text-gray-400">RSS: 1С, ФНС, маркировка, IT</p>
            </div>
          </div>
          <div
            onClick={() => setNewsEnabled(v => !v)}
            className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative shrink-0 ${newsEnabled ? "bg-[#3ca615]" : "bg-gray-200"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${newsEnabled ? "left-5" : "left-0.5"}`} />
          </div>
        </div>

        <div className={newsEnabled ? "" : "opacity-40 pointer-events-none"}>
          {/* Настройки */}
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Постов за запуск</label>
                <div className="flex gap-1">
                  {["1","2","3","5"].map(v => (
                    <button key={v} onClick={() => setNewsMaxPerRun(v)}
                      className={`w-9 h-8 rounded-lg text-sm font-semibold border transition-colors ${newsMaxPerRun === v ? "bg-[#3ca615] text-white border-[#3ca615]" : "border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer self-end mb-0.5">
                <input type="checkbox" checked={newsRequireImage} onChange={e => setNewsRequireImage(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#3ca615]" />
                <span className="text-xs text-gray-600">Только с картинкой</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Источники RSS</label>
              <div className="flex flex-wrap gap-1.5">
                {NEWS_SOURCES.map(src => (
                  <button key={src.key} onClick={() => toggleSource(src.key)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-colors ${
                      newsSources.includes(src.key)
                        ? "bg-[#3ca615] text-white border-[#3ca615]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}>
                    <Icon name={newsSources.includes(src.key) ? "Check" : "Plus"} size={10} />
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Доп. ключевые слова <span className="text-gray-400 font-normal">(через запятую)</span>
              </label>
              <input value={newsKeywords} onChange={e => setNewsKeywords(e.target.value)}
                placeholder="датамобайл, тсд, Якутск..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615]" />
            </div>
          </div>

          {/* Расписание */}
          <ScheduleSection
            scheduleEnabled={newsScheduleEnabled}
            onToggle={() => setNewsScheduleEnabled(v => !v)}
            hour={newsScheduleHour}
            onHourChange={setNewsScheduleHour}
            days={newsScheduleDays}
            onDayToggle={toggleNewsDay}
            lastRunAt={newsLastRun}
          />
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
              <p className="text-[11px] text-gray-400">YouTube, RuTube, VK — ККТ, 1С, ТСД</p>
            </div>
          </div>
          <div
            onClick={() => setVideoEnabled(v => !v)}
            className={`w-10 h-5 rounded-full cursor-pointer transition-colors relative shrink-0 ${videoEnabled ? "bg-[#3ca615]" : "bg-gray-200"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${videoEnabled ? "left-5" : "left-0.5"}`} />
          </div>
        </div>

        <div className={videoEnabled ? "" : "opacity-40 pointer-events-none"}>
          <div className="px-5 py-4 space-y-4">
            {/* Платформы */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Платформы</label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setVideoYoutube(v => !v)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${videoYoutube ? "bg-red-500 text-white border-red-500" : "border-gray-200 text-gray-500"}`}>
                  <Icon name={videoYoutube ? "Check" : "Plus"} size={10} />YouTube
                </button>
                <button onClick={() => setVideoRutube(v => !v)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${videoRutube ? "bg-orange-500 text-white border-orange-500" : "border-gray-200 text-gray-500"}`}>
                  <Icon name={videoRutube ? "Check" : "Plus"} size={10} />RuTube
                </button>
                <button onClick={() => setVideoVk(v => !v)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-colors ${videoVk ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-500"}`}>
                  <Icon name={videoVk ? "Check" : "Plus"} size={10} />VK Видео
                </button>
              </div>
              {videoVk && (
                <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                  <Icon name="AlertTriangle" size={10} />VK требует токен VK_ACCESS_TOKEN
                </p>
              )}
            </div>

            {/* Лимит */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Видео за запуск</label>
              <div className="flex gap-1">
                {["1","2","3","5"].map(v => (
                  <button key={v} onClick={() => setVideoMaxPerRun(v)}
                    className={`w-9 h-8 rounded-lg text-sm font-semibold border transition-colors ${videoMaxPerRun === v ? "bg-[#3ca615] text-white border-[#3ca615]" : "border-gray-200 text-gray-600 hover:border-[#3ca615]"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Темы */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Темы поиска <span className="text-gray-400 font-normal">(через запятую)</span>
              </label>
              <textarea value={videoTopics} onChange={e => setVideoTopics(e.target.value)}
                rows={3} placeholder="ккт, 1с, тсд, datamobile..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#3ca615] resize-none" />
            </div>
          </div>

          {/* Расписание */}
          <ScheduleSection
            scheduleEnabled={videoScheduleEnabled}
            onToggle={() => setVideoScheduleEnabled(v => !v)}
            hour={videoScheduleHour}
            onHourChange={setVideoScheduleHour}
            days={videoScheduleDays}
            onDayToggle={toggleVideoDay}
            lastRunAt={videoLastRun}
          />
        </div>

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
        <div className="bg-gray-900 rounded-2xl p-4 text-xs font-mono text-green-400 overflow-auto max-h-52">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Результат запуска</span>
            <button onClick={() => setRunResult(null)} className="text-gray-500 hover:text-gray-300">✕</button>
          </div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(runResult, null, 2)}</pre>
        </div>
      )}

      {/* Подсказка */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700 flex items-start gap-2.5">
        <Icon name="Info" size={14} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Как работает расписание</p>
          <p>Планировщик автоматически проверяется каждый час пока открыта эта страница. Для надёжной работы 24/7 можно настроить внешний пинг: раз в час вызывать <code className="bg-amber-100 px-1 rounded">scheduler/?run=check</code></p>
        </div>
      </div>
    </div>
  );
}
