const URL = "https://functions.poehali.dev/99e6ebb5-b8c7-4b0b-9e80-26d27bb0213e";

function auth(token: string) {
  return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

export interface TechContact {
  id: number;
  name: string;
  phone: string;
  tg_chat_id: number | null;
  tg_username: string | null;
  is_active: boolean;
  last_text: string | null;
  last_at: string | null;
  unread: number;
}

export interface TgMessage {
  id: number;
  from_role: "tech" | "manager";
  text: string;
  tg_message_id: number | null;
  read: boolean;
  created_at: string;
}

export const tgStaffApi = {
  async list(token: string): Promise<{ techs: TechContact[] }> {
    const r = await fetch(`${URL}?action=list`, { headers: auth(token) });
    return r.json();
  },

  async history(token: string, techId: number, afterId = 0): Promise<{ messages: TgMessage[] }> {
    const r = await fetch(`${URL}?action=history&tech_id=${techId}&after_id=${afterId}`, {
      headers: auth(token),
    });
    return r.json();
  },

  async send(token: string, techId: number, text: string): Promise<{ sent: boolean }> {
    const r = await fetch(`${URL}?action=send`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify({ tech_id: techId, text }),
    });
    return r.json();
  },

  async unreadCount(token: string): Promise<{ unread: number }> {
    const r = await fetch(`${URL}?action=unread_count`, { headers: auth(token) });
    return r.json();
  },

  async getLink(token: string, techId: number): Promise<{ link?: string; error?: string }> {
    const r = await fetch(`${URL}?action=get_link`, {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify({ tech_id: techId }),
    });
    return r.json();
  },
};
