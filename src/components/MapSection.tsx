export default function MapSection() {
  return (
    <section className="bg-white py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-oswald text-2xl font-bold text-[#0D1B2A] mb-1">Как нас найти</h2>
            <p className="text-gray-500 text-sm">г. Якутск, ул. Халтурина, д. 6</p>
          </div>
          <a
            href="https://yandex.ru/maps/?pt=129.736301,62.047174&z=17&l=map"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#3ca615] text-[#3ca615] text-sm font-medium hover:bg-[#edf7e8] transition"
          >
            Открыть в Яндекс Картах
          </a>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100" style={{ height: "400px" }}>
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=129.736301%2C62.047174&z=17&pt=129.736301%2C62.047174%2Cpm2rdm&l=map"
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen
            title="Офис ProFiX на карте"
            style={{ display: "block" }}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 bg-[#F7F9FC] rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-[#edf7e8] flex items-center justify-center shrink-0">
              <span className="text-lg">📍</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">Адрес</p>
              <p className="text-xs text-gray-500">г. Якутск, ул. Халтурина, д. 6</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#F7F9FC] rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-[#edf7e8] flex items-center justify-center shrink-0">
              <span className="text-lg">🕐</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">Режим работы</p>
              <p className="text-xs text-gray-500">Пн–Пт: 9:00 – 18:00</p>
              <p className="text-xs text-gray-500">Сб–Вс: по записи</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-[#F7F9FC] rounded-2xl p-4">
            <div className="w-9 h-9 rounded-xl bg-[#edf7e8] flex items-center justify-center shrink-0">
              <span className="text-lg">📞</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">Телефон</p>
              <a href="tel:+79142727187" className="text-xs text-[#3ca615] font-medium">+7 (914) 272-71-87</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}