const partners = [
  { name: "DataMobile", url: "https://datamobile.ru", logo: "https://datamobile.ru/wp-content/uploads/2021/06/logo_dm.svg" },
  { name: "POSCenter", url: "https://poscenter.ru", logo: "https://poscenter.ru/local/templates/main/img/logo.svg" },
  { name: "1С Франчайзи", url: "https://1c.ru", logo: "https://1c.ru/i/logo.png" },
  { name: "Dreamkas", url: "https://dreamkas.ru", logo: "https://dreamkas.ru/static/images/logo.svg" },
  { name: "АТОЛ", url: "https://atol.ru", logo: "https://atol.ru/local/templates/main_new/images/logo.svg" },
  { name: "СБИС", url: "https://saby.ru", logo: "https://saby.ru/cdn/images/logo-saby.svg" },
  { name: "ОФД Яндекс", url: "https://ofd.yandex.ru", logo: "https://yastatic.net/s3/home/services/Taxi/logo/logo__wordmark_ru.svg" },
  { name: "Платформа ОФД", url: "https://platformaofd.ru", logo: "https://platformaofd.ru/images/logo.svg" },
];

const PartnersSection = () => {
  return (
    <section className="bg-white border-b border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-gray-400 mb-8">
          Партнёры и поставщики
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 items-center">
          {partners.map((p) => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <div className="h-12 flex items-center justify-center grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-300">
                <img
                  src={p.logo}
                  alt={p.name}
                  className="max-h-10 max-w-[90px] object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const sibling = target.nextElementSibling as HTMLElement;
                    if (sibling) sibling.style.display = "flex";
                  }}
                />
                <span
                  className="hidden items-center justify-center text-xs font-semibold text-gray-600 text-center leading-tight"
                  style={{ display: "none" }}
                >
                  {p.name}
                </span>
              </div>
              <span className="text-[11px] text-gray-400 group-hover:text-[#3ca615] transition-colors text-center leading-tight">
                {p.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
