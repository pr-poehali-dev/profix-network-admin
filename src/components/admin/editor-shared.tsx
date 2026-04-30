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

export function ImageUpload({ value, onChange, label }: { value: string; onChange: (url: string) => void; label: string }) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const result = ev.target?.result as string;
      const url = await uploadContentImage(result.split(",")[1], file.type);
      onChange(url);
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="flex items-start gap-3">
        {value && (
          <img src={value} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200 shrink-0" />
        )}
        <div className="flex-1">
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="URL изображения"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-green-400 mb-1.5" />
          <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors disabled:opacity-50">
            <Icon name="Upload" size={12} />
            {uploading ? "Загрузка..." : "Загрузить"}
          </button>
          <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </div>
      </div>
    </div>
  );
}
