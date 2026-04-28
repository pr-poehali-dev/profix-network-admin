const AUTH_URL = "https://functions.poehali.dev/1f14f246-0908-4c88-86de-62840b1d4e1c";
const TICKETS_URL = "https://functions.poehali.dev/80771697-657a-4565-8f5f-b8553431f806";
const REVIEWS_URL = "https://functions.poehali.dev/f1f45bf4-6a46-4561-abf6-fedd584fbeec";

// ── Хранилище токенов ────────────────────────────────────────────────────────

export const clientSession = {
  get: () => localStorage.getItem("crm_client_token"),
  set: (token: string) => localStorage.setItem("crm_client_token", token),
  clear: () => localStorage.removeItem("crm_client_token"),
};

export const managerSession = {
  get: () => localStorage.getItem("crm_manager_token"),
  set: (token: string) => localStorage.setItem("crm_manager_token", token),
  clear: () => localStorage.removeItem("crm_manager_token"),
};

// ── Базовые запросы ──────────────────────────────────────────────────────────

async function postAuth(body: object) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function postAuthWithToken(body: object, token: string) {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getTickets(params: Record<string, string>, token: string) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${TICKETS_URL}?${qs}`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  return res.json();
}

async function postTickets(body: object, token: string) {
  const res = await fetch(TICKETS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function putTickets(body: object, token: string) {
  const res = await fetch(TICKETS_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const techSession = {
  get: () => localStorage.getItem("crm_tech_token"),
  set: (token: string) => localStorage.setItem("crm_tech_token", token),
  clear: () => localStorage.removeItem("crm_tech_token"),
};

// ── API клиента ──────────────────────────────────────────────────────────────

export const clientApi = {
  requestOtp: (phone: string, channel: "email" | "telegram", email?: string) =>
    postAuth({ action: "client_request_otp", phone, channel, email }),

  verifyOtp: (phone: string, code: string) =>
    postAuth({ action: "client_verify_otp", phone, code }),

  verifyToken: (token: string) =>
    postAuthWithToken({ action: "verify_token", role: "client" }, token),

  getTickets: () => getTickets({ action: "list" }, clientSession.get()!),

  getTicket: (id: number) => getTickets({ action: "get", id: String(id) }, clientSession.get()!),

  createTicket: (data: { title: string; description: string; priority?: string }) =>
    postTickets({ action: "create", ...data }, clientSession.get()!),

  addComment: (ticket_id: number, text: string) =>
    postTickets({ action: "comment", ticket_id, text }, clientSession.get()!),

  updateProfile: (data: { name?: string; telegram_id?: number | null }) =>
    postAuthWithToken({ action: "client_update_profile", ...data }, clientSession.get()!),
};

// ── API техника ──────────────────────────────────────────────────────────────

export const techApi = {
  getTechniciansList: () => postAuth({ action: "technicians_list" }),

  login: (technician_id: number, pin: string) =>
    postAuth({ action: "technician_login", technician_id, pin }),

  verifyToken: (token: string) =>
    postAuthWithToken({ action: "verify_token", role: "technician" }, token),

  getTickets: () => getTickets({ action: "list" }, techSession.get()!),

  getTicket: (id: number) => getTickets({ action: "get", id: String(id) }, techSession.get()!),

  updateStatus: (id: number, status: string) =>
    putTickets({ action: "update", id, status }, techSession.get()!),

  addComment: (ticket_id: number, text: string) =>
    fetch(TICKETS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${techSession.get()}` },
      body: JSON.stringify({ action: "comment", ticket_id, text }),
    }).then(r => r.json()),
};

// ── API менеджера ────────────────────────────────────────────────────────────

export const managerApi = {
  login: (login: string, password: string) =>
    postAuth({ action: "manager_login", login, password }),

  verifyToken: (token: string) =>
    postAuthWithToken({ action: "verify_token", role: "manager" }, token),

  createManager: (data: { login: string; password: string; name: string; role: string }) =>
    postAuthWithToken({ action: "manager_create", ...data }, managerSession.get()!),

  getTickets: (status?: string) =>
    getTickets({ action: "list", ...(status ? { status } : {}) }, managerSession.get()!),

  getTicket: (id: number) =>
    getTickets({ action: "get", id: String(id) }, managerSession.get()!),

  createTicket: (data: object) =>
    postTickets({ action: "create", ...data }, managerSession.get()!),

  updateTicket: (data: object) =>
    putTickets({ action: "update", ...data }, managerSession.get()!),

  addComment: (ticket_id: number, text: string) =>
    postTickets({ action: "comment", ticket_id, text }, managerSession.get()!),

  getStats: () => getTickets({ action: "stats" }, managerSession.get()!),

  getClients: () => getTickets({ action: "clients" }, managerSession.get()!),

  getManagers: () => getTickets({ action: "managers" }, managerSession.get()!),

  getTechnicians: () => getTickets({ action: "technicians" }, managerSession.get()!),

  createTechnician: (data: object) =>
    postTickets({ action: "technician_create", ...data }, managerSession.get()!),

  getSchedule: (technician_id: number, date?: string) =>
    getTickets({ action: "schedule", technician_id: String(technician_id), ...(date ? { date } : {}) }, managerSession.get()!),
};

// ── API отзывов ───────────────────────────────────────────────────────────────

export const reviewsApi = {
  getPublished: () =>
    fetch(`${REVIEWS_URL}?action=list`).then(r => r.json()),

  create: (data: { rating: number; text: string; ticket_id?: number }) =>
    fetch(REVIEWS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${clientSession.get()}` },
      body: JSON.stringify({ action: "create", ...data }),
    }).then(r => r.json()),

  getAll: (token: string) =>
    fetch(`${REVIEWS_URL}?action=all`, {
      headers: { "Authorization": `Bearer ${token}` },
    }).then(r => r.json()),

  publish: (id: number, published: boolean, token: string) =>
    fetch(REVIEWS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ action: "publish", id, published }),
    }).then(r => r.json()),
};

// ── Типы ─────────────────────────────────────────────────────────────────────

export interface Technician {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  is_active: boolean;
  active_tickets?: number;
}

export interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: string;
  status_label: string;
  priority: string;
  priority_label: string;
  amount?: number;
  paid: boolean;
  created_at: string;
  updated_at: string;
  manager_name?: string;
  client_name?: string;
  client_phone?: string;
  technician_name?: string;
  technician?: { id: number; name: string; phone?: string } | null;
  scheduled_date?: string | null;
  scheduled_hour?: number | null;
  tech_notes?: string | null;
  comments?: Comment[];
  client?: { name?: string; phone?: string; email?: string };
}

export interface Comment {
  id: number;
  author_role: string;
  author_name?: string;
  text: string;
  created_at: string;
}

export interface Client {
  id: number;
  name?: string;
  phone: string;
  email?: string;
  created_at: string;
  tickets_count: number;
}

export const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  waiting: "bg-purple-100 text-purple-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-500",
  normal: "bg-blue-50 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  urgent: "bg-red-100 text-red-600",
};