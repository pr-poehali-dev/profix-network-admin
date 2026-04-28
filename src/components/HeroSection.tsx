import Icon from "@/components/ui/icon";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/27e6a446-83e0-42ac-9fb3-936312c8e887.jpg";

const carouselImages = [
  "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/4eb3466b-967c-4846-a9f0-b61e7ee0788a.jpg",
  "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/a6fd7ddd-45c4-4263-9dcb-1e9032247826.jpg",
  "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/3f9e4cac-7b67-465a-82d1-491dfb272cd9.jpg",
  "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/5334d264-7817-42d5-81bd-55e6ebe1c422.jpg",
  "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/2bab8ee4-46e0-4518-9aa3-358619ac6248.jpg",
];

const carouselSlides = [
  { img: "https://cdn.poehali.dev/files/e51a01d7-1ca1-4bf6-bfd8-bd243a339b45.jpg", title: "Продажа программ 1С", desc: "Лицензионные программные продукты 1С для бухгалтерии, торговли и управления." },
  { img: "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/89e28943-f50b-4e97-8ae8-27e3b5dc468d.jpg", title: "Разработка в 1С", desc: "Доработка и разработка конфигураций 1С под задачи вашего учёта." },
  { img: "https://cdn.poehali.dev/files/d61fb839-3cbb-4cb6-af80-b81ed9e2be5e.jpg", title: "Продажа и ремонт торгового оборудования", desc: "Весы, сканеры, принтеры этикеток — продажа, настройка и сервисное обслуживание." },
  { img: "https://cdn.poehali.dev/files/298f8dca-1c0c-43c7-8459-325b59898fe8.png", title: "Консультации по 1С", desc: "Обучение сотрудников и консультации по работе с программами 1С." },
  { img: "https://cdn.poehali.dev/files/4b35d6a2-9280-4470-a235-07c82741ea23.png", title: "Продажа и постановка на учёт онлайн-касс", desc: "Подбор, продажа и регистрация ККТ в ФНС. Работаем со всеми моделями." },
  { img: "https://cdn.poehali.dev/files/9710394c-370f-4cf5-9849-7d72e1c04ce9.png", title: "Фискальные регистраторы", desc: "Готовы к работе с маркировкой. ФФД 1.2, поддержка Честного знака." },
  { img: "https://cdn.poehali.dev/files/0815d3d4-244a-41fc-bfb4-68712e11ec65.jpg", title: "Продажа и настройка ТСД для учёта товара", desc: "Терминалы сбора данных для маркировки и учёта товаров на складе." },
  { img: "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/5399c578-756a-444a-82da-0852f5c8f36e.jpg", title: "Сенсорные моноблоки POScenter", desc: "Автоматизация розничных продаж, продуктовых магазинов и кафе." },
  { img: "https://cdn.poehali.dev/files/205678e3-04aa-4a48-9776-3cd9038727f9.jpg", title: "ПО Data-Mobile для ТСД", desc: "Программное обеспечение для терминалов: маркировка, склад, инвентаризация." },
  { img: "https://cdn.poehali.dev/files/c317a926-8fb7-47b2-b842-cf98ed72656f.jpg", title: "Интеграция с Честным знаком", desc: "Подключение ТСД к системе маркировки. Продажа, настройка и сопровождение." },
  { img: "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/a7576981-9ffe-4132-8897-c9a94227b773.jpg", title: "Администрирование серверов", desc: "Настройка, обслуживание и поддержка серверного оборудования для вашего бизнеса." },
  { img: "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/e22ee190-d9dc-47e1-b594-58e158c75c54.jpg", title: "Монтаж локальных сетей", desc: "Проектирование и прокладка локальных сетей в офисе, складе или магазине." },
  { img: "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/31bbac8e-d82e-40ea-ac8a-efb2d047e846.jpg", title: "Заправка картриджей", desc: "Заправка и восстановление лазерных и струйных картриджей. Быстро и недорого." },
];

interface HeroSectionProps {
  carouselIdx: number;
  onSetCarouselIdx: (idx: number) => void;
  onScrollTo: (section: string) => void;
}

