import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import Icon from "@/components/ui/icon";
import PartnerContactForm from "@/components/PartnerContactForm";
import SharedFooter from "@/components/SharedFooter";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const CATEGORIES = [
  {
    icon: "Monitor",
    name: "POS-терминалы",
    desc: "Моноблоки и сенсорные терминалы для торговых точек, ресторанов и сервисных центров. Работают под управлением Windows и Android.",
  },
  {
    icon: "Printer",
    name: "Фискальные регистраторы",
    desc: "Автономные ФР для подключения к любому компьютеру или кассовой системе. Поддержка 54-ФЗ и всех форматов фискальных данных.",
  },
  {
    icon: "ScanBarcode",
    name: "Терминалы сбора данных",
    desc: "ТСД на Android для автоматизации склада, инвентаризации и приёмки товаров. Поддержка 1D/2D-штрихкодов и DataMatrix.",
  },
  {
    icon: "Smartphone",
    name: "Мобильные принтеры",
    desc: "Компактные принтеры этикеток и чеков для мобильных сотрудников: курьеров, торговых представителей, работников склада.",
  },
  {
    icon: "Tag",
    name: "Принтеры этикеток",
    desc: "Настольные принтеры для печати ценников, штрихкодов и этикеток с маркировкой «Честный Знак». Термо и термотрансферная печать.",
  },
  {
    icon: "Scan",
    name: "Сканеры штрихкодов",
    desc: "Ручные и стационарные сканеры для торговли и склада. Считывание 1D/2D-кодов, DataMatrix, QR. Проводные и беспроводные модели.",
  },
];

const ADVANTAGES = [
  { icon: "Factory", text: "Собственное производство" },
  { icon: "MapPin", text: "Сервисные центры по всей России" },
  { icon: "ShieldCheck", text: "Гарантия 1–3 года" },
  { icon: "Truck", text: "Доставка по всей России" },
  { icon: "BadgeCheck", text: "Соответствие 54-ФЗ" },
  { icon: "Headphones", text: "Техподдержка 24/7" },
];

const POSCenterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <SEO
        title="POSCenter — торговое POS-оборудование"
        description="Официальный партнёр POSCenter в Якутске. POS-терминалы, фискальные регистраторы, ТСД, сканеры штрихкодов и принтеры этикеток. Поставка и настройка."
        keywords="POSCenter Якутск, POS-терминал, фискальный регистратор, ТСД, сканер штрихкодов"
        canonical="/poscenter"
      />
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-[#374151] hover:text-[#3ca615] transition-colors">
            <Icon name="ChevronLeft" size={20} />
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5">
            <img
              src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/e1b11d67-0791-42f4-b42a-074a6bd6b3b9.png"
              alt="ProFiX"
              className="h-8 w-8 object-contain"
            />
            <span className="font-oswald text-lg font-bold tracking-wide hidden sm:block">
              <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
            </span>
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex items-center gap-2">
            <img src={`${CDN}/poscenter.png`} alt="POSCenter" className="h-7 object-contain" />
          </div>
          <div className="ml-auto">
            <a href="tel:+79142727187" className="hidden sm:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors">
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="bg-gradient-to-br from-[#111827] to-[#1f2937] text-white py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-5">
            <Icon name="BadgeCheck" size={15} />
            Официальный партнёр POSCenter
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            POSCenter — торговое оборудование для бизнеса
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Российский производитель POS-оборудования: кассы, терминалы, ТСД, сканеры и принтеры.
            Прямые поставки без наценок посредников. Собственное производство и сервисные центры по всей России.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#categories" className="bg-[#3ca615] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2d8a10] transition-colors">
              Смотреть оборудование
            </a>
            <a href="tel:+79142727187" className="border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <Icon name="Phone" size={16} />
              Получить консультацию
            </a>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {ADVANTAGES.map((a) => (
            <div key={a.text} className="flex flex-col items-center text-center gap-2 p-3">
              <div className="w-11 h-11 rounded-2xl bg-[#edf7e8] flex items-center justify-center">
                <Icon name={a.icon} size={20} className="text-[#3ca615]" />
              </div>
              <p className="text-xs font-semibold text-[#111827] leading-snug">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Категории */}
      <section id="categories" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Категории оборудования</h2>
            <p className="text-gray-500">Полный спектр POS-оборудования для автоматизации торговли</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => (
              <div key={cat.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#111827] flex items-center justify-center mb-4">
                  <Icon name={cat.icon} size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-base mb-2">{cat.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{cat.desc}</p>
                <a href="tel:+79142727187" className="inline-flex items-center gap-1.5 text-sm text-[#3ca615] font-medium hover:underline">
                  Узнать цену <Icon name="ArrowRight" size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Для кого */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Для кого подходит</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: "ShoppingBag", name: "Розничная торговля", desc: "Продуктовые, одежда, электроника, аптеки" },
              { icon: "UtensilsCrossed", name: "HoReCa", desc: "Рестораны, кафе, фастфуд, доставка" },
              { icon: "Warehouse", name: "Склад и логистика", desc: "Приёмка, инвентаризация, маркировка" },
              { icon: "Building2", name: "Сервисные центры", desc: "Ремонт, техобслуживание, выездные услуги" },
            ].map((item) => (
              <div key={item.name} className="bg-[#F7F9FC] rounded-2xl p-5 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center mb-3">
                  <Icon name={item.icon} size={18} className="text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                <p className="text-gray-500 text-xs">{item.desc}</p>
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
          <PartnerContactForm accentColor="#111827" defaultTopic="Торговое оборудование (ККТ, ТСД)" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#111827] to-[#1f2937] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Подберём оборудование под ваш бизнес</h2>
          <p className="text-gray-300 mb-7 text-base">Поставка, настройка и сервисное обслуживание оборудования POSCenter под ключ.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+79142727187" className="flex items-center justify-center gap-2 bg-[#3ca615] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#2d8a10] transition-colors">
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <a href="https://pos-center.ru" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Сайт производителя
            </a>
          </div>
        </div>
      </section>

      <SharedFooter />
    </div>
  );
};

export default POSCenterPage;