const URL = "https://functions.poehali.dev/3d7bcd5c-ff59-4d17-a884-4590e928d99f";

function authHeader(token: string) {
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

async function get(params: Record<string, string>, token: string) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${URL}?${qs}`, { headers: { "Authorization": `Bearer ${token}` } });
  return res.json();
}

async function post(body: object, token: string) {
  const res = await fetch(URL, { method: "POST", headers: authHeader(token), body: JSON.stringify(body) });
  return res.json();
}

export const internalChatApi = {
  // Уведомления
  notifyCount: (token: string) => get({ action: "notify_count" }, token),

  // Внутренний чат
  getContacts: (token: string) => get({ action: "contacts" }, token),
  getHistory: (token: string, peerRole: string, peerId: number, afterId = 0) =>
    get({ action: "history", peer_role: peerRole, peer_id: String(peerId), after_id: String(afterId) }, token),
  sendInternal: (token: string, toRole: string, toId: number, text: string) =>
    post({ action: "send_internal", to_role: toRole, to_id: toId, text }, token),

  // Клиентский чат
  getClientSessions: (token: string) => get({ action: "client_sessions" }, token),
  getClientHistory: (token: string, sessionId: string, afterId = 0) =>
    get({ action: "client_history", session_id: sessionId, after_id: String(afterId) }, token),
  replyClient: (token: string, sessionId: string, text: string) =>
    post({ action: "reply_client", session_id: sessionId, text }, token),
};
