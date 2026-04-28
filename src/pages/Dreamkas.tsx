import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import Icon from "@/components/ui/icon";
import PartnerContactForm from "@/components/PartnerContactForm";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const PRODUCTS = [
  {
    icon: "CreditCard",
    name: "Онлайн-кассы Дримкас",
    desc: "Кассы собственного производства: Дримкас Ф, Дримкас Старт и Касса Ф. Простые в настройке, готовые к работе с 54-ФЗ и системой маркировки.",
  },
  {
    icon: "Cloud",
    name: "Облачная касса",
    desc: "Виртуальная касса для интернет-магазинов и курьерской доставки. Выбивает чеки автоматически без физического оборудования на точке.",
  },
  {
    icon: "BarChart3",
    name: "Касса с аналитикой",
    desc: "Встроенная система отчётности: выручка по часам, топ товаров, средний чек. Управляйте магазином прямо с телефона.",
  },
  {
    icon: "Package",
    name: "Управление товарами",
    desc: "Ведение базы товаров, остатки на складе, приёмка по накладным. Интеграция с 1С и популярными учётными системами.",
  },
  {
    icon: "Tag",
    name: "Маркировка",
    desc: "Работа с товарами, подлежащими обязательной маркировке: «Честный Знак». Сигареты, обувь, одежда, молочная продукция.",
  },
  {
    icon: "Users",
    name: "Программа лояльности",
    desc: "Встроенная система скидок и бонусов для постоянных покупателей. Карты лояльности, акции и персональные предложения.",
  },
];

const DreamkasPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <SEO
        title="Дримкас — кассы для малого бизнеса"
        description="Официальный партнёр Дримкас в Якутске. Онлайн-кассы для магазинов, кафе и сферы услуг. Подключение к ОФД, регистрация в ФНС, настройка маркировки."
        keywords="Дримкас Якутск, касса для магазина, онлайн-касса купить, касса для кафе"
        canonical="/dreamkas"
      />
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[#374151] hover:text-[#3ca615] transition-colors">
            <Icon name="ChevronLeft" size={20} />
            <span className="text-sm font-medium">На главную</span>
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <img src={`${CDN}/dreamkas.svg`} alt="Дримкас" className="h-7 object-contain" />
          <div className="ml-auto">
            <a href="tel:+79142727187" className="hidden sm:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors">
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="bg-gradient-to-br from-[#2e7d32] to-[#1b5e20] text-white py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
            <Icon name="BadgeCheck" size={15} />
            Официальный партнёр Дримкас
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            Дримкас — простые кассы для вашего бизнеса
          </h1>
          <p className="text-green-100 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Российский производитель кассового оборудования и программного обеспечения для автоматизации
            торговли. Прямые поставки — низкая цена. Всё необходимое для работы по 54-ФЗ.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#products" className="bg-white text-[#2e7d32] px-6 py-3 rounded-xl font-semibold hover:bg-green-50 transition-colors">
              Смотреть продукты
            </a>
            <a href="tel:+79142727187" className="border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <Icon name="Phone" size={16} />
              Получить консультацию
            </a>
          </div>
        </div>
      </section>

      {/* Почему Дримкас */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: "Zap", title: "Быстрый старт", desc: "Касса готова к работе за 15 минут" },
            { icon: "Smartphone", title: "Управление с телефона", desc: "Приложение для iOS и Android" },
            { icon: "ShieldCheck", title: "54-ФЗ и маркировка", desc: "Полное соответствие требованиям" },
            { icon: "Headphones", title: "Поддержка 24/7", desc: "Техподдержка в любое время" },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-2 p-4">
              <div className="w-11 h-11 rounded-2xl bg-[#edf7e8] flex items-center justify-center">
                <Icon name={item.icon} size={20} className="text-[#2e7d32]" />
              </div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Продукты */}
      <section id="products" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Продукты Дримкас</h2>
            <p className="text-gray-500">Кассы и программное обеспечение для малого и среднего бизнеса</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#edf7e8] flex items-center justify-center mb-4">
                  <Icon name={p.icon} size={22} className="text-[#2e7d32]" />
                </div>
                <h3 className="font-bold text-base mb-2">{p.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.desc}</p>
                <a href="tel:+79142727187" className="inline-flex items-center gap-1.5 text-sm text-[#2e7d32] font-medium hover:underline">
                  Узнать подробнее <Icon name="ArrowRight" size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Для кого */}
      <section className="bg-white py-12 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-center mb-8">Подходит для</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {["Розничных магазинов", "Кафе и ресторанов", "Интернет-магазинов", "Курьерских служб", "Сферы услуг", "Рынков и ярмарок", "Вендинга", "Салонов красоты"].map((item) => (
              <span key={item} className="bg-[#edf7e8] text-[#2e7d32] text-sm font-medium px-4 py-2 rounded-full">
                {item}
              </span>
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
          <PartnerContactForm accentColor="#2e7d32" defaultTopic="Торговое оборудование (ККТ, ТСД)" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#2e7d32] to-[#1b5e20] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Купить кассу Дримкас</h2>
          <p className="text-green-100 mb-7 text-base">Подберём модель, подключим к ОФД, зарегистрируем в ФНС и обучим персонал.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+79142727187" className="flex items-center justify-center gap-2 bg-white text-[#2e7d32] px-7 py-3.5 rounded-xl font-semibold hover:bg-green-50 transition-colors">
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <a href="https://dreamkas.ru" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Сайт производителя
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2024 ProFiX — официальный партнёр Дримкас</span>
          <a href="https://dreamkas.ru" target="_blank" rel="noopener noreferrer" className="hover:text-[#2e7d32] transition-colors">dreamkas.ru</a>
        </div>
      </footer>
    </div>
  );
};

export default DreamkasPage;