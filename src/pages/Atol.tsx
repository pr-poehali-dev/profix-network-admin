import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import Icon from "@/components/ui/icon";
import PartnerContactForm from "@/components/PartnerContactForm";
import SharedFooter from "@/components/SharedFooter";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const PRODUCTS = [
  {
    icon: "CreditCard",
    name: "Онлайн-кассы",
    desc: "Фискальные регистраторы и автономные кассы, соответствующие 54-ФЗ. Для розницы, HoReCa и сферы услуг. Подключение к любой товароучётной системе.",
  },
  {
    icon: "ScanBarcode",
    name: "Терминалы сбора данных",
    desc: "ТСД серии АТОЛ Smart для автоматизации склада, магазина и производства. Работают под Android, поддерживают 1С и систему маркировки.",
  },
  {
    icon: "Printer",
    name: "Принтеры этикеток",
    desc: "Термо и термотрансферные принтеры для печати этикеток, ценников и штрихкодов. Поддержка маркировки «Честный Знак».",
  },
  {
    icon: "Wifi",
    name: "ОФД АТОЛ",
    desc: "Собственный оператор фискальных данных. Надёжная передача чеков в ФНС, личный кабинет с аналитикой и контролем кассовых операций.",
  },
  {
    icon: "Package",
    name: "Фискальные накопители",
    desc: "ФН-1.1 и ФН-1.2 на 15 и 36 месяцев. Официальные поставки, гарантия подлинности и совместимость со всеми моделями ККТ.",
  },
  {
    icon: "Settings",
    name: "Сервис и поддержка",
    desc: "Регистрация ККТ в ФНС, техническое обслуживание, замена ФН и обновление ПО. Гарантийный и постгарантийный ремонт.",
  },
];

const AtoLPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <SEO
        title="АТОЛ — онлайн-кассы и кассовое оборудование"
        description="Официальный партнёр АТОЛ в Якутске. Онлайн-кассы, фискальные регистраторы, ТСД АТОЛ Smart. Регистрация ККТ в ФНС под ключ. Соответствие 54-ФЗ."
        keywords="АТОЛ Якутск, онлайн-касса, КТТ, фискальный регистратор, 54-ФЗ, регистрация кассы"
        canonical="/atol"
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
            <img src={`${CDN}/atol.png`} alt="АТОЛ" className="h-7 object-contain" />
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
      <section className="bg-gradient-to-br from-[#c0392b] to-[#922b21] text-white py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
            <Icon name="BadgeCheck" size={15} />
            Официальный партнёр АТОЛ
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            АТОЛ — кассовое оборудование №1 в России
          </h1>
          <p className="text-red-100 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Ведущий российский производитель контрольно-кассовой техники. Онлайн-кассы, ФР, ТСД и принтеры этикеток
            для автоматизации торговли, склада и общепита. Полное соответствие 54-ФЗ.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#products" className="bg-white text-[#c0392b] px-6 py-3 rounded-xl font-semibold hover:bg-red-50 transition-colors">
              Смотреть продукты
            </a>
            <a href="tel:+79142727187" className="border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <Icon name="Phone" size={16} />
              Получить консультацию
            </a>
          </div>
        </div>
      </section>

      {/* Факты */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "20+", label: "лет на рынке" },
            { value: "3 млн+", label: "касс работает в России" },
            { value: "54-ФЗ", label: "полное соответствие" },
            { value: "№1", label: "производитель ККТ в РФ" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4">
              <p className="text-3xl font-bold text-[#c0392b] mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Продукты */}
      <section id="products" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Продукты и услуги АТОЛ</h2>
            <p className="text-gray-500">Всё для автоматизации торговли и соответствия законодательству</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                  <Icon name={p.icon} size={22} className="text-[#c0392b]" />
                </div>
                <h3 className="font-bold text-base mb-2">{p.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.desc}</p>
                <a href="tel:+79142727187" className="inline-flex items-center gap-1.5 text-sm text-[#c0392b] font-medium hover:underline">
                  Узнать подробнее <Icon name="ArrowRight" size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Регистрация ККТ */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Регистрация кассы под ключ</h2>
            <p className="text-gray-500 text-base leading-relaxed mb-6">
              Поможем выбрать кассу, зарегистрировать её в ФНС, подключить к ОФД и настроить
              интеграцию с вашей товароучётной системой. Выезд специалиста в день обращения.
            </p>
            <ul className="space-y-3">
              {[
                "Подбор модели кассы под ваш бизнес",
                "Регистрация ККТ в ФНС онлайн",
                "Подключение к ОФД",
                "Настройка и обучение персонала",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon name="CheckCircle" size={16} className="text-[#3ca615] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-shrink-0 bg-[#F7F9FC] rounded-2xl p-8 border border-gray-100 text-center w-full md:w-72">
            <Icon name="CreditCard" size={48} className="text-[#c0392b] mx-auto mb-4" />
            <p className="font-bold text-lg mb-2">Регистрация ККТ</p>
            <p className="text-gray-500 text-sm mb-5">Оформим всё за вас — быстро и без ошибок</p>
            <a href="tel:+79142727187" className="w-full flex items-center justify-center gap-2 bg-[#c0392b] text-white py-3 rounded-xl font-semibold hover:bg-[#a93226] transition-colors text-sm">
              <Icon name="Phone" size={16} />
              Позвонить
            </a>
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
          <PartnerContactForm accentColor="#c0392b" defaultTopic="Торговое оборудование (ККТ, ТСД)" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#c0392b] to-[#922b21] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Нужна касса АТОЛ?</h2>
          <p className="text-red-100 mb-7 text-base">Подберём модель, доставим и настроим. Официальная гарантия производителя.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+79142727187" className="flex items-center justify-center gap-2 bg-white text-[#c0392b] px-7 py-3.5 rounded-xl font-semibold hover:bg-red-50 transition-colors">
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <a href="https://atol.ru" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Сайт производителя
            </a>
          </div>
        </div>
      </section>

      <SharedFooter />
    </div>
  );
};

export default AtoLPage;