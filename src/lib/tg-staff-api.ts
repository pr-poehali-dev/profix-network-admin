const BASE = "https://functions.poehali.dev/99e6ebb5-b8c7-4b0b-9e80-26d27bb0213e";

function auth(token: string) {
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}
async function get(token: string, action: string, extra: Record<string, string | number> = {}) {
  const qs = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(extra).map(([k,v])=>[k,String(v)])) });
  const r = await fetch(`${BASE}?${qs}`, { headers: auth(token) });
  return r.json();
}
async function post(token: string, action: string, body: object) {
  const r = await fetch(`${BASE}?action=${action}`, {
    method: "POST", headers: auth(token), body: JSON.stringify(body),
  });
  return r.json();
}

export interface TechContact {
  id: number; name: string; phone: string;
  tg_chat_id: number | null; tg_username: string | null;
  is_active: boolean; fixies_balance: number;
  last_text: string | null; last_at: string | null;
  unread: number; open_tasks: number; overdue: number;
  // contacts fields
  department?: string; position?: string; email?: string;
  c_tg?: string; vk_url?: string; notes?: string; sort_order?: number;
}

export interface TgMessage {
  id: number; from_role: "tech" | "manager"; text: string;
  tg_message_id: number | null; read: boolean; created_at: string;
  file_url?: string; file_type?: string; file_name?: string;
}

export interface StaffTask {
  id: number; title: string; description: string;
  status: string; priority: string;
  due_at: string | null; done_at: string | null;
  fixies_reward: number; penalty_fixies: number;
  close_comment: string | null; created_at: string;
  tech_name: string; tech_id: number; tg_chat_id: number | null;
  manager_name: string;
}

export interface ScheduleEntry { tech_id: number; name: string; date: string; type: string; note: string; }
export interface FixieTx { id: number; amount: number; reason: string; task_id: number | null; created_at: string; manager: string; }

export const tgStaffApi = {
  list:           (t: string) => get(t, "list"),
  history:        (t: string, techId: number, afterId = 0) => get(t, "history", { tech_id: techId, after_id: afterId }),
  send:           (t: string, techId: number, text: string, file?: { b64: string; name: string; mime: string }) =>
                    post(t, "send", { tech_id: techId, text, ...(file ? { file_b64: file.b64, file_name: file.name, file_mime: file.mime } : {}) }),
  unreadCount:    (t: string) => get(t, "unread_count"),
  getLink:        (t: string, techId: number) => post(t, "get_link", { tech_id: techId }),

  tasks:          (t: string, params: Record<string, string | number> = {}) => get(t, "tasks", params),
  taskCreate:     (t: string, body: object) => post(t, "task_create", body),
  taskUpdate:     (t: string, body: object) => post(t, "task_update", body),
  taskLogs:       (t: string, taskId: number) => get(t, "task_logs", { task_id: taskId }),

  fixies:         (t: string) => get(t, "fixies"),
  fixiesHistory:  (t: string, techId: number) => get(t, "fixies_history", { tech_id: techId }),
  fixiesAdd:      (t: string, body: object) => post(t, "fixies_add", body),

  stats:          (t: string) => get(t, "stats"),

  schedule:       (t: string, year: number, month: number) => get(t, "schedule", { year, month }),
  scheduleSet:    (t: string, body: object) => post(t, "schedule_set", body),

  contacts:       (t: string) => get(t, "contacts"),
  contactSave:    (t: string, body: object) => post(t, "contact_save", body),

  groupHistory:   (t: string, afterId = 0) => get(t, "group_history", { after_id: afterId }),
  groupSend:      (t: string, text: string, file?: { b64: string; name: string; mime: string }) =>
                    post(t, "group_send", { text, ...(file ? { file_b64: file.b64, file_name: file.name, file_mime: file.mime } : {}) }),
};