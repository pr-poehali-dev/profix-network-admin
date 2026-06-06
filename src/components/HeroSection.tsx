import { useEffect, useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useSiteContent } from "@/hooks/useSiteContent";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/27e6a446-83e0-42ac-9fb3-936312c8e887.jpg";

const DEFAULT_SLIDES = [
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
  onQuickOrder?: (serviceName: string, img?: string, desc?: string) => void;
}

const HeroSection = ({ carouselIdx, onSetCarouselIdx, onScrollTo, onQuickOrder }: HeroSectionProps) => {
  const { str, json } = useSiteContent();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const slides = json<{img:string;title:string;desc:string}[]>("carousel.slides", DEFAULT_SLIDES);
  const stats = json<{val:string;label:string}[]>("hero.stats", [{val:"1000+",label:"клиентов"},{val:"15+",label:"лет опыта"},{val:"100%",label:"гарантия"}]);
  const titleLines = str("hero.title", "IT-ПОДДЕРЖКА\nДЛЯ БИЗНЕСА\nИ ЧАСТНЫХ ЛИЦ").split("\n");
  const carouselSpeed = parseInt(str("carousel.speed", "150"), 10);
  const trackRef = useRef<HTMLDivElement>(null);
  const carouselWrapRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontal = useRef<boolean | null>(null);

  // Подключаем passive:false чтобы мочь вызвать preventDefault на touchmove
  useEffect(() => {
    const el = carouselWrapRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (isHorizontal.current === true) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, []);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
    if (trackRef.current) trackRef.current.style.animationPlayState = "paused";
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (isHorizontal.current === null) {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      isHorizontal.current = dx > dy;
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontal.current = null;
    setTimeout(() => {
      if (trackRef.current) trackRef.current.style.animationPlayState = "running";
    }, 600);
  }

  // Синхронизируем внешний индекс (не используется в marquee, но пропс обязателен)
  useEffect(() => { onSetCarouselIdx(0); }, []);

  const heroSize = str("hero.size", "medium");
  const sizeClasses: Record<string, string> = {
    compact: "py-8 sm:py-10",
    medium:  "py-12 sm:py-16",
    large:   "py-20 sm:py-28",
    fullscreen: "min-h-[calc(100vh-4rem)] py-16",
  };
  const paddingClass = sizeClasses[heroSize] ?? sizeClasses.medium;

  const imgSize: Record<string, string> = {
    compact: "w-52 h-52",
    medium:  "w-64 h-64",
    large:   "w-80 h-80",
    fullscreen: "w-80 h-80",
  };
  const imgClass = imgSize[heroSize] ?? imgSize.medium;

  const titleSize: Record<string, string> = {
    compact:    "text-3xl sm:text-4xl",
    medium:     "text-4xl sm:text-5xl",
    large:      "text-5xl sm:text-6xl",
    fullscreen: "text-5xl sm:text-6xl",
  };
  const titleClass = titleSize[heroSize] ?? titleSize.medium;
  const heroBgImg   = str("hero.bg_image", "");
  const heroBgColor = str("hero.bg_color", "");

  return (
    <>
      {/* HERO */}
      <section id="hero" className="pt-16 flex flex-col relative overflow-hidden">
        {heroBgImg ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBgImg})` }} />
        ) : (
          <>
            <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/d7a247af-9874-4bc9-8052-5c087495fdb7.png)`, opacity: 1 }} />
          </>
        )}
        {heroBgColor
          ? <div className="absolute inset-0" style={{ backgroundColor: heroBgColor, opacity: 0.85 }} />
          : <div className="absolute inset-0 bg-gradient-to-br from-[#edf7e8] via-[#F7F9FC] to-[#d4f0c8]" style={{ opacity: 0.50 }} />
        }

        <div className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${paddingClass} grid md:grid-cols-2 gap-8 items-center`}>
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-[#3ca615]/10 text-[#3ca615] px-3 py-1.5 rounded-full text-sm font-medium mb-4">
              <Icon name="MapPin" size={13} />
              {str("hero.address", "г. Якутск, ул. Халтурина, 6")}
            </div>
            <h1 className={`font-oswald ${titleClass} font-bold text-[#0D1B2A] leading-tight mb-4`}>
              {titleLines.map((line, i) => (
                <span key={i}>
                  {i === 1 ? <span className="text-[#3ca615]">{line}</span> : line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
            {heroSize !== "compact" && (
              <p className="text-[#4B5563] text-base sm:text-lg mb-6 leading-relaxed">
                {str("hero.subtitle", "Ремонт компьютеров, видеонаблюдение, сети, 1С и заправка картриджей. Быстро, профессионально, с гарантией.")}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onScrollTo("Контакты")}
                className="bg-[#3ca615] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2d8a10] transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Оставить заявку
              </button>
              <button
                onClick={() => onScrollTo("Услуги")}
                className="border-2 border-[#3ca615] text-[#3ca615] px-6 py-3 rounded-xl font-semibold hover:bg-[#edf7e8] transition-all text-sm sm:text-base"
              >
                Наши услуги
              </button>
            </div>
          </div>

          <div className="hidden md:flex justify-center animate-fade-in">
            <div className="relative">
              <div className={`${imgClass} rounded-3xl overflow-hidden shadow-2xl border-4 border-white`}>
                <img src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/ad49d25f-c346-44dc-a332-4aa4552ce177.jpg" alt="ПРОФИКС специалист" className="w-full h-full object-cover" />
              </div>
              {heroSize !== "compact" && (
                <>
                  <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                      <Icon name="CheckCircle" size={18} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Работаем</p>
                      <p className="text-sm font-bold text-gray-800">{str("hero.hours", "Пн–пт, 10:00–18:00, Сб 11:00-18:00")}</p>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-[#3ca615] rounded-2xl shadow-xl p-3 text-white">
                    <p className="text-xl font-oswald font-bold">{str("hero.experience", "15+")}</p>
                    <p className="text-xs opacity-80">лет опыта</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 bg-white border-t border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 grid grid-cols-3 gap-4 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-oswald text-xl sm:text-2xl font-bold text-[#3ca615]">{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAROUSEL — бегущая строка */}
      <section className="bg-white py-10 overflow-hidden">
        <div className="px-4 sm:px-6 mb-6">
          <h2 className="text-center font-oswald text-2xl font-bold text-[#0D1B2A] mb-2">{str("carousel.title", "Торговое оборудование")}</h2>
          <p className="text-center text-gray-500 text-sm">{str("carousel.subtitle", "Ремонт, продажа, обслуживание торгового оборудования. Регистрация онлайн-касс.")}</p>
        </div>

        <style>{`
          @keyframes marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee ${carouselSpeed}s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="overflow-hidden"
          ref={carouselWrapRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}>
          <div ref={trackRef} className="marquee-track gap-4" style={{ gap: "16px" }}>
            {[...slides, ...slides].map((slide, i) => (
              <div
                key={i}
                onClick={() => { if (onQuickOrder) onQuickOrder(slide.title || "", slide.img, slide.desc); else onScrollTo("Контакты"); }}
                className="shrink-0 cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
                style={{ width: isMobile ? "240px" : "320px", marginRight: "16px" }}
              >
                <div className="relative overflow-hidden" style={{ height: isMobile ? "180px" : "240px" }}>
                  <img
                    src={slide.img}
                    alt={slide.title || `Фото ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {slide.title && (
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-oswald font-bold text-white text-sm leading-tight">{slide.title}</p>
                      <div className="mt-1.5 flex items-center gap-1 bg-[#3ca615] text-white text-[10px] font-bold px-2.5 py-1 w-fit">
                        <Icon name="Zap" size={10} />
                        Заказать в 1 клик
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;