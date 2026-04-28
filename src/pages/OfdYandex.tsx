import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import Icon from "@/components/ui/icon";
import PartnerContactForm from "@/components/PartnerContactForm";
import SharedFooter from "@/components/SharedFooter";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const FEATURES = [
  {
    icon: "Send",
    name: "Передача данных в ФНС",
    desc: "Автоматическая передача фискальных данных со всех ваших касс в налоговую службу в режиме реального времени.",
  },
  {
    icon: "BarChart3",
    name: "Аналитика продаж",
    desc: "Детальная статистика по чекам, выручке, среднему чеку и топ-товарам. Контролируйте бизнес из любого места.",
  },
  {
    icon: "Bell",
    name: "Мониторинг касс",
    desc: "Оперативные уведомления о проблемах с кассами: нет связи, заполнен ФН, ошибки передачи данных.",
  },
  {
    icon: "Shield",
    name: "Надёжное хранение",
    desc: "Все фискальные документы хранятся в защищённом облаке Яндекса. Доступ к данным за любой период.",
  },
  {
    icon: "FileSearch",
    name: "Электронные чеки",
    desc: "Отправка чеков покупателям на email и телефон. Хранение истории всех транзакций.",
  },
  {
    icon: "Zap",
    name: "Быстрое подключение",
    desc: "Подключение кассы к ОФД занимает несколько минут. Никакого сложного оборудования или настроек.",
  },
];

const OfdYandexPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <SEO
        title="ОФД Яндекс — оператор фискальных данных"
        description="Подключение к ОФД Яндекс в Якутске. Передача данных с касс в ФНС, мониторинг и аналитика продаж. Быстрое подключение, выгодные тарифы."
        keywords="ОФД Якутск, оператор фискальных данных, подключить ОФД, ОФД Яндекс"
        canonical="/ofd-yandex"
      />
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-[#374151] hover:text-[#3ca615] transition-colors">
            <Icon name="ChevronLeft" size={20} />
            <span className="text-sm font-medium">На главную</span>
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <img src={`${CDN}/ofdyandex.svg`} alt="ОФД Яндекс" className="h-7 object-contain" />
          <div className="ml-auto">
            <a href="tel:+79142727187" className="hidden sm:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors">
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="bg-gradient-to-br from-[#FF6600] to-[#cc4400] text-white py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
            <Icon name="BadgeCheck" size={15} />
            Официальный партнёр ОФД Яндекс
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            ОФД Яндекс — надёжная передача фискальных данных
          </h1>
          <p className="text-orange-100 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Оператор фискальных данных от Яндекса. Передача чеков в ФНС, мониторинг касс
            и аналитика продаж в едином сервисе. Подключение за несколько минут.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#features" className="bg-white text-[#FF6600] px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors">
              Узнать подробнее
            </a>
            <a href="tel:+79142727187" className="border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <Icon name="Phone" size={16} />
              Подключить ОФД
            </a>
          </div>
        </div>
      </section>

      {/* Что такое ОФД */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Что такое ОФД и зачем он нужен?</h2>
          <p className="text-gray-500 leading-relaxed">
            По закону 54-ФЗ каждая онлайн-касса обязана передавать данные о каждом чеке в ФНС через
            оператора фискальных данных. ОФД — это посредник между вашей кассой и налоговой.
            Без подключения к ОФД работа кассы незаконна.
          </p>
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Возможности ОФД Яндекс</h2>
            <p className="text-gray-500">Не просто передача данных — полный контроль над кассами</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
                  <Icon name={f.icon} size={22} className="text-[#FF6600]" />
                </div>
                <h3 className="font-bold text-base mb-2">{f.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Тарифы */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Тарифы</h2>
            <p className="text-gray-500">Платите только за подключённые кассы</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "На 15 месяцев", price: "от 1 500 ₽", desc: "Для малого бизнеса с одной кассой", highlight: false },
              { name: "На 36 месяцев", price: "от 2 500 ₽", desc: "Оптимальный вариант на срок ФН", highlight: true },
              { name: "Мультикасса", price: "по запросу", desc: "Для сетей и нескольких точек", highlight: false },
            ].map((t) => (
              <div key={t.name} className={`rounded-2xl p-6 border ${t.highlight ? "border-[#FF6600] bg-orange-50" : "border-gray-100 bg-[#F7F9FC]"}`}>
                {t.highlight && <p className="text-[#FF6600] text-xs font-bold uppercase tracking-wide mb-3">Популярный</p>}
                <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                <p className="text-2xl font-bold text-[#FF6600] mb-2">{t.price}</p>
                <p className="text-gray-500 text-sm mb-4">{t.desc}</p>
                <a href="tel:+79142727187" className={`w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-medium transition-colors ${t.highlight ? "bg-[#FF6600] text-white hover:bg-[#cc4400]" : "border border-[#FF6600] text-[#FF6600] hover:bg-orange-50"}`}>
                  Подключить
                </a>
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
          <PartnerContactForm accentColor="#FF6600" defaultTopic="Торговое оборудование (ККТ, ТСД)" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#FF6600] to-[#cc4400] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Подключить ОФД Яндекс</h2>
          <p className="text-orange-100 mb-7 text-base">Подключим вашу кассу к ОФД быстро и без лишних хлопот.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+79142727187" className="flex items-center justify-center gap-2 bg-white text-[#FF6600] px-7 py-3.5 rounded-xl font-semibold hover:bg-orange-50 transition-colors">
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <a href="https://ofd.yandex.ru" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Сайт ОФД Яндекс
            </a>
          </div>
        </div>
      </section>

      <SharedFooter />
    </div>
  );
};

export default OfdYandexPage;