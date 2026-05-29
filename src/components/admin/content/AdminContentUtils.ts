// ── Константы ──────────────────────────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
  { value: "cancelled", label: "Отменена" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Низкий" },
  { value: "normal", label: "Нормальный" },
  { value: "high", label: "Высокий" },
  { value: "urgent", label: "Срочный" },
];

export const STATUS_FILTER_LABELS = [
  { value: "", label: "Все" },
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Ожидание" },
  { value: "done", label: "Выполнена" },
];

// ── Утилиты ────────────────────────────────────────────────────────────────────

export function formatHour(h: number): string {
  return h.toString().padStart(2, "0") + ":00";
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ── Типы ───────────────────────────────────────────────────────────────────────

export interface EditFields {
  status: string;
  priority: string;
  amount: string;
  paid: boolean;
  technician_id: string;
  scheduled_date: string;
  scheduled_hour: string;
  tech_notes: string;
}
