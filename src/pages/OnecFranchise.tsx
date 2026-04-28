import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import PartnerContactForm from "@/components/PartnerContactForm";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const PRODUCTS = [
  {
    icon: "ShoppingCart",
    name: "1С:Розница",
    desc: "Автоматизация розничной торговли: ценообразование, складской учёт, работа с кассами, маркировка. Подходит для магазинов любого формата.",
  },
  {
    icon: "Warehouse",
    name: "1С:Управление торговлей",
    desc: "Комплексное управление торговыми операциями: закупки, продажи, склад, CRM, финансы. Для оптовой и розничной торговли.",
  },
  {
    icon: "Building2",
    name: "1С:Бухгалтерия",
    desc: "Ведение бухгалтерского и налогового учёта. Автоматическая подготовка отчётности для ФНС, ПФР, ФСС. Актуально для всех систем налогообложения.",
  },
  {
    icon: "Users",
    name: "1С:Зарплата и управление персоналом",
    desc: "Кадровый учёт, расчёт зарплаты, больничные, отпуска, электронные трудовые книжки. Отправка отчётов в ПФР и ФСС.",
  },
  {
    icon: "Factory",
    name: "1С:ERP / Управление предприятием",
    desc: "Управление производством, планирование, бюджетирование, аналитика. Для среднего и крупного бизнеса.",
  },
  {
    icon: "Globe",
    name: "1С:Предприятие онлайн",
    desc: "Облачная 1С без установки и обслуживания серверов. Работайте из любой точки мира через браузер.",
  },
];

const OnecFranchisePage = () => {
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
          <img src={`${CDN}/1c.svg`} alt="1С Франчайзи" className="h-8 object-contain" />
          <div className="ml-auto">
            <a href="tel:+79142727187" className="hidden sm:flex items-center gap-2 bg-[#3ca615] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2d8a10] transition-colors">
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        </div>
      </header>

      {/* Герой */}
      <section className="bg-gradient-to-br from-[#e8a000] to-[#b37800] text-white py-14 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-5">
            <Icon name="BadgeCheck" size={15} />
            Авторизованный франчайзи 1С
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4 max-w-2xl">
            1С — автоматизация вашего бизнеса
          </h1>
          <p className="text-yellow-100 text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
            Продажа, внедрение и сопровождение программных продуктов 1С. Розница, торговля,
            бухгалтерия, зарплата, ERP — решения для бизнеса любого масштаба.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="#products" className="bg-white text-[#e8a000] px-6 py-3 rounded-xl font-semibold hover:bg-yellow-50 transition-colors">
              Смотреть продукты
            </a>
            <a href="tel:+79142727187" className="border border-white/30 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
              <Icon name="Phone" size={16} />
              Получить консультацию
            </a>
          </div>
        </div>
      </section>

      {/* Услуги франчайзи */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: "ShoppingBag", title: "Продажа лицензий", desc: "Официальные поставки 1С" },
            { icon: "Settings", title: "Внедрение", desc: "Настройка под ваши процессы" },
            { icon: "GraduationCap", title: "Обучение", desc: "Обучение сотрудников работе в 1С" },
            { icon: "LifeBuoy", title: "Сопровождение", desc: "Техподдержка и обновления" },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-2 p-4">
              <div className="w-11 h-11 rounded-2xl bg-yellow-50 flex items-center justify-center">
                <Icon name={item.icon} size={20} className="text-[#e8a000]" />
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
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Продукты 1С</h2>
            <p className="text-gray-500">Решения для автоматизации всех процессов вашего бизнеса</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PRODUCTS.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center mb-4">
                  <Icon name={p.icon} size={22} className="text-[#e8a000]" />
                </div>
                <h3 className="font-bold text-base mb-2">{p.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{p.desc}</p>
                <a href="tel:+79142727187" className="inline-flex items-center gap-1.5 text-sm text-[#e8a000] font-medium hover:underline">
                  Узнать цену <Icon name="ArrowRight" size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Процесс внедрения */}
      <section className="bg-white py-14 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Как проходит внедрение</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {[
              { step: "1", title: "Анализ", desc: "Изучаем ваши задачи" },
              { step: "2", title: "Подбор", desc: "Выбираем продукт 1С" },
              { step: "3", title: "Настройка", desc: "Настраиваем под ваш учёт" },
              { step: "4", title: "Обучение", desc: "Обучаем сотрудников" },
              { step: "5", title: "Поддержка", desc: "Сопровождаем и обновляем" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-11 h-11 rounded-full bg-[#e8a000] text-white font-bold flex items-center justify-center mx-auto mb-3">
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
          <PartnerContactForm accentColor="#e8a000" defaultTopic="Услуги по 1С" />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#e8a000] to-[#b37800] text-white py-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Внедрить 1С для вашего бизнеса</h2>
          <p className="text-yellow-100 mb-7 text-base">Подберём продукт, выполним настройку и обучим ваших сотрудников.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+79142727187" className="flex items-center justify-center gap-2 bg-white text-[#e8a000] px-7 py-3.5 rounded-xl font-semibold hover:bg-yellow-50 transition-colors">
              <Icon name="Phone" size={18} />
              +7 (914) 272-71-87
            </a>
            <a href="https://1c.ru" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-white/30 text-white px-7 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors">
              Сайт 1С
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <span>© 2024 ProFiX — авторизованный франчайзи 1С</span>
          <a href="https://1c.ru" target="_blank" rel="noopener noreferrer" className="hover:text-[#e8a000] transition-colors">1c.ru</a>
        </div>
      </footer>
    </div>
  );
};

export default OnecFranchisePage;