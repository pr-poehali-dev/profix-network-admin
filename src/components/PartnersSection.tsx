import { useNavigate } from "react-router-dom";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const partners = [
  { name: "DataMobile", url: "/datamobile", logo: `${CDN}/datamobile_1.svg`, tag: "ПО для склада" },
  { name: "POSCenter", url: "/poscenter", logo: `${CDN}/poscenter.png`, tag: "POS-оборудование" },
  { name: "1С Франчайзи", url: "/1c", logo: `${CDN}/1c.svg`, tag: "Учёт и автоматизация" },
  { name: "Дримкас", url: "/dreamkas", logo: `${CDN}/dreamkas.svg`, tag: "Онлайн-кассы" },
  { name: "АТОЛ", url: "/atol", logo: `${CDN}/atol.png`, tag: "Кассовое оборудование" },
  { name: "СБИС", url: "/sbis", logo: `${CDN}/saby.png`, tag: "ЭДО и отчётность" },
  { name: "ОФД Яндекс", url: "/ofd-yandex", logo: `${CDN}/ofdyandex.svg`, tag: "Оператор ФД" },
  { name: "Платформа ОФД", url: "/platforma-ofd", logo: `${CDN}/platformaofd.png`, tag: "Оператор ФД" },
];

const PartnersSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white border-b border-gray-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Заголовок */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-100" />
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 whitespace-nowrap">
            Официальные партнёры и поставщики
          </p>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {partners.map((p) => (
            <button
              key={p.name}
              onClick={() => navigate(p.url)}
              className="group relative flex flex-col items-center gap-2.5 py-4 px-2 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:border-[#3ca615]/40 hover:shadow-lg hover:shadow-green-100 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Зелёный блик при наведении */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#3ca615]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

              {/* Логотип */}
              <div className="relative h-10 w-full flex items-center justify-center">
                <img
                  src={p.logo}
                  alt={p.name}
                  className="max-h-9 max-w-[75px] object-contain grayscale group-hover:grayscale-0 opacity-50 group-hover:opacity-100 transition-all duration-300"
                />
              </div>

              {/* Имя */}
              <span className="relative text-[10px] font-semibold text-gray-400 group-hover:text-[#3ca615] transition-colors text-center leading-tight line-clamp-1 w-full">
                {p.name}
              </span>

              {/* Тег — появляется при наведении */}
              <span className="relative text-[9px] text-gray-300 group-hover:text-[#3ca615]/70 transition-colors text-center leading-tight line-clamp-1 w-full">
                {p.tag}
              </span>

              {/* Стрелка-индикатор */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-4 h-4 rounded-full bg-[#3ca615]/10 flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 6.5L6.5 1.5M6.5 1.5H2.5M6.5 1.5V5.5" stroke="#3ca615" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
