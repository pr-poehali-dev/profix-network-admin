import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const sections = [
  {
    num: "1",
    title: "Общие положения",
    items: [
      "Настоящая Политика определяет порядок обработки персональных данных и меры по обеспечению их безопасности.",
      "Оператором является ООО «ПРОФИКС» ИНН 1435253577, ОГРН 1121435005790, юридический адрес: 677009, г. Якутск, ул. Халтурина, дом 6.",
      "Политика разработана в соответствии с законодательством РФ о персональных данных.",
    ],
  },
  {
    num: "2",
    title: "Термины",
    items: [
      "Персональные данные — любая информация, относящаяся прямо или косвенно к определённому физическому лицу.",
      "Обработка персональных данных — любое действие или совокупность действий с персональными данными.",
      "Оператор — организация, самостоятельно или совместно с другими определяющая цели и способы обработки данных.",
      "Пользователь — физическое лицо, использующее сайт и предоставляющее свои данные.",
      "Уничтожение, блокирование, обезличивание — действия, предусмотренные законодательством в отношении персональных данных.",
    ],
  },
  {
    num: "3",
    title: "Перечень обрабатываемых данных",
    items: [
      "ФИО.",
      "Контактный телефон.",
      "Email.",
      "Адрес доставки.",
      "Данные о заказе.",
      "IP-адрес пользователя, cookies, данные о браузере и устройстве — версия операционной системы, разрешение экрана, модель устройства. Геолокация (определяется по IP-адресу).",
      "Иные сведения, предоставленные Пользователем.",
    ],
  },
  {
    num: "4",
    title: "Цели обработки",
    items: [
      "Регистрация и обработка заказов.",
      "Связь с Пользователем.",
      "Доставка товаров.",
      "Передача данных транспортным компаниям.",
      "Передача данных изготовителям ККТ для исполнения обязанностей по оформлению расчётов.",
      "Передача данных в аналитическую систему Яндекс.Метрика.",
      "Исполнение обязательств по договору и требований законодательства.",
    ],
  },
  {
    num: "5",
    title: "Правовые основания обработки",
    items: [
      "Согласие субъекта персональных данных.",
      "Заключение и исполнение договора.",
      "Иные основания, предусмотренные законом.",
    ],
  },
  {
    num: "6",
    title: "Действия с персональными данными",
    items: [
      "Сбор.",
      "Запись.",
      "Систематизация.",
      "Накопление.",
      "Хранение.",
      "Уточнение.",
      "Использование.",
      "Передача.",
      "Блокирование.",
      "Удаление.",
      "Уничтожение.",
    ],
  },
  {
    num: "7",
    title: "Меры защиты",
    items: [
      "Ограничение доступа.",
      "Использование паролей и разграничения прав.",
      "Резервное копирование.",
      "Антивирусная защита.",
      "Контроль доступа к серверу.",
    ],
  },
  {
    num: "8",
    title: "Передача третьим лицам",
    items: [
      "Передача допускается только в пределах целей обработки.",
      "Третьи лица обязаны соблюдать конфиденциальность и обеспечивать безопасность данных.",
    ],
  },
  {
    num: "9",
    title: "Сроки обработки",
    items: [
      "До достижения целей обработки.",
      "До отзыва согласия.",
      "В течение сроков, установленных законом.",
    ],
  },
  {
    num: "10",
    title: "Права субъекта",
    items: [
      "Получение сведений об обработке.",
      "Требование уточнения данных.",
      "Отзыв согласия.",
      "Требование прекращения обработки при наличии оснований.",
    ],
  },
  {
    num: "11",
    title: "Контакт для обращений",
    items: ["Email: 727187@it-profix.ru"],
  },
];

export default function Privacy() {
  const navigate = useNavigate();

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
          <span className="font-oswald text-lg font-bold tracking-wide">
            <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <p className="text-[#3ca615] text-xs font-semibold uppercase tracking-widest mb-2">Правовые документы</p>
          <h1 className="font-oswald text-3xl sm:text-4xl font-bold text-[#0D1B2A] leading-tight mb-3">
            Политика обработки персональных данных
          </h1>
          <p className="text-gray-500 text-sm">ООО «ПРОФИКС» · Сайт pfx.su</p>
          <div className="w-14 h-1 bg-[#3ca615] rounded-full mt-4" />
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.num} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-oswald text-lg font-bold text-[#0D1B2A] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-[#edf7e8] text-[#3ca615] text-sm font-bold flex items-center justify-center shrink-0">
                  {section.num}
                </span>
                {section.title}
              </h2>
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 text-sm text-[#374151] leading-relaxed">
                    <span className="text-[#3ca615] font-semibold shrink-0 mt-0.5">
                      {section.num}.{idx + 1}.
                    </span>
                    {section.num === "11" && item.startsWith("Email:") ? (
                      <span>
                        Email:{" "}
                        <a href="mailto:727187@it-profix.ru" className="text-[#3ca615] hover:underline">
                          727187@it-profix.ru
                        </a>
                      </span>
                    ) : (
                      <span>{item}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-gray-400 space-y-1">
          <p>ООО «ПРОФИКС» · ИНН 1435253577 · ОГРН 1121435005790</p>
          <p>677009, г. Якутск, ул. Халтурина, дом 6</p>
        </div>
      </main>
    </div>
  );
}
