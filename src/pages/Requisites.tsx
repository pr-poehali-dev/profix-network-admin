import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useSiteContent } from "@/hooks/useSiteContent";

interface ReqRow { label: string; key: string; def?: string }

const SECTIONS: { title: string; icon: string; rows: ReqRow[] }[] = [
  {
    title: "Основные данные",
    icon: "Building2",
    rows: [
      { label: "Полное наименование", key: "company_full", def: "ООО «ПРОФИКС»" },
      { label: "Краткое наименование", key: "company_short", def: "ООО «ПРОФИКС»" },
      { label: "ИНН", key: "inn", def: "1435253577" },
      { label: "КПП", key: "kpp" },
      { label: "ОГРН", key: "ogrn", def: "1121435005790" },
      { label: "ОКПО", key: "okpo" },
    ],
  },
  {
    title: "Адреса",
    icon: "MapPin",
    rows: [
      { label: "Юридический адрес", key: "legal_address", def: "677009, г. Якутск, ул. Халтурина, дом 6" },
      { label: "Фактический адрес", key: "actual_address" },
    ],
  },
  {
    title: "Банковские реквизиты",
    icon: "Landmark",
    rows: [
      { label: "Банк", key: "bank_name" },
      { label: "БИК", key: "bik" },
      { label: "Корреспондентский счёт", key: "corr_account" },
      { label: "Расчётный счёт", key: "account" },
    ],
  },
  {
    title: "Контакты",
    icon: "Phone",
    rows: [
      { label: "Телефон", key: "phone", def: "+7 (914) 272-71-87" },
      { label: "Email", key: "email", def: "727187@it-profix.ru" },
      { label: "Сайт", key: "website", def: "pfx.su" },
      { label: "Руководитель", key: "director" },
    ],
  },
];

export default function Requisites() {
  const navigate = useNavigate();
  const { str } = useSiteContent();

  const r = (key: string, def = "") => str(`requisites.${key}`, def);

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos">
      {/* Шапка */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Icon name="ChevronLeft" size={20} />
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <span className="font-oswald text-lg font-bold tracking-wide">
              <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-[#3ca615] text-xs font-semibold uppercase tracking-widest mb-2">Правовые документы</p>
          <h1 className="font-oswald text-3xl sm:text-4xl font-bold text-[#0D1B2A] leading-tight mb-3">
            Реквизиты компании
          </h1>
          <p className="text-gray-500 text-sm">{r("company_full", "ООО «ПРОФИКС»")}</p>
          <div className="w-14 h-1 bg-[#3ca615] rounded-full mt-4" />
        </div>

        <div className="space-y-4">
          {SECTIONS.map(section => {
            const rows = section.rows.filter(row => r(row.key, row.def || "") !== "");
            if (!rows.length) return null;
            return (
              <div key={section.title} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-[#edf7e8] flex items-center justify-center">
                    <Icon name={section.icon as "Building2"} size={16} className="text-[#3ca615]" />
                  </div>
                  <h2 className="font-oswald text-base font-bold text-[#0D1B2A]">{section.title}</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {rows.map(row => {
                    const val = r(row.key, row.def || "");
                    if (!val) return null;
                    return (
                      <div key={row.key} className="flex items-start gap-4 px-5 py-3">
                        <span className="text-xs text-gray-400 w-44 shrink-0 pt-0.5">{row.label}</span>
                        <span className="text-sm font-medium text-[#0D1B2A] break-words">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Действия */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors"
          >
            <Icon name="Printer" size={15} />
            Распечатать
          </button>
          <a
            href="mailto:727187@it-profix.ru"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors"
          >
            <Icon name="Mail" size={15} />
            Запросить документы
          </a>
        </div>

        <div className="mt-8 text-center text-xs text-gray-400">
          <p>{r("company_full", "ООО «ПРОФИКС»")} · ИНН {r("inn", "1435253577")} · ОГРН {r("ogrn", "1121435005790")}</p>
          <p className="mt-1">{r("legal_address", "677009, г. Якутск, ул. Халтурина, дом 6")}</p>
        </div>
      </main>
    </div>
  );
}
