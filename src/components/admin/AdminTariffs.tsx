import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { managerApi, managerSession } from "@/lib/crm-api";

interface TariffPlan {
  id: number; name: string; role: string;
  base_fixies: number; overdue_penalty: number;
  speed_bonus_hours: number | null; speed_bonus_fixies: number;
  speed_tiers: { hours: number; fixies: number }[] | null;
  slow_penalty_hours: number | null; slow_penalty_fixies: number;
  priority_multiplier: Record<string, number> | null;
  is_active: boolean;
}

interface TechRow { id: number; name: string; balance: number; tariff: string | null; done: number; tariff_plan_id?: number; }
interface MgrRow  { id: number; name: string; balance: number; tariff: string | null; tariff_plan_id?: number; }

const ROLE_LABEL: Record<string, string> = { tech: "Специалист", manager: "Менеджер" };
const PRIO_KEYS = ["low", "normal", "high", "urgent"];
const PRIO_LABELS: Record<string, string> = { low: "Низкий", normal: "Обычный", high: "Высокий", urgent: "Срочный" };

function fmtSign(n: number) { return n >= 0 ? `+${n}` : String(n); }

const EMPTY_PLAN: Partial<TariffPlan> = {
  name: "", role: "tech", base_fixies: 10, overdue_penalty: 0,
  speed_bonus_hours: null, speed_bonus_fixies: 0,
  speed_tiers: [{ hours: 1, fixies: 20 }, { hours: 4, fixies: 10 }],
  slow_penalty_hours: null, slow_penalty_fixies: 0,
  priority_multiplier: { low: 0.8, normal: 1.0, high: 1.3, urgent: 1.5 },
  is_active: true,
};

