import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const PRODUCTS = [
  {
    icon: "FileText",
    name: "Электронный документооборот",
    desc: "Обмен счетами-фактурами, актами и накладными с контрагентами в электронном виде. Ускорьте согласование и снизьте затраты на бумажный документооборот.",
  },
  {
    icon: "Send",
    name: "Электронная отчётность",
    desc: "Отправка отчётов в ФНС, ПФР, ФСС, Росстат и другие ведомства. Актуальные формы, проверка перед отправкой, уведомления о статусе.",
  },
  {
    icon: "Users",
    name: "CRM и продажи",
    desc: "Управление клиентской базой, воронка продаж, задачи и напоминания. Интеграция с телефонией и почтой для полного контроля над сделками.",
  },
  {
    icon: "UserCheck",
    name: "Кадры и зарплата",
    desc: "Ведение кадрового учёта, расчёт зарплаты, электронные трудовые книжки. Автоматическая отправка СЗВ-М, СЗВ-ТД и других кадровых отчётов.",
  },
  {
    icon: "ShoppingCart",
    name: "Торговля и склад",
    desc: "Учёт товаров, остатков и движения по складу. Работа с маркировкой «Честный Знак» и ЕГАИС. Интеграция с кассовым оборудованием.",
  },
  {
    icon: "Building2",
    name: "Бухгалтерия",
    desc: "Полный бухгалтерский и налоговый учёт в облаке. Автоматические проводки, сверка с ФНС, подготовка и сдача всех форм отчётности.",
  },
];

const SbisPage = () => {
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
          <img src={`${CDN}/saby.png`} alt="СБИС" className="h-7 object-contain" />
          <div className="ml-auto">
            <a href="tel:+79142727187" className="hidden sm:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors">
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="bg-gradient-to-br from-[#1a56db] to-[#1e3a8a] text-white py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
            <Icon name="BadgeCheck" size={15} />
            Официальный партнёр СБИС
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            СБИС — всё для управления бизнесом
          </h1>
          <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Единая платформа для электронного документооборота, сдачи отчётности, бухгалтерии,
            CRM и управления персоналом. Более 7 миллионов пользователей по всей России.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#products" className="bg-white text-[#1a56db] px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              Смотреть решения
            </a>
            <a href="tel:+79142727187" className="border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <Icon name="Phone" size={16} />
              Получить консультацию
            </a>
          </div>
        </div>
      </section>

      {/* Цифры */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "7 млн+", label: "пользователей" },
            { value: "30+", label: "лет на рынке" },
            { value: "900+", label: "офисов в России" },
            { value: "1 платформа", label: "для всего бизнеса" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4">
              <p className="text-3xl font-bold text-[#1a56db] mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Решения */}
      <section id="products" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Решения СБИС</h2>
            <p className="text-gray-500">Комплексная автоматизация всех процессов компании</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mb-4">
                  <Icon name={p.icon} size={22} className="text-[#1a56db]" />
                </div>
                <h3 className="font-bold text-base mb-2">{p.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.desc}</p>
                <a href="tel:+79142727187" className="inline-flex items-center gap-1.5 text-sm text-[#1a56db] font-medium hover:underline">
                  Подключить <Icon name="ArrowRight" size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Почему через ProFiX */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">Почему подключать СБИС через ProFiX</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: "Headphones", title: "Настройка и обучение", desc: "Поможем настроить СБИС под ваши процессы и обучим сотрудников работе в системе." },
              { icon: "LifeBuoy", title: "Локальная поддержка", desc: "Наши специалисты рядом — решим любой вопрос быстро, без ожидания на горячей линии." },
              { icon: "Wallet", title: "Выгодные тарифы", desc: "Подберём оптимальный тариф под размер и задачи вашей компании." },
            ].map((item) => (
              <div key={item.title} className="bg-[#F7F9FC] rounded-2xl p-6 border border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mb-4 mx-auto">
                  <Icon name={item.icon} size={22} className="text-[#1a56db]" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#1a56db] to-[#1e3a8a] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Подключить СБИС</h2>
          <p className="text-blue-100 mb-7 text-base">Настроим и подключим СБИС для вашей компании. Первая консультация бесплатно.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+79142727187" className="flex items-center justify-center gap-2 bg-white text-[#1a56db] px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <a href="https://saby.ru" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Сайт СБИС
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2024 ProFiX — официальный партнёр СБИС</span>
          <a href="https://saby.ru" target="_blank" rel="noopener noreferrer" className="hover:text-[#1a56db] transition-colors">saby.ru</a>
        </div>
      </footer>
    </div>
  );
};

export default SbisPage;
