import Icon from "@/components/ui/icon";

type ServiceIcon = "Monitor" | "Network" | "Camera" | "Cpu" | "Printer" | "Shield";
type FeatureIcon = "Clock" | "Star" | "Users" | "Headphones";

const services: { icon: ServiceIcon; title: string; desc: string }[] = [
  {
    icon: "Monitor",
    title: "1С сопровождение",
    desc: "Установка, настройка, обновление и техническая поддержка программ 1С для вашего бизнеса.",
  },
  {
    icon: "Network",
    title: "Монтаж и администрирование сетей",
    desc: "Проектирование, прокладка и обслуживание локальных сетей любой сложности.",
  },
  {
    icon: "Camera",
    title: "Видеонаблюдение",
    desc: "Установка и настройка систем видеонаблюдения для офисов, магазинов и производств.",
  },
  {
    icon: "Cpu",
    title: "Ремонт компьютеров и ноутбуков",
    desc: "Диагностика и ремонт любой сложности: замена комплектующих, восстановление данных.",
  },
  {
    icon: "Printer",
    title: "Заправка картриджей",
    desc: "Быстрая и качественная заправка картриджей для всех популярных марок принтеров.",
  },
  {
    icon: "Shield",
    title: "IT-безопасность",
    desc: "Настройка антивирусной защиты, резервное копирование, защита корпоративных данных.",
  },
];

const ServicesAboutSection = () => {
  return (
    <>
      {/* SERVICES */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-3">Что мы делаем</p>
            <h2 className="font-oswald text-4xl font-bold text-[#0D1B2A]">НАШИ УСЛУГИ</h2>
            <div className="w-16 h-1 bg-[#3ca615] mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div
                key={s.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-[#3ca615] hover:shadow-xl transition-all duration-300 bg-[#F7F9FC] hover:bg-white animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#edf7e8] group-hover:bg-[#3ca615] flex items-center justify-center mb-4 transition-colors">
                  <Icon name={s.icon} size={22} className="text-[#3ca615] group-hover:text-white transition-colors" fallback="Settings" />
                </div>
                <h3 className="font-oswald text-xl font-semibold text-[#0D1B2A] mb-2">{s.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 bg-gradient-to-br from-[#edf7e8] to-[#F7F9FC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-3">О нас</p>
              <h2 className="font-oswald text-4xl font-bold text-[#0D1B2A] mb-6">
                НАДЁЖНЫЙ IT-ПАРТНЁР<br />В ЯКУТСКЕ
              </h2>
              <p className="text-[#4B5563] leading-relaxed mb-6">
                Компания <strong>ProFiX</strong> работает в Якутске уже более 10 лет. Мы специализируемся на полном спектре IT-услуг: от ремонта техники до построения корпоративных сетей.
              </p>
              <p className="text-[#4B5563] leading-relaxed mb-8">
                Наша команда — сертифицированные специалисты с многолетним опытом. Мы ценим время клиента и гарантируем быстрое, качественное решение любых задач.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { icon: "Clock", text: "Быстрый выезд к клиенту" },
                  { icon: "Star", text: "Гарантия на все работы" },
                  { icon: "Users", text: "Опытная команда" },
                  { icon: "Headphones", text: "Поддержка 24/7" },
                ] as { icon: FeatureIcon; text: string }[]).map((f) => (
                  <div key={f.text} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                    <Icon name={f.icon} size={18} className="text-[#3ca615] shrink-0" fallback="Check" />
                    <span className="text-sm text-[#374151] font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-xl">
              <img
                src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/fa4bcb2f-6f54-4667-a38a-b680c307956e.jpg"
                alt="Доверьтесь профессионалам"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT INFO BAR */}
      <section className="py-8 bg-[#ff7f11e8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-white">
            <div className="flex items-start gap-3">
              <Icon name="MapPin" size={20} className="text-white/70 shrink-0 mt-0.5" />
              <div>
                <p className="text-white/60 mb-0.5 text-base">Адрес</p>
                <p className="font-medium text-base">г. Якутск, ул. Халтурина, 6</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="Phone" size={20} className="text-white/70 shrink-0 mt-0.5" />
              <div>
                <p className="text-white/60 mb-0.5 text-base">Телефон</p>
                <a href="tel:+79142727187" className="font-medium text-base hover:underline">+7 (914) 272-71-87</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="Mail" size={20} className="text-white/70 shrink-0 mt-0.5" />
              <div>
                <p className="text-white/60 mb-0.5 text-base">Email</p>
                <a href="mailto:727187@it-profix.ru" className="font-medium text-base hover:underline">727187@it-profix.ru</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="Clock" size={20} className="text-white/70 shrink-0 mt-0.5" />
              <div>
                <p className="text-white/60 mb-0.5 text-base">Режим работы</p>
                <p className="font-medium text-base">Пн–Сб: 9:00 – 19:00</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServicesAboutSection;
