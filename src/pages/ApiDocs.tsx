import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { PUBLIC_API_URL, managerApi, managerSession } from "@/lib/crm-api";

const AUTH_URL = "https://functions.poehali.dev/1f14f246-0908-4c88-86de-62840b1d4e1c";

interface ApiKey {
  id: number;
  name: string;
  key: string;
  permissions: string[];
  active: boolean;
  created_at: string;
  last_used_at: string | null;
}

const PERM_OPTIONS = [
  { value: "shop:read",      label: "Каталог товаров",   desc: "Категории, товары, цены, фото" },
  { value: "tickets:create", label: "Создание заявок",   desc: "Отправлять заявки в CRM" },
  { value: "tickets:read",   label: "Просмотр заявок",   desc: "Статус и список заявок" },
];

const ENDPOINTS = [
  {
    method: "GET",
    path: "?action=ping",
    title: "Проверка доступности",
    auth: false,
    desc: "Проверить что API работает.",
    response: `{ "pong": true, "ts": "2024-01-15T10:00:00" }`,
  },
  {
    method: "GET",
    path: "?action=shop.categories",
    title: "Категории товаров",
    auth: true,
    perm: "shop:read",
    desc: "Возвращает все категории каталога с количеством активных товаров в каждой.",
    response: `{
  "categories": [
    { "id": 1, "name": "Кассовое оборудование", "slug": "kassy", "description": "...", "product_count": 12 }
  ],
  "total": 5
}`,
  },
  {
    method: "GET",
    path: "?action=shop.products&category=kassy&in_stock=1&limit=50",
    title: "Список товаров",
    auth: true,
    perm: "shop:read",
    desc: "Список активных товаров. Фильтры: ?category=<slug>, ?search=<текст>, ?in_stock=1, ?limit=, ?offset=",
    response: `{
  "products": [
    {
      "id": 7,
      "name": "Атол 91Ф",
      "price": 14900.00,
      "price_old": 17000.00,
      "sku": "ATOL-91F",
      "in_stock": true,
      "image_url": "https://cdn.../photo.jpg",
      "category_name": "Кассовое оборудование",
      "category_slug": "kassy"
    }
  ],
  "total": 48, "limit": 50, "offset": 0
}`,
  },
  {
    method: "GET",
    path: "?action=shop.product&id=7",
    title: "Товар с фото",
    auth: true,
    perm: "shop:read",
    desc: "Полная информация о товаре: описание, цена, все изображения, рейтинг.",
    response: `{
  "product": {
    "id": 7,
    "name": "Атол 91Ф",
    "description": "Онлайн-касса...",
    "price": 14900.00,
    "price_old": 17000.00,
    "sku": "ATOL-91F",
    "in_stock": true,
    "image_url": "https://cdn.../main.jpg",
    "images": [
      { "image_url": "https://cdn.../1.jpg", "sort_order": 0 },
      { "image_url": "https://cdn.../2.jpg", "sort_order": 1 }
    ],
    "rating_avg": 4.8,
    "rating_count": 12,
    "category_name": "Кассовое оборудование"
  }
}`,
  },
  {
    method: "POST",
    path: "?action=ticket.create",
    title: "Создать заявку",
    auth: true,
    perm: "tickets:create",
    desc: "Создать новую заявку в CRM. Если клиент с указанным телефоном не найден — будет создан автоматически.",
    body: `{
  "title": "Нужна помощь с кассой",
  "description": "Подробное описание проблемы",
  "client_name": "Иван Иванов",
  "client_phone": "+79140000000",
  "priority": "medium"
}`,
    bodyFields: [
      { name: "title", type: "string", required: true, desc: "Тема заявки" },
      { name: "client_phone", type: "string", required: true, desc: "Телефон клиента" },
      { name: "client_name", type: "string", required: false, desc: "Имя клиента" },
      { name: "description", type: "string", required: false, desc: "Описание проблемы" },
      { name: "priority", type: "low|medium|high|critical", required: false, desc: "Приоритет (по умолч. medium)" },
    ],
    response: `{
  "ok": true,
  "ticket_id": 42,
  "created_at": "2024-01-15T10:00:00",
  "status": "new"
}`,
  },
  {
    method: "GET",
    path: "?action=ticket.status&id=42",
    title: "Статус заявки",
    auth: true,
    desc: "Получить текущий статус заявки по её ID.",
    response: `{
  "id": 42,
  "title": "Нужна помощь с кассой",
  "status": "in_progress",
  "priority": "medium",
  "created_at": "2024-01-15T10:00:00",
  "updated_at": "2024-01-15T11:30:00"
}`,
  },
  {
    method: "GET",
    path: "?action=tickets.list&limit=20&offset=0",
    title: "Список заявок",
    auth: true,
    desc: "Получить список заявок созданных через API. Поддерживает фильтрацию по статусу (?status=new).",
    response: `{
  "tickets": [
    { "id": 42, "title": "...", "status": "new", "priority": "medium", "created_at": "..." }
  ],
  "limit": 20,
  "offset": 0
}`,
  },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  waiting: "Ожидание",
  done: "Выполнена",
  cancelled: "Отменена",
};

export default function ApiDocs() {
  const navigate = useNavigate();
  const isManager = !!managerSession.get();

  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState<string[]>(["shop:read", "tickets:create", "tickets:read"]);
  const [createdKey, setCreatedKey] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState("");
  const [activeEndpoint, setActiveEndpoint] = useState<number | null>(null);

  useEffect(() => {
    if (isManager) loadKeys();
  }, [isManager]);

  async function loadKeys() {
    setLoadingKeys(true);
    try {
      const token = managerSession.get()!;
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action: "api_keys.list" }),
      });
      const data = await res.json();
      if (data.keys) setKeys(data.keys);
    } catch (e) { void e; }
    finally { setLoadingKeys(false); }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const token = managerSession.get()!;
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ action: "api_keys.create", name: newKeyName.trim(), permissions: newKeyPerms }),
      });
      const data = await res.json();
      if (data.key) {
        setCreatedKey(data.key);
        setNewKeyName("");
        loadKeys();
      }
    } catch (e) { void e; }
    finally { setCreating(false); }
  }

  async function revokeKey(id: number) {
    if (!confirm("Отозвать ключ? Это действие необратимо.")) return;
    const token = managerSession.get()!;
    await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ action: "api_keys.revoke", id }),
    });
    loadKeys();
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <Icon name="ChevronLeft" size={20} />
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <span className="font-oswald text-lg font-bold tracking-wide">
              <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
            </span>
          </button>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-semibold text-gray-500">API для партнёров</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Заголовок */}
        <div>
          <p className="text-[#3ca615] text-xs font-semibold uppercase tracking-widest mb-2">Интеграция</p>
          <h1 className="font-oswald text-3xl sm:text-4xl font-bold text-[#0D1B2A] mb-3">Публичный API</h1>
          <p className="text-gray-500 max-w-2xl">
            Интегрируйте вашу систему с ProFiX CRM — создавайте заявки, отслеживайте статусы напрямую из своего приложения.
          </p>
          <div className="w-14 h-1 bg-[#3ca615] rounded-full mt-4" />
        </div>

        {/* Base URL */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Base URL</p>
          <div className="flex items-center gap-3 bg-gray-900 rounded-xl px-4 py-3">
            <code className="text-green-400 text-sm flex-1 break-all">{PUBLIC_API_URL}</code>
            <button onClick={() => copy(PUBLIC_API_URL, "base")} className="shrink-0 text-gray-400 hover:text-white transition-colors">
              <Icon name={copied === "base" ? "Check" : "Copy"} size={15} />
            </button>
          </div>
        </div>

        {/* Аутентификация */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Аутентификация</p>
          <p className="text-sm text-gray-600 mb-3">Передавайте API-ключ в заголовке каждого запроса:</p>
          <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
            <code className="text-green-400 text-sm flex-1">X-API-Key: pfx_ваш_ключ</code>
            <button onClick={() => copy("X-API-Key: pfx_ваш_ключ", "header")} className="text-gray-400 hover:text-white transition-colors">
              <Icon name={copied === "header" ? "Check" : "Copy"} size={15} />
            </button>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Методы API</p>
          {ENDPOINTS.map((ep, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setActiveEndpoint(activeEndpoint === i ? null : i)}
              >
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold font-mono ${ep.method === "GET" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {ep.method}
                </span>
                <code className="text-sm text-gray-600 flex-1">{ep.path}</code>
                {ep.auth && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
                    <Icon name="Key" size={11} /> Ключ
                  </span>
                )}
                <span className="text-sm font-medium text-gray-900 hidden sm:block">{ep.title}</span>
                <Icon name={activeEndpoint === i ? "ChevronUp" : "ChevronDown"} size={15} className="text-gray-400 shrink-0" />
              </button>

              {activeEndpoint === i && (
                <div className="border-t border-gray-100 p-5 space-y-4">
                  <p className="text-sm text-gray-600">{ep.desc}</p>

                  {ep.bodyFields && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Параметры запроса</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-gray-400 border-b border-gray-100">
                              <th className="text-left pb-2 font-semibold">Поле</th>
                              <th className="text-left pb-2 font-semibold">Тип</th>
                              <th className="text-left pb-2 font-semibold">Обязательно</th>
                              <th className="text-left pb-2 font-semibold">Описание</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {ep.bodyFields.map(f => (
                              <tr key={f.name}>
                                <td className="py-2 pr-4"><code className="text-[#3ca615] text-xs">{f.name}</code></td>
                                <td className="py-2 pr-4"><code className="text-gray-500 text-xs">{f.type}</code></td>
                                <td className="py-2 pr-4">{f.required ? <span className="text-red-500 text-xs font-medium">да</span> : <span className="text-gray-400 text-xs">нет</span>}</td>
                                <td className="py-2 text-gray-600 text-xs">{f.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {ep.body && (
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Тело запроса (JSON)</p>
                      <div className="relative bg-gray-900 rounded-xl p-4">
                        <pre className="text-green-400 text-xs overflow-x-auto">{ep.body}</pre>
                        <button onClick={() => copy(ep.body!, `body-${i}`)} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
                          <Icon name={copied === `body-${i}` ? "Check" : "Copy"} size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ответ</p>
                    <div className="relative bg-gray-900 rounded-xl p-4">
                      <pre className="text-green-400 text-xs overflow-x-auto">{ep.response}</pre>
                      <button onClick={() => copy(ep.response, `resp-${i}`)} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
                        <Icon name={copied === `resp-${i}` ? "Check" : "Copy"} size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Статусы заявок */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Статусы заявок</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                <code className="text-xs text-[#3ca615] font-mono">{key}</code>
                <span className="text-xs text-gray-500">— {label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Управление ключами (только для авторизованных менеджеров) */}
        {isManager && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Управление API-ключами</p>

            {/* Создание нового ключа */}
            <div className="border border-dashed border-gray-200 rounded-xl p-4 mb-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500">Новый ключ</p>
              <input
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder="Название (например: 1С-интеграция, сайт партнёра)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]"
              />
              <div>
                <p className="text-xs text-gray-400 mb-2">Права доступа:</p>
                <div className="space-y-1.5">
                  {PERM_OPTIONS.map(p => (
                    <label key={p.value} className="flex items-center gap-2.5 cursor-pointer group">
                      <div className="relative shrink-0">
                        <input type="checkbox"
                          checked={newKeyPerms.includes(p.value)}
                          onChange={e => setNewKeyPerms(prev => e.target.checked ? [...prev, p.value] : prev.filter(x => x !== p.value))}
                          className="sr-only" />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${newKeyPerms.includes(p.value) ? "bg-[#3ca615] border-[#3ca615]" : "border-gray-300"}`}>
                          {newKeyPerms.includes(p.value) && <Icon name="Check" size={10} className="text-white" />}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{p.label}</span>
                      <span className="text-xs text-gray-400">{p.desc}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={createKey} disabled={creating || !newKeyName.trim() || newKeyPerms.length === 0}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "#3ca615" }}>
                {creating ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Key" size={15} />}
                Сгенерировать ключ
              </button>
            </div>

            {/* Только что созданный ключ */}
            {createdKey && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                  <Icon name="CheckCircle" size={13} /> Ключ создан! Сохраните его — он показывается один раз
                </p>
                <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
                  <code className="text-sm text-gray-900 flex-1 break-all">{createdKey}</code>
                  <button onClick={() => copy(createdKey, "newkey")} className="shrink-0 text-green-600">
                    <Icon name={copied === "newkey" ? "Check" : "Copy"} size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Список ключей */}
            {loadingKeys ? (
              <div className="flex items-center justify-center py-6">
                <Icon name="Loader2" size={20} className="animate-spin text-gray-400" />
              </div>
            ) : keys.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Ключей пока нет</p>
            ) : (
              <div className="space-y-2">
                {keys.map(k => (
                  <div key={k.id} className={`flex items-center gap-3 p-3 rounded-xl border ${k.active ? "border-gray-100 bg-gray-50" : "border-gray-100 bg-gray-50 opacity-50"}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${k.active ? "bg-green-500" : "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{k.name}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">{k.key.slice(0, 24)}…</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(k.permissions) ? k.permissions : []).map(p => (
                          <span key={p} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-mono">{p}</span>
                        ))}
                      </div>
                      {k.last_used_at && <p className="text-xs text-gray-400 mt-0.5">Использован: {new Date(k.last_used_at).toLocaleDateString("ru-RU")}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => copy(k.key, `key-${k.id}`)} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 transition-colors">
                        <Icon name={copied === `key-${k.id}` ? "Check" : "Copy"} size={14} />
                      </button>
                      {k.active && (
                        <button onClick={() => revokeKey(k.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                          <Icon name="Trash2" size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isManager && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <Icon name="Info" size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Нужен API-ключ?</p>
              <p className="text-sm text-amber-700 mt-0.5">Обратитесь к администратору ProFiX по адресу <a href="mailto:727187@it-profix.ru" className="underline">727187@it-profix.ru</a> для получения ключа доступа.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}