import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PartnerContactForm from "@/components/PartnerContactForm";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const FEATURES = [
  {
    icon: "Send",
    name: "Передача данных в ФНС",
    desc: "Мгновенная и надёжная передача каждого фискального документа в налоговую службу. Гарантия доставки и защита от потери данных.",
  },
  {
    icon: "LayoutDashboard",
    name: "Личный кабинет",
    desc: "Управление всеми кассами в одном окне: статус, история чеков, уведомления. Доступ с любого устройства.",
  },
  {
    icon: "BarChart2",
    name: "Аналитика",
    desc: "Отчёты о продажах, выручке и активности касс. Экспорт данных для анализа в сторонних системах.",
  },
  {
    icon: "Bell",
    name: "Уведомления",
    desc: "Моментальные оповещения при проблемах с кассой: потеря связи, ошибки, критический уровень ФН.",
  },
  {
    icon: "FileText",
    name: "Электронные чеки",
    desc: "Отправка электронных чеков покупателям по SMS и email. Хранение копий в архиве на протяжении 5 лет.",
  },
  {
    icon: "Link",
    name: "Интеграции",
    desc: "Готовые интеграции с популярными CMS, CRM и товароучётными системами. API для разработчиков.",
  },
];

const PlatformaOfdPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[#374151] hover:text-[#3ca615] transition-colors">
            <Icon name="ChevronLeft" size={20} />
            <span className="text-sm font-medium">На главную</span>
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <img src={`${CDN}/platformaofd.png`} alt="Платформа ОФД" className="h-7 object-contain" />
          <div className="ml-auto">
            <a href="tel:+79142727187" className="hidden sm:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors">
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] text-white py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
            <Icon name="BadgeCheck" size={15} />
            Официальный партнёр Платформа ОФД
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            Платформа ОФД — оператор фискальных данных
          </h1>
          <p className="text-purple-100 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Надёжный оператор фискальных данных (Эвотор ОФД). Передача данных с ККТ в ФНС,
            мониторинг касс и полная аналитика. Аккредитован ФНС России.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#features" className="bg-white text-[#7c3aed] px-6 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
              Узнать подробнее
            </a>
            <a href="tel:+79142727187" className="border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <Icon name="Phone" size={16} />
              Подключить ОФД
            </a>
          </div>
        </div>
      </section>

      {/* Статистика */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "700 000+", label: "касс подключено" },
            { value: "ФНС", label: "аккредитованный ОФД" },
            { value: "99,9%", label: "доступность сервиса" },
            { value: "5 лет", label: "хранение данных" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4">
              <p className="text-2xl md:text-3xl font-bold text-[#7c3aed] mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Возможности Платформы ОФД</h2>
            <p className="text-gray-500">Полный контроль над фискальными данными вашего бизнеса</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <Icon name={f.icon} size={22} className="text-[#7c3aed]" />
                </div>
                <h3 className="font-bold text-base mb-2">{f.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Как подключить */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Как подключить кассу к ОФД</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Звонок", desc: "Свяжитесь с нами — подберём тариф" },
              { step: "2", title: "Договор", desc: "Оформим договор с Платформой ОФД" },
              { step: "3", title: "Настройка", desc: "Введём данные ОФД в настройках кассы" },
              { step: "4", title: "Готово", desc: "Касса передаёт данные в ФНС" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#7c3aed] text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-gray-500 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Форма заявки */}
      <section className="py-14 bg-[#F7F9FC]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-2">Оставить заявку</p>
            <h2 className="font-oswald text-3xl font-bold text-[#0D1B2A]">Получить консультацию</h2>
            <p className="text-[#6B7280] mt-2">Заполните форму — мы свяжемся с вами в ближайшее время</p>
          </div>
          <PartnerContactForm accentColor="#7c3aed" defaultTopic="Торговое оборудование (ККТ, ТСД)" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Подключить Платформу ОФД</h2>
          <p className="text-purple-100 mb-7 text-base">Подключим кассу к ОФД и зарегистрируем в ФНС — быстро и без ошибок.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+79142727187" className="flex items-center justify-center gap-2 bg-white text-[#7c3aed] px-7 py-3.5 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <a href="https://platformaofd.ru" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Сайт Платформы ОФД
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2024 ProFiX — официальный партнёр Платформы ОФД</span>
          <a href="https://platformaofd.ru" target="_blank" rel="noopener noreferrer" className="hover:text-[#7c3aed] transition-colors">platformaofd.ru</a>
        </div>
      </footer>
    </div>
  );
};

export default PlatformaOfdPage;