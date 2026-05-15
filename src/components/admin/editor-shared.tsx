import { useRef, useState } from "react";
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
  aspect?: string; // например "16/9"
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { b64, mime } = await resizeImage(file, maxW, maxH);
      setPreview(`data:${mime};base64,${b64}`);
      const url = await uploadContentImage(b64, mime);
      onChange(url);
      setPreview(null);
    } catch {
      setUploading(false);
    }
    setUploading(false);
    e.target.value = "";
  }

  const displaySrc = preview || value;
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
        <div className="flex-1">
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL изображения"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-green-400 mb-1.5" />
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50">
            <Icon name="Upload" size={12} />
            {uploading ? "Загрузка..." : "Загрузить"}
          </button>
          {maxW && <p className="text-[10px] text-gray-400 mt-1">Авторесайз до {maxW}×{maxH}px · JPEG</p>}
          <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      </div>
    </div>
  );
}