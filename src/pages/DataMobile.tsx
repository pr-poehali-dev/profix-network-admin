import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import Icon from "@/components/ui/icon";
import PartnerContactForm from "@/components/PartnerContactForm";
import SharedFooter from "@/components/SharedFooter";
import { useSiteContent } from "@/hooks/useSiteContent";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/datamobile";

const DEFAULT_MAIN_PRODUCTS = [
  {
    id: "standart",
    name: "DataMobile Стандарт",
    price: "от 936 ₽",
    image: `${CDN}/dm_standart.png`,
    badge: null,
    description:
      "Начальная версия для терминалов сбора данных и мобильных устройств. Автоматизирует учёт товаров на складе, в магазине и организациях разного профиля.",
    features: ["Приём и отгрузка товаров", "Инвентаризация", "Перемещение", "Поддержка ТСД на Android"],
  },
  {
    id: "standart_pro",
    name: "DataMobile Стандарт Pro",
    price: "от 1 716 ₽",
    image: `${CDN}/dm_standart_pro.png`,
    badge: "Популярный",
    description:
      "Расширяет функционал Стандарта: работа по заданию, загрузка шаблонов этикеток и печать на мобильном принтере. Поддерживает модули Маркировка и RFID.",
    features: ["Всё из Стандарта", "Работа по заданию", "Печать этикеток", "Модули: Маркировка, RFID"],
  },
  {
    id: "online_lite",
    name: "DataMobile Online Lite",
    price: "2 496 ₽",
    image: `${CDN}/dm_online_lite.png`,
    badge: null,
    description:
      "Работа в режиме реального времени с защитой от потери связи. Широкие возможности для работы на складе и в торговом зале.",
    features: ["Онлайн-режим", "Защита от потери связи", "Модули: Маркировка, RFID", "Работа в торговом зале"],
  },
  {
    id: "online",
    name: "DataMobile Online",
    price: "от 3 120 ₽",
    image: `${CDN}/dm_online.png`,
    badge: "Максимум",
    description:
      "Полноценный онлайн-режим, генерация новых штрихкодов на ТСД, отображение картинок из товароучётной системы. Максимальный функционал для крупного склада.",
    features: ["Полный онлайн-режим", "Генерация штрихкодов", "Картинки товаров из 1С", "Все складские операции"],
  },
];

const MODULES = [
  {
    name: "Модуль Маркировка",
    price: "от 1 500 ₽",
    image: `${CDN}/dm_marking.png`,
    description:
      'Готовое решение для работы с товарами обязательной маркировки ("Честный Знак", ЕГАИС): табак, алкоголь, обувь, одежда, лекарства. Уникальный механизм проверки кодов маркировки и групповых упаковок.',
  },
  {
    name: "Модуль RFID",
    price: "от 4 500 ₽",
    image: `${CDN}/dm_rfid.png`,
    description:
      "Автоматизация учёта по радиочастотным меткам. ТСД с RFID-считывателем распознаёт сотни меток за секунду — складские операции в разы быстрее, чем по штрихкодам.",
  },
];

const PROFILE_SOLUTIONS = [
  {
    name: "DM.Доставка Pro",
    price: "от 1 560 ₽/год",
    icon: "Truck",
    description: "Мобильное приложение для автоматизации курьерских служб. Лицензия по подписке на 12 месяцев, несколько тарифов в зависимости от объёма документов.",
  },
  {
    name: "DM.Invent",
    price: "от 2 700 ₽",
    icon: "ClipboardList",
    description: "Инвентаризация основных средств на ТСД и мобильных устройствах Android. Учёт имущества в разрезе материально ответственных лиц и мест расположения.",
  },
  {
    name: "DM.ТОИР",
    price: "от 2 925 ₽",
    icon: "Wrench",
    description: "Обслуживание основных средств: фиксация дефектов, управление ремонтами, учёт аварийного запаса. Применяется в нефтегазовой, энергетической и производственной отраслях.",
  },
  {
    name: "DM.Прайсчекер",
    price: "от 2 100 ₽",
    icon: "ScanBarcode",
    description: "ПО для информационных киосков и прайс-чекеров. Идентификация товара по штрихкоду с выводом актуальной цены, изображения и информации об акциях.",
  },
];