const HeroSection = ({ carouselIdx, onSetCarouselIdx, onScrollTo }: HeroSectionProps) => {
  return (
    <>
      {/* HERO */}
      <section id="hero" className="pt-16 flex flex-col relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/d7a247af-9874-4bc9-8052-5c087495fdb7.png)`, opacity: 1 }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8]" style={{ opacity: 0.50 }} />


        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12 items-center min-h-[calc(100vh-theme(spacing.16))]">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-[#3ca615]/10 text-[#3ca615] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Icon name="MapPin" size={14} />
              г. Якутск, ул. Халтурина, 6
            </div>
            <h1 className="font-oswald text-5xl sm:text-6xl font-bold text-[#0D1B2A] leading-tight mb-6">
              IT-ПОДДЕРЖКА<br />
              <span className="text-[#3ca615]">ДЛЯ БИЗНЕСА</span><br />
              И ЧАСТНЫХ ЛИЦ
            </h1>
            <p className="text-[#4B5563] text-lg mb-8 leading-relaxed">
              Ремонт компьютеров, видеонаблюдение, сети, 1С и заправка картриджей.
              Быстро, профессионально, с гарантией.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onScrollTo("Контакты")}
                className="bg-[#3ca615] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#2d8a10] transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5"
              >
                Оставить заявку
              </button>
              <button
                onClick={() => onScrollTo("Услуги")}
                className="border-2 border-[#3ca615] text-[#3ca615] px-7 py-3.5 rounded-xl font-semibold hover:bg-[#edf7e8] transition-all"
              >
                Наши услуги
              </button>
            </div>
          </div>

          <div className="hidden md:flex justify-center animate-fade-in">
            <div className="relative">
              <div className="w-80 h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/ad49d25f-c346-44dc-a332-4aa4552ce177.jpg" alt="ProFiX специалист" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon name="CheckCircle" size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Работаем</p>
                  <p className="text-sm font-bold text-gray-800">Пн–пт, 10:00–18:00, Сб 11:00-18:00</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#3ca615] rounded-2xl shadow-xl p-4 text-white">
                <p className="text-2xl font-oswald font-bold">15+</p>
                <p className="text-xs opacity-80">лет опыта</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white border-t border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 gap-4 text-center">
            {[
              { val: "1000+", label: "клиентов" },
              { val: "15+", label: "лет опыта" },
              { val: "100%", label: "гарантия" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-oswald text-2xl font-bold text-[#3ca615]">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAROUSEL */}
      <section className="bg-white py-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-center font-oswald text-2xl font-bold text-[#0D1B2A] mb-2">Торговое оборудование</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Ремонт, продажа, обслуживание торгового оборудования. Регистрация онлайн-касс.</p>

          <div className="relative">
            {/* Стрелки */}
            <button
              onClick={() => onSetCarouselIdx((carouselIdx - 1 + carouselSlides.length) % carouselSlides.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-10 h-10 rounded-full bg-white hover:bg-[#edf7e8] shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#3ca615] transition-all"
            >
              <Icon name="ChevronLeft" size={20} />
            </button>
            <button
              onClick={() => onSetCarouselIdx((carouselIdx + 1) % carouselSlides.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-10 h-10 rounded-full bg-white hover:bg-[#edf7e8] shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-[#3ca615] transition-all"
            >
              <Icon name="ChevronRight" size={20} />
            </button>

            {/* Трек — 3 карточки видны одновременно */}
            <div className="overflow-hidden mx-6">
              <div
                className="flex gap-4 transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${carouselIdx * (100 / 3)}%)` }}
              >
                {carouselSlides.map((slide, i) => {
                  const isActive = i === carouselIdx;
                  return (
                    <div
                      key={i}
                      onClick={() => onSetCarouselIdx(i)}
                      className={`shrink-0 cursor-pointer rounded-2xl overflow-hidden transition-all duration-500 ${
                        isActive
                          ? "shadow-2xl scale-100 opacity-100"
                          : "shadow-md scale-95 opacity-70 hover:opacity-90 hover:scale-[0.97]"
                      }`}
                      style={{ width: "calc(33.333% - 11px)" }}
                    >
                      <div className="relative" style={{ height: "260px" }}>
                        <img
                          src={slide.img}
                          alt={slide.title || `Фото ${i + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Градиент снизу */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        {/* Подпись */}
                        {slide.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <p className={`font-oswald font-bold text-white leading-tight transition-all duration-300 ${isActive ? "text-base" : "text-sm"}`}>
                              {slide.title}
                            </p>
                            {isActive && (
                              <p className="text-white/70 text-xs mt-1 leading-snug line-clamp-2">{slide.desc}</p>
                            )}
                          </div>
                        )}
                        {/* Зелёная рамка у активной */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-2xl ring-2 ring-[#3ca615] ring-inset pointer-events-none" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Точки */}
            <div className="flex justify-center gap-1.5 mt-5">
              {carouselSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onSetCarouselIdx(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === carouselIdx
                      ? "w-6 h-2 bg-[#3ca615]"
                      : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export { carouselImages, carouselSlides };
export default HeroSection;