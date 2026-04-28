import { useNavigate } from "react-router-dom";

const CDN = "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners";

const partners = [
  { name: "DataMobile", url: "/datamobile", logo: `${CDN}/datamobile_1.svg` },
  { name: "POSCenter", url: "/poscenter", logo: `${CDN}/poscenter.png` },
  { name: "1С Франчайзи", url: "/1c", logo: `${CDN}/1c.svg` },
  { name: "Dreamkas", url: "/dreamkas", logo: `${CDN}/dreamkas.svg` },
  { name: "АТОЛ", url: "/atol", logo: `${CDN}/atol.png` },
  { name: "СБИС", url: "/sbis", logo: `${CDN}/saby.png` },
  { name: "ОФД Яндекс", url: "/ofd-yandex", logo: `${CDN}/ofdyandex.svg` },
  { name: "Платформа ОФД", url: "/platforma-ofd", logo: `${CDN}/platformaofd.png` },
];

const PartnersSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-white border-b border-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-gray-400 mb-8">
          Партнёры и поставщики
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {partners.map((p) => (
            <button
              key={p.name}
              onClick={() => navigate(p.url)}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-[#3ca615] hover:bg-[#edf7e8] hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="h-10 flex items-center justify-center">
                <img
                  src={p.logo}
                  alt={p.name}
                  className="max-h-9 max-w-[80px] object-contain grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-300"
                />
              </div>
              <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#3ca615] transition-colors text-center leading-tight">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