const DataMobilePage = () => {
  const navigate = useNavigate();
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  const { str, json } = useSiteContent();
  const MAIN_PRODUCTS = json("partner.datamobile.main_products", DEFAULT_MAIN_PRODUCTS) as typeof DEFAULT_MAIN_PRODUCTS;
  const DYN_MODULES = json("partner.datamobile.modules", MODULES) as typeof MODULES;
  const DYN_SOLUTIONS = json("partner.datamobile.solutions", PROFILE_SOLUTIONS) as typeof PROFILE_SOLUTIONS;

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">
      <SEO
        title="DataMobile — ПО для склада и торговли"
        description="Официальный партнёр DataMobile в Якутске. Продажа и внедрение ПО для автоматизации склада и торгового зала. DataMobile Стандарт, Online, модули Маркировка и RFID."
        keywords="DataMobile Якутск, ПО для склада, автоматизация склада, DataMobile купить"
        canonical="/datamobile"
      />
      {/* Шапка */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-[#374151] hover:text-[#3ca615] transition-colors"
          >
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
            <img
              src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/datamobile_1.svg"
              alt="DataMobile"
              className="h-7 object-contain"
            />
          </div>
          <div className="ml-auto">
            <a
              href="tel:+79142727187"
              className="hidden sm:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors"
            >
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="relative bg-gradient-to-br from-[#1565C0] to-[#0d47a1] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)" }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
              <Icon name="BadgeCheck" size={15} />
              Официальный партнёр DataMobile
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
              {str("partner.datamobile.hero_title", "DataMobile — ПО для склада и торговли")}
            </h1>
            <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-6 max-w-xl">
              {str("partner.datamobile.hero_desc", "Программное обеспечение для автоматизации бизнес-процессов на складах и в торговых залах. Входит в Единый реестр российского ПО.")}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#products"
                className="bg-white text-[#1565C0] px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Смотреть продукты
              </a>
              <a
                href="tel:+79142727187"
                className="border border-white/40 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Icon name="Phone" size={16} />
                Получить консультацию
              </a>
            </div>
          </div>
          <div className="flex-shrink-0 hidden md:block">
            <img
              src={`${CDN}/dm_banner2.jpg`}
              alt="DataMobile"
              className="w-[380px] rounded-2xl shadow-2xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: "ShieldCheck", title: "Реестр российского ПО", desc: "Официально включено" },
            { icon: "Smartphone", title: "Android ТСД", desc: "Все популярные модели" },
            { icon: "Zap", title: "Быстрое внедрение", desc: "Запуск от 1 дня" },
            { icon: "HeadphonesIcon", title: "Техподдержка", desc: "Помогаем 24/7" },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-2 p-4">
              <div className="w-12 h-12 rounded-2xl bg-[#edf7e8] flex items-center justify-center">
                <Icon name={item.icon} size={22} className="text-[#3ca615]" />
              </div>
              <p className="font-semibold text-sm text-[#111827]">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Основные продукты */}
      <section id="products" className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Версии DataMobile</h2>
            <p className="text-gray-500">Выберите подходящую версию под задачи вашего бизнеса</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MAIN_PRODUCTS.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
              >
                {product.badge && (
                  <div className="bg-[#3ca615] text-white text-xs font-semibold px-3 py-1 text-center">
                    {product.badge}
                  </div>
                )}
                <div className="p-5 flex flex-col items-center">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-36 object-contain mb-4 group-hover:scale-105 transition-transform duration-300"
                  />
                  <h3 className="font-bold text-base text-center mb-1">{product.name}</h3>
                  <p className="text-[#1565C0] font-semibold text-sm mb-3">{product.price}</p>
                  <p className="text-gray-500 text-xs text-center leading-relaxed mb-4">{product.description}</p>
                  <ul className="w-full space-y-1 mb-4">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                        <Icon name="Check" size={13} className="text-[#3ca615] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-auto px-5 pb-5">
                  <a
                    href="tel:+79142727187"
                    className="w-full flex items-center justify-center gap-2 bg-[#1565C0] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#1255a8] transition-colors"
                  >
                    Заказать
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Дополнительные модули */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Дополнительные модули</h2>
            <p className="text-gray-500">Расширьте возможности DataMobile под специфику вашего бизнеса</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DYN_MODULES.map((mod) => (
              <div key={mod.name} className="flex gap-5 bg-[#F7F9FC] rounded-2xl p-6 border border-gray-100">
                <img
                  src={mod.image}
                  alt={mod.name}
                  className="h-28 w-24 object-contain shrink-0"
                />
                <div className="flex flex-col">
                  <h3 className="font-bold text-base mb-1">{mod.name}</h3>
                  <p className="text-[#1565C0] font-semibold text-sm mb-2">{mod.price}</p>
                  <p className="text-gray-500 text-sm leading-relaxed flex-1">{mod.description}</p>
                  <a
                    href="tel:+79142727187"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#3ca615] font-medium hover:underline"
                  >
                    Узнать подробнее <Icon name="ArrowRight" size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Профильные решения */}
      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Профильные решения</h2>
            <p className="text-gray-500">Специализированные приложения для отдельных отраслей и задач</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DYN_SOLUTIONS.map((sol) => (
              <div key={sol.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-[#EBF3FF] flex items-center justify-center mb-4">
                  <Icon name={sol.icon} size={22} className="text-[#1565C0]" />
                </div>
                <h3 className="font-bold text-sm mb-1">{sol.name}</h3>
                <p className="text-[#1565C0] font-semibold text-xs mb-2">{sol.price}</p>
                <p className="text-gray-500 text-xs leading-relaxed flex-1">{sol.description}</p>
                <a
                  href="tel:+79142727187"
                  className="mt-4 w-full flex items-center justify-center gap-2 border border-[#1565C0] text-[#1565C0] py-2 rounded-xl text-xs font-medium hover:bg-[#EBF3FF] transition-colors"
                >
                  Заказать
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
          <PartnerContactForm accentColor="#1565C0" defaultTopic="Торговое оборудование (ККТ, ТСД)" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#1565C0] to-[#0d47a1] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Готовы автоматизировать склад?</h2>
          <p className="text-blue-100 mb-7 text-base">
            Подберём оптимальное решение DataMobile под ваши задачи. Поставка, настройка и обучение под ключ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:+79142727187"
              className="flex items-center justify-center gap-2 bg-white text-[#1565C0] px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <button
              onClick={() => navigate("/#contacts")}
              className="flex items-center justify-center gap-2 border border-white/40 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      </section>

      {/* Подвал */}
      <SharedFooter />
    </div>
  );
};

export default DataMobilePage;