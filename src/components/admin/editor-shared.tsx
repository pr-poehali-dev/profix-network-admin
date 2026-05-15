import { useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { uploadContentImage } from "@/lib/content-api";

export type ContentMap = Record<string, string>;

export function parseJson<T>(val: string, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback; } catch { return fallback; }
}

export function Field({ label, value, onChange, textarea = false, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  textarea?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      {hint && <p className="text-[10px] text-gray-400 mb-1">{hint}</p>}
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 resize-y" />
        : <input value={value} onChange={e => onChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
      }
    </div>
  );
}

// Ресайзит изображение через canvas и возвращает base64 jpeg
function resizeImage(file: File, maxW: number, maxH: number): Promise<{ b64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      const b64 = canvas.toDataURL("image/jpeg", 0.88).split(",")[1];
      resolve({ b64, mime: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function ImageUpload({
  value, onChange, label,
  maxW = 1200, maxH = 800,
  aspect,
}: {
  value: string; onChange: (url: string) => void; label: string;
  maxW?: number; maxH?: number;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  // Интерактивный ресайз: пользователь тянет за уголок до загрузки
  const [cropW, setCropW] = useState(maxW);
  const [cropH, setCropH] = useState(maxH);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{x:number;y:number;w:number;h:number} | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  // Выбрать файл — показываем предпросмотр без загрузки
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setPendingFile(file);
    setCropW(maxW); setCropH(maxH);
    const reader = new FileReader();
    reader.onload = ev => setPendingPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  // Drag-ресайз
  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY, w: cropW, h: cropH };
    setIsDragging(true);
    const move = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dw = ev.clientX - dragStart.current.x;
      const dh = ev.clientY - dragStart.current.y;
      setCropW(w => Math.max(100, Math.min(3840, dragStart.current!.w + dw * 4)));
      setCropH(h => Math.max(100, Math.min(2160, dragStart.current!.h + dh * 4)));
    };
    const up = () => { setIsDragging(false); dragStart.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }, [cropW, cropH]);

  // Загрузить с выбранными размерами
  async function doUpload() {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const { b64, mime } = await resizeImage(pendingFile, cropW, cropH);
      setPreview(`data:${mime};base64,${b64}`);
      const url = await uploadContentImage(b64, mime);
      onChange(url);
      setPreview(null); setPendingFile(null); setPendingPreview(null);
    } catch { /* ignore */ }
    setUploading(false);
  }

  const displaySrc = pendingPreview || preview || value;
  const thumbStyle = aspect ? { aspectRatio: aspect } : { height: "3.5rem" };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        {displaySrc && (
          <div className="relative shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            style={{ width: "5rem", ...thumbStyle }}>
            <img src={displaySrc} alt="" className="w-full h-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Icon name="Loader2" size={14} className="animate-spin text-gray-500" />
              </div>
            )}
          </div>
        )}
        <div className="flex-1 space-y-1.5">
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL изображения"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-green-400" />
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50">
            <Icon name="Upload" size={12} />
            {uploading ? "Загрузка..." : "Выбрать файл"}
          </button>
          <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          {/* Предпросмотр + ресайз мышкой */}
          {pendingFile && pendingPreview && (
            <div className="mt-2 bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <p className="text-[10px] text-gray-500 font-semibold">Размер для загрузки: {cropW} × {cropH} px</p>
              <div className="relative inline-block select-none" style={{ maxWidth: "100%" }}>
                <img src={pendingPreview} alt="" className="rounded-lg block max-w-full"
                  style={{ width: Math.min(cropW / 8, 220), height: "auto", opacity: 0.85 }} />
                {/* Ручка ресайза */}
                <div
                  onMouseDown={onDragMouseDown}
                  className={`absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-tl-lg cursor-se-resize flex items-center justify-center ${isDragging ? "scale-125" : ""}`}
                  title="Тяни для изменения размера">
                  <Icon name="Maximize2" size={10} className="text-white" />
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="flex gap-1 items-center">
                  <label className="text-[10px] text-gray-400">Ш:</label>
                  <input type="number" value={cropW} onChange={e => setCropW(Number(e.target.value))} min={100} max={3840} step={10}
                    className="w-16 text-[10px] border border-gray-200 rounded px-1.5 py-1 focus:outline-none" />
                  <label className="text-[10px] text-gray-400">В:</label>
                  <input type="number" value={cropH} onChange={e => setCropH(Number(e.target.value))} min={100} max={2160} step={10}
                    className="w-16 text-[10px] border border-gray-200 rounded px-1.5 py-1 focus:outline-none" />
                </div>
                <div className="flex gap-1">
                  {[[800,500,"16:9"],[400,400,"1:1"],[1920,900,"Fullscreen"],[maxW,maxH,"По умолч."]].map(([w,h,l]) => (
                    <button key={String(l)} type="button" onClick={() => { setCropW(Number(w)); setCropH(Number(h)); }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-green-100 text-gray-600">{l}</button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={doUpload} disabled={uploading}
                className="w-full py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{ background: "#3ca615" }}>
                {uploading ? <Icon name="Loader2" size={13} className="animate-spin" /> : <Icon name="Upload" size={13} />}
                {uploading ? "Загрузка..." : `Загрузить (${cropW}×${cropH})`}
              </button>
              <button type="button" onClick={() => { setPendingFile(null); setPendingPreview(null); }}
                className="w-full text-[10px] text-gray-400 hover:text-gray-600">Отмена</button>
            </div>
          )}

          {!pendingFile && <p className="text-[10px] text-gray-400">Макс. {maxW}×{maxH}px · JPEG · можно задать размер перед загрузкой</p>}
        </div>
      </div>
    </div>
  );
}