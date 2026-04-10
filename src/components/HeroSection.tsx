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
  ...carouselImages.map((img) => ({ img, title: "", desc: "" })),
  { img: "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/89e28943-f50b-4e97-8ae8-27e3b5dc468d.jpg", title: "Разработка в 1С", desc: "Доработка и разработка конфигураций 1С под задачи вашего учёта." },
  { img: "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/8bf05640-4bf8-462b-8b15-5a1dad499873.jpg", title: "Продажа программ 1С", desc: "Продажа лицензионных программных продуктов 1С для любого бизнеса." },
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
      <section className="bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-center font-oswald text-2xl font-bold text-[#0D1B2A] mb-2">Торговое оборудование</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Ремонт, продажа, обслуживание торгового оборудования. Регистрация онлайн-касс.</p>
          <div className="relative overflow-hidden rounded-2xl" style={{ height: "530px" }}>
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${carouselIdx * 100}%)` }}
            >
              {carouselSlides.map((slide, i) => (
                <div key={i} className="shrink-0 w-full h-full flex items-center justify-center bg-gray-50 relative">
                  <img
                    src={slide.img}
                    alt={slide.title || `Фото ${i + 1}`}
                    style={{ width: "432px", height: "530px" }}
                    className="object-cover rounded-2xl shadow-lg"
                  />
                  {slide.title && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 shadow-lg text-center w-72">
                      <p className="font-oswald font-bold text-[#0D1B2A] text-lg">{slide.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{slide.desc}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {carouselSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onSetCarouselIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === carouselIdx ? "bg-[#3ca615] scale-125" : "bg-gray-300"}`}
                />
              ))}
            </div>
            <button
              onClick={() => onSetCarouselIdx((carouselIdx - 1 + carouselSlides.length) % carouselSlides.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-colors"
            >
              <Icon name="ChevronLeft" size={22} />
            </button>
            <button
              onClick={() => onSetCarouselIdx((carouselIdx + 1) % carouselSlides.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-700 transition-colors"
            >
              <Icon name="ChevronRight" size={22} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export { carouselImages, carouselSlides };
export default HeroSection;