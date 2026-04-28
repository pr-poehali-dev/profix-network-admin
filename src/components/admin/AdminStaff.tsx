import Icon from "@/components/ui/icon";
import { Ticket, Technician, STATUS_COLORS } from "@/lib/crm-api";
import { formatDate, formatHour } from "./AdminContent";

// ── Типы ─────────────────────────────────────────────────────────────────────

interface TechniciansProps {
  technicians: Technician[];
  selectedTech: Technician | null;
  techSchedule: Ticket[];
  newTech: { name: string; phone: string; specialization: string };
  loading: boolean;
  onSelectTech: (t: Technician) => void;
  onNewTechChange: (f: { name: string; phone: string; specialization: string }) => void;
  onCreateTech: () => void;
}

interface ManagersProps {
  managers: { id: number; login: string; name: string; role: string }[];
  newManager: { login: string; password: string; name: string; role: string };
  loading: boolean;
  onNewManagerChange: (f: { login: string; password: string; name: string; role: string }) => void;
  onCreateManager: () => void;
}

// ── ТЕХ СПЕЦИАЛИСТЫ ──────────────────────────────────────────────────────────

export function AdminTechnicians({
  technicians, selectedTech, techSchedule, newTech, loading,
  onSelectTech, onNewTechChange, onCreateTech,
}: TechniciansProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Тех специалисты</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список специалистов + расписание */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {technicians.map((tech) => (
              <div
                key={tech.id}
                onClick={() => onSelectTech(tech)}
                className={`bg-white rounded-2xl border shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
                  selectedTech?.id === tech.id ? "border-[#3ca615] ring-2 ring-[#3ca615]/20" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#3ca615" }}
                  >
                    <Icon name="Wrench" size={18} className="text-white" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                    <Icon name="Ticket" size={12} />
                    {tech.active_tickets ?? 0} активных
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{tech.name}</h3>
                {tech.phone && <p className="text-sm text-gray-500 mb-1">{tech.phone}</p>}
                {tech.specialization && (
                  <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-2 py-1 inline-block">
                    {tech.specialization}
                  </p>
                )}
              </div>
            ))}
            {technicians.length === 0 && !loading && (
              <div className="sm:col-span-2 text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                Нет специалистов
              </div>
            )}
          </div>

          {/* Расписание */}
          {selectedTech && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Расписание: {selectedTech.name}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {techSchedule.length === 0 && (
                  <p className="px-6 py-8 text-center text-gray-400 text-sm">Нет запланированных заявок</p>
                )}
                {techSchedule.map((t) => (
                  <div key={t.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                        <Icon name="Calendar" size={16} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-400">
                          {t.scheduled_date
                            ? `${formatDate(t.scheduled_date)}${t.scheduled_hour != null ? ` в ${formatHour(t.scheduled_hour)}` : ""}`
                            : "Дата не указана"}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {t.status_label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Форма добавления специалиста */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="UserPlus" size={18} className="text-gray-400" />
              Новый специалист
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Имя</label>
                <input
                  type="text"
                  value={newTech.name}
                  onChange={(e) => onNewTechChange({ ...newTech, name: e.target.value })}
                  placeholder="Иван Иванов"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Телефон</label>
                <input
                  type="text"
                  value={newTech.phone}
                  onChange={(e) => onNewTechChange({ ...newTech, phone: e.target.value })}
                  placeholder="+7 999 000-00-00"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Специализация</label>
                <input
                  type="text"
                  value={newTech.specialization}
                  onChange={(e) => onNewTechChange({ ...newTech, specialization: e.target.value })}
                  placeholder="Ремонт техники"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <button
                onClick={onCreateTech}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
                style={{ background: "#3ca615" }}
              >
                {loading ? "Создание..." : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── МЕНЕДЖЕРЫ ─────────────────────────────────────────────────────────────────

export function AdminManagers({ managers, newManager, loading, onNewManagerChange, onCreateManager }: ManagersProps) {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Менеджеры</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Таблица */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-6 py-3">Имя</th>
                  <th className="text-left px-6 py-3">Логин</th>
                  <th className="text-left px-6 py-3">Роль</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{m.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{m.login}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                        m.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-50 text-blue-600"
                      }`}>
                        {m.role === "admin" ? "Администратор" : "Менеджер"}
                      </span>
                    </td>
                  </tr>
                ))}
                {managers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-sm">Нет менеджеров</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Форма создания */}
        <div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon name="UserPlus" size={18} className="text-gray-400" />
              Новый менеджер
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Имя</label>
                <input
                  type="text"
                  value={newManager.name}
                  onChange={(e) => onNewManagerChange({ ...newManager, name: e.target.value })}
                  placeholder="Иван Иванов"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Логин</label>
                <input
                  type="text"
                  value={newManager.login}
                  onChange={(e) => onNewManagerChange({ ...newManager, login: e.target.value })}
                  placeholder="ivanov"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Пароль</label>
                <input
                  type="password"
                  value={newManager.password}
                  onChange={(e) => onNewManagerChange({ ...newManager, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Роль</label>
                <select
                  value={newManager.role}
                  onChange={(e) => onNewManagerChange({ ...newManager, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3ca615]"
                >
                  <option value="manager">Менеджер</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <button
                onClick={onCreateManager}
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
                style={{ background: "#3ca615" }}
              >
                {loading ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