export default function AdminTariffs() {
  const token = managerSession.get()!;
  const [plans, setPlans]         = useState<TariffPlan[]>([]);
  const [techs, setTechs]         = useState<TechRow[]>([]);
  const [managers, setManagers]   = useState<MgrRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<Partial<TariffPlan> | null>(null);
  const [saving, setSaving]       = useState(false);
  const [savedMsg, setSavedMsg]   = useState("");
  const [activeTab, setActiveTab] = useState<"plans" | "assign" | "leaderboard" | "summary">("plans");

  // Сводка по датам
  const [summaryFrom, setSummaryFrom] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [summaryTo, setSummaryTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [summaryData, setSummaryData] = useState<{name:string;role:string;balance:number;earned:number;penalties:number;done:number}[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => { load(); }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    // Загружаем транзакции за период из двух источников
    const token_ = managerSession.get()!;
    const TICKETS_URL = "https://functions.poehali.dev/80771697-657a-4565-8f5f-b8553431f806";
    try {
      const r = await fetch(`${TICKETS_URL}?action=fixies_summary_period&from=${summaryFrom}&to=${summaryTo}`, {
        headers: { "Authorization": `Bearer ${token_}` },
      });
      const data = await r.json();
      if (data.summary) setSummaryData(data.summary);
    } catch { /* ignore */ }
    setSummaryLoading(false);
  }, [summaryFrom, summaryTo]);

  async function load() {
    setLoading(true);
    const [tarRes, sumRes] = await Promise.all([
      managerApi.getTariffs(),
      managerApi.getFixiesSummary(),
    ]);
    if (tarRes.plans) setPlans(tarRes.plans);
    if (sumRes.techs) setTechs(sumRes.techs);
    if (sumRes.managers) setManagers(sumRes.managers);
    setLoading(false);
  }

  async function savePlan() {
    if (!editing?.name) return;
    setSaving(true);
    await managerApi.saveTariff(editing);
    setSaving(false);
    setSavedMsg("✅ Сохранено");
    setTimeout(() => setSavedMsg(""), 2000);
    setEditing(null);
    load();
  }

  async function assign(targetRole: string, targetId: number, planId: number | null) {
    await managerApi.assignTariff(targetRole, targetId, planId);
    load();
  }

  function updatePrioMult(key: string, val: string) {
    const n = parseFloat(val) || 1;
    setEditing(prev => ({
      ...prev,
      priority_multiplier: { ...(prev?.priority_multiplier || {}), [key]: n },
    }));
  }

  function updateTier(i: number, field: "hours" | "fixies", val: string) {
    const tiers = [...(editing?.speed_tiers || [])];
    tiers[i] = { ...tiers[i], [field]: parseInt(val) || 0 };
    setEditing(prev => ({ ...prev, speed_tiers: tiers }));
  }

  const techPlans  = plans.filter(p => p.role === "tech");
  const mgrPlans   = plans.filter(p => p.role === "manager");

  return (
    <div className="p-4 sm:p-6">
      {/* Шапка */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Тарификация мотивации</h2>
          <p className="text-sm text-gray-400 mt-0.5">Фиксики, премии и тарифные планы сотрудников</p>
        </div>
        {activeTab === "plans" && (
          <button onClick={() => setEditing({ ...EMPTY_PLAN })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: "#3ca615" }}>
            <Icon name="Plus" size={15} />Новый тариф
          </button>
        )}
      </div>

      {savedMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-100">{savedMsg}</div>
      )}

      {/* Табы */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 flex-wrap">
        {[["plans","Тарифные планы","Layers"],["assign","Привязка сотрудников","Link"],["leaderboard","Рейтинг фиксиков","Star"],["summary","Сводка по датам","BarChart2"]].map(([k,l,icon]) => (
          <button key={k} onClick={() => { setActiveTab(k as typeof activeTab); if (k === "summary") loadSummary(); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors min-w-[100px] ${activeTab===k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <Icon name={icon as "Layers"} size={13} />{l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Icon name="Loader2" size={28} className="animate-spin text-gray-300" /></div>
      ) : (
        <>
          {/* ── ТАРИФНЫЕ ПЛАНЫ ──────────────────────────────────────────────── */}
          {activeTab === "plans" && (
            <div className="space-y-4">
              {/* Редактор */}
              {editing && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">{editing.id ? "Редактировать тариф" : "Новый тариф"}</h3>
                    <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600"><Icon name="X" size={18} /></button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Название *</label>
                      <input value={editing.name || ""} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#3ca615]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Для кого</label>
                      <select value={editing.role || "tech"} onChange={e => setEditing(p => ({ ...p, role: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                        <option value="tech">Специалист</option>
                        <option value="manager">Менеджер</option>
                      </select>
                    </div>
                  </div>

                  {/* Базовые фиксики */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Базовое начисление</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">💰 Фиксиков за заявку</label>
                        <input type="number" value={editing.base_fixies ?? 10} min={0}
                          onChange={e => setEditing(p => ({ ...p, base_fixies: +e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">💸 Штраф за просрочку</label>
                        <input type="number" value={editing.overdue_penalty ?? 0} min={0}
                          onChange={e => setEditing(p => ({ ...p, overdue_penalty: +e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Множитель приоритета */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Множитель по приоритету</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRIO_KEYS.map(k => (
                        <div key={k}>
                          <label className="text-xs text-gray-500 block mb-1">{PRIO_LABELS[k]}</label>
                          <input type="number" step="0.1" min={0}
                            value={editing.priority_multiplier?.[k] ?? 1.0}
                            onChange={e => updatePrioMult(k, e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none text-center font-mono" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Базовые фиксики × множитель = итого</p>
                  </div>

                  {/* Скорость — только для менеджеров */}
                  {editing.role === "manager" && (
                    <div className="bg-blue-50 rounded-xl p-3 space-y-3">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Бонусы за скорость (менеджер)</p>
                      <p className="text-xs text-blue-500">Чем быстрее закрыта заявка — тем больше бонус</p>
                      <div className="space-y-2">
                        {(editing.speed_tiers || []).map((tier, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 shrink-0">Быстрее</span>
                            <input type="number" value={tier.hours} min={0}
                              onChange={e => updateTier(i, "hours", e.target.value)}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" />
                            <span className="text-xs text-gray-500 shrink-0">ч →</span>
                            <input type="number" value={tier.fixies}
                              onChange={e => updateTier(i, "fixies", e.target.value)}
                              className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none" />
                            <span className="text-xs text-gray-500 shrink-0">💰 фикс.</span>
                            <button onClick={() => setEditing(p => ({ ...p, speed_tiers: (p?.speed_tiers||[]).filter((_,j)=>j!==i) }))}
                              className="text-gray-400 hover:text-red-500"><Icon name="X" size={13} /></button>
                          </div>
                        ))}
                        <button onClick={() => setEditing(p => ({ ...p, speed_tiers: [...(p?.speed_tiers||[]), { hours: 8, fixies: 5 }] }))}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Icon name="Plus" size={12} />Добавить порог
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Штраф если дольше (ч)</label>
                          <input type="number" value={editing.slow_penalty_hours ?? ""} min={0}
                            placeholder="нет"
                            onChange={e => setEditing(p => ({ ...p, slow_penalty_hours: e.target.value ? +e.target.value : null }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Штраф (фиксиков)</label>
                          <input type="number" value={editing.slow_penalty_fixies ?? 0} min={0}
                            onChange={e => setEditing(p => ({ ...p, slow_penalty_fixies: +e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={savePlan} disabled={saving || !editing.name}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                      style={{ background: "#3ca615" }}>
                      {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
                      Сохранить
                    </button>
                    <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm">Отмена</button>
                  </div>
                </div>
              )}

              {/* Список планов */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map(plan => (
                  <div key={plan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.role==="tech" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                            {ROLE_LABEL[plan.role]}
                          </span>
                          {!plan.is_active && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Неактивен</span>}
                        </div>
                        <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      </div>
                      <button onClick={() => setEditing(plan)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                        <Icon name="Pencil" size={15} />
                      </button>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Базово за заявку</span>
                        <span className="font-bold text-[#3ca615]">+{plan.base_fixies} 💰</span>
                      </div>
                      {plan.overdue_penalty > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Штраф за просрочку</span>
                          <span className="font-bold text-red-500">−{plan.overdue_penalty} 💰</span>
                        </div>
                      )}
                      {plan.priority_multiplier && (
                        <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-gray-50">
                          {PRIO_KEYS.map(k => (
                            <span key={k} className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-lg">
                              {PRIO_LABELS[k]}: ×{plan.priority_multiplier![k] ?? 1}
                            </span>
                          ))}
                        </div>
                      )}
                      {plan.role === "manager" && plan.speed_tiers && (
                        <div className="pt-2 border-t border-gray-50">
                          <p className="text-xs text-gray-400 mb-1">Бонусы за скорость:</p>
                          {plan.speed_tiers.map((t, i) => (
                            <div key={i} className="text-xs text-blue-600">⚡ &lt;{t.hours}ч → +{t.fixies} 💰</div>
                          ))}
                          {plan.slow_penalty_hours && <div className="text-xs text-red-500">🐢 &gt;{plan.slow_penalty_hours}ч → −{plan.slow_penalty_fixies} 💰</div>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ПРИВЯЗКА СОТРУДНИКОВ ────────────────────────────────────────── */}
          {activeTab === "assign" && (
            <div className="space-y-6">
              {/* Специалисты */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Icon name="Wrench" size={15} className="text-[#3ca615]" />Специалисты
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {techs.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-[#3ca615] flex items-center justify-center text-white font-bold text-sm shrink-0">{t.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">Закрыто заявок: {t.done} · Баланс: {fmtSign(t.balance)} 💰</p>
                      </div>
                      <select
                        value={t.tariff_plan_id ?? ""}
                        onChange={e => assign("tech", t.id, e.target.value ? +e.target.value : null)}
                        className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#3ca615] max-w-[160px]">
                        <option value="">— Без тарифа —</option>
                        {techPlans.filter(p => p.is_active).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {techs.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Нет активных специалистов</p>}
                </div>
              </div>

              {/* Менеджеры */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Icon name="UserCheck" size={15} className="text-blue-500" />Менеджеры
                </h3>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {managers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{m.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-400">Баланс: {fmtSign(m.balance)} 💰</p>
                      </div>
                      <select
                        value={m.tariff_plan_id ?? ""}
                        onChange={e => assign("manager", m.id, e.target.value ? +e.target.value : null)}
                        className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#3ca615] max-w-[160px]">
                        <option value="">— Без тарифа —</option>
                        {mgrPlans.filter(p => p.is_active).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  {managers.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Нет менеджеров</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── РЕЙТИНГ ФИКСИКОВ ────────────────────────────────────────────── */}
          {activeTab === "leaderboard" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Спецы */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                    <Icon name="Wrench" size={15} className="text-[#3ca615]" />
                    <h3 className="font-bold text-gray-900 text-sm">Специалисты</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {techs.sort((a,b) => b.balance - a.balance).map((t, i) => (
                      <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                        <span className={`text-sm font-bold w-5 text-center ${i===0?"text-yellow-500":i===1?"text-gray-400":i===2?"text-amber-600":"text-gray-300"}`}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-[#3ca615] flex items-center justify-center text-white text-xs font-bold">{t.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                          <p className="text-[10px] text-gray-400">{t.tariff || "Без тарифа"} · {t.done} закрыто</p>
                        </div>
                        <span className={`text-sm font-bold ${t.balance>=0?"text-[#3ca615]":"text-red-500"}`}>{fmtSign(t.balance)} 💰</span>
                      </div>
                    ))}
                    {techs.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Нет данных</p>}
                  </div>
                </div>

                {/* Менеджеры */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="p-4 border-b border-gray-50 flex items-center gap-2">
                    <Icon name="UserCheck" size={15} className="text-blue-500" />
                    <h3 className="font-bold text-gray-900 text-sm">Менеджеры</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {managers.sort((a,b) => b.balance - a.balance).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                        <span className={`text-sm font-bold w-5 text-center ${i===0?"text-yellow-500":i===1?"text-gray-400":i===2?"text-amber-600":"text-gray-300"}`}>
                          {i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}
                        </span>
                        <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{m.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                          <p className="text-[10px] text-gray-400">{m.tariff || "Без тарифа"}</p>
                        </div>
                        <span className={`text-sm font-bold ${m.balance>=0?"text-blue-500":"text-red-500"}`}>{fmtSign(m.balance)} 💰</span>
                      </div>
                    ))}
                    {managers.length === 0 && <p className="text-sm text-gray-400 text-center py-6">Нет данных</p>}
                  </div>
                </div>
              </div>

              {/* Пояснение */}
              <div className="bg-[#edf7e8] border border-green-200 rounded-2xl p-4 text-sm text-gray-700">
                <p className="font-semibold mb-1">💰 Как начисляются фиксики?</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• <b>Специалист</b>: базовые фиксики × множитель приоритета − штраф за просрочку</li>
                  <li>• <b>Менеджер</b>: базовые × приоритет + бонус за скорость (чем быстрее закрыта)</li>
                  <li>• Начисляется автоматически при смене статуса заявки на «Выполнена»</li>
                  <li>• Можно вручную добавить/списать через раздел «Сотрудники» → Фиксики</li>
                </ul>
              </div>
            </div>
          )}
          {/* ── СВОДКА ПО ДАТАМ ─────────────────────────────────────────────── */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">С даты</label>
                  <input type="date" value={summaryFrom} onChange={e => setSummaryFrom(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">По дату</label>
                  <input type="date" value={summaryTo} onChange={e => setSummaryTo(e.target.value)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <button onClick={loadSummary} disabled={summaryLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "#3ca615" }}>
                  {summaryLoading ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Search" size={15} />}
                  Показать
                </button>
              </div>

              {summaryData.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Сотрудник</th>
                        <th className="text-left px-4 py-3">Роль</th>
                        <th className="text-right px-4 py-3">Заработано 💰</th>
                        <th className="text-right px-4 py-3">Штрафы ⚠️</th>
                        <th className="text-right px-4 py-3">Итого</th>
                        <th className="text-right px-4 py-3">Закрыто</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {summaryData.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-900">{row.name}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.role === "tech" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                              {row.role === "tech" ? "Специалист" : "Менеджер"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#3ca615]">+{row.earned}</td>
                          <td className="px-4 py-3 text-right font-bold text-red-500">−{row.penalties}</td>
                          <td className={`px-4 py-3 text-right font-bold ${(row.earned - row.penalties) >= 0 ? "text-[#3ca615]" : "text-red-500"}`}>
                            {fmtSign(row.earned - row.penalties)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600">{row.done}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : summaryLoading ? (
                <div className="flex justify-center py-10"><Icon name="Loader2" size={24} className="animate-spin text-gray-300" /></div>
              ) : (
                <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
                  Нажмите «Показать» чтобы загрузить данные за период
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}