const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const partners = [
  { name: "DataMobile", url: "https://data-mobile.ru", logo: `${CDN}/datamobile_1.svg` },
  { name: "POSCenter", url: "https://poscenter.ru", logo: null },
  { name: "1С Франчайзи", url: "https://1c.ru", logo: `${CDN}/1c.svg` },
  { name: "Dreamkas", url: "https://dreamkas.ru", logo: `${CDN}/dreamkas.svg` },
  { name: "АТОЛ", url: "https://atol.ru", logo: `${CDN}/atol.svg` },
  { name: "СБИС", url: "https://saby.ru", logo: null },
  { name: "ОФД Яндекс", url: "https://ofd.yandex.ru", logo: null },
  { name: "Платформа ОФД", url: "https://platformaofd.ru", logo: `${CDN}/platformaofd.png` },
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
                {p.logo ? (
                  <img
                    src={p.logo}
                    alt={p.name}
                    className="max-h-10 max-w-[90px] object-contain"
                  />
                ) : (
                  <div className="h-10 px-3 flex items-center justify-center rounded border border-gray-200 bg-gray-50 group-hover:border-[#3ca615] transition-colors">
                    <span className="text-xs font-bold text-gray-500 group-hover:text-[#3ca615] text-center leading-tight">
                      {p.name}
                    </span>
                  </div>
                )}
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