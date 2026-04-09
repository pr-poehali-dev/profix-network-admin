import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/27e6a446-83e0-42ac-9fb3-936312c8e887.jpg";

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

const navLinks = ["Главная", "Услуги", "О компании", "Контакты"];

const Index = () => {
  const [activeSection, setActiveSection] = useState("Главная");
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", problem: "" });
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (section: string) => {
    setActiveSection(section);
    setMenuOpen(false);
    const id =
      section === "Главная" ? "hero"
      : section === "Услуги" ? "services"
      : section === "О компании" ? "about"
      : "contacts";
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-golos text-[#111827]">

      {/* NAVBAR */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-white/80 backdrop-blur"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#1565C0] flex items-center justify-center">
              <Icon name="Zap" size={18} className="text-white" />
            </div>
            <span className="font-oswald text-xl font-bold tracking-wide text-[#1565C0]">ProFiX</span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === link
                    ? "bg-[#1565C0] text-white"
                    : "text-[#374151] hover:bg-[#EBF3FF] hover:text-[#1565C0]"
                }`}
              >
                {link}
              </button>
            ))}
          </nav>

          <a
            href="tel:+79142727187"
            className="hidden md:flex items-center gap-2 bg-[#1565C0] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0D47A1] transition-colors"
          >
            <Icon name="Phone" size={15} />
            +7 (914) 272-71-87
          </a>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 flex flex-col gap-1 animate-fade-in">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === link ? "bg-[#1565C0] text-white" : "text-[#374151] hover:bg-[#EBF3FF]"
                }`}
              >
                {link}
              </button>
            ))}
            <a href="tel:+79142727187" className="mt-2 flex items-center gap-2 bg-[#1565C0] text-white px-4 py-3 rounded-lg text-sm font-medium justify-center">
              <Icon name="Phone" size={15} />
              +7 (914) 272-71-87
            </a>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="hero" className="pt-16 min-h-screen flex items-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#EBF3FF] via-[#F7F9FC] to-[#DBEAFE]" style={{ opacity: 0.85 }} />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-[#1565C0]/10 text-[#1565C0] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Icon name="MapPin" size={14} />
              г. Якутск, ул. Халтурина, 6
            </div>
            <h1 className="font-oswald text-5xl sm:text-6xl font-bold text-[#0D1B2A] leading-tight mb-6">
              IT-ПОДДЕРЖКА<br />
              <span className="text-[#1565C0]">ДЛЯ БИЗНЕСА</span><br />
              И ЧАСТНЫХ ЛИЦ
            </h1>
            <p className="text-[#4B5563] text-lg mb-8 leading-relaxed">
              Ремонт компьютеров, видеонаблюдение, сети, 1С и заправка картриджей.
              Быстро, профессионально, с гарантией.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo("Контакты")}
                className="bg-[#1565C0] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#0D47A1] transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
              >
                Оставить заявку
              </button>
              <button
                onClick={() => scrollTo("Услуги")}
                className="border-2 border-[#1565C0] text-[#1565C0] px-7 py-3.5 rounded-xl font-semibold hover:bg-[#EBF3FF] transition-all"
              >
                Наши услуги
              </button>
            </div>
          </div>

          <div className="hidden md:flex justify-center animate-fade-in">
            <div className="relative">
              <div className="w-80 h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img src={HERO_IMAGE} alt="ProFiX офис" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="CheckCircle" size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Работаем</p>
                  <p className="text-sm font-bold text-gray-800">Пн–Сб, 9:00–19:00</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#1565C0] rounded-2xl shadow-xl p-4 text-white">
                <p className="text-2xl font-oswald font-bold">10+</p>
                <p className="text-xs opacity-80">лет опыта</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 gap-4 text-center">
            {[
              { val: "500+", label: "клиентов" },
              { val: "10+", label: "лет опыта" },
              { val: "100%", label: "гарантия" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-oswald text-2xl font-bold text-[#1565C0]">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-[#1565C0] text-sm font-semibold uppercase tracking-widest mb-3">Что мы делаем</p>
            <h2 className="font-oswald text-4xl font-bold text-[#0D1B2A]">НАШИ УСЛУГИ</h2>
            <div className="w-16 h-1 bg-[#1565C0] mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <div
                key={s.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-[#1565C0] hover:shadow-xl transition-all duration-300 bg-[#F7F9FC] hover:bg-white animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-[#EBF3FF] group-hover:bg-[#1565C0] flex items-center justify-center mb-4 transition-colors">
                  <Icon name={s.icon} size={22} className="text-[#1565C0] group-hover:text-white transition-colors" fallback="Settings" />
                </div>
                <h3 className="font-oswald text-xl font-semibold text-[#0D1B2A] mb-2">{s.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 bg-gradient-to-br from-[#EBF3FF] to-[#F7F9FC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-[#1565C0] text-sm font-semibold uppercase tracking-widest mb-3">О нас</p>
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
                    <Icon name={f.icon} size={18} className="text-[#1565C0] shrink-0" fallback="Check" />
                    <span className="text-sm text-[#374151] font-medium">{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1565C0] rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
              <Icon name="Building2" size={32} className="text-white/60 mb-4" />
              <h3 className="font-oswald text-2xl font-bold mb-6">КОНТАКТЫ</h3>
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <Icon name="MapPin" size={18} className="text-white/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/50 mb-0.5">Адрес</p>
                    <p className="font-medium">г. Якутск, ул. Халтурина, 6</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Phone" size={18} className="text-white/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/50 mb-0.5">Телефон</p>
                    <a href="tel:+79142727187" className="font-medium hover:underline">+7 (914) 272-71-87</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Mail" size={18} className="text-white/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/50 mb-0.5">Email</p>
                    <a href="mailto:727187@it-profix.ru" className="font-medium hover:underline">727187@it-profix.ru</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Icon name="Clock" size={18} className="text-white/60 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/50 mb-0.5">Режим работы</p>
                    <p className="font-medium">Пн–Сб: 9:00 – 19:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTS / FORM */}
      <section id="contacts" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[#1565C0] text-sm font-semibold uppercase tracking-widest mb-3">Свяжитесь с нами</p>
            <h2 className="font-oswald text-4xl font-bold text-[#0D1B2A]">ОСТАВИТЬ ЗАЯВКУ</h2>
            <div className="w-16 h-1 bg-[#1565C0] mx-auto mt-4 rounded-full" />
            <p className="text-[#6B7280] mt-4">Опишите проблему — мы свяжемся с вами в течение часа</p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-green-600" />
              </div>
              <h3 className="font-oswald text-2xl font-bold text-green-800 mb-2">ЗАЯВКА ПРИНЯТА!</h3>
              <p className="text-green-700">Мы свяжемся с вами в ближайшее время.</p>
              <button
                onClick={() => { setSubmitted(false); setFormData({ name: "", phone: "", email: "", problem: "" }); }}
                className="mt-6 bg-[#1565C0] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0D47A1] transition-colors"
              >
                Отправить ещё одну
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-[#F7F9FC] rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Имя *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Телефон *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.ru"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Описание проблемы *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  placeholder="Опишите вашу проблему или задачу..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 transition-all text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#1565C0] text-white py-4 rounded-xl font-semibold hover:bg-[#0D47A1] transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <Icon name="Send" size={18} />
                Отправить заявку
              </button>
              <p className="text-xs text-center text-gray-400">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0D1B2A] text-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1565C0] flex items-center justify-center">
              <Icon name="Zap" size={16} className="text-white" />
            </div>
            <span className="font-oswald text-lg font-bold tracking-wide">ProFiX</span>
          </div>
          <div className="text-center text-gray-400 text-sm">
            <p>г. Якутск, ул. Халтурина, 6</p>
            <p className="mt-1">© 2024 ProFiX. Все права защищены.</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <a href="tel:+79142727187" className="text-white hover:text-blue-300 transition-colors flex items-center gap-1.5">
              <Icon name="Phone" size={14} />
              +7 (914) 272-71-87
            </a>
            <a href="mailto:727187@it-profix.ru" className="text-gray-400 hover:text-blue-300 transition-colors flex items-center gap-1.5">
              <Icon name="Mail" size={14} />
              727187@it-profix.ru
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;