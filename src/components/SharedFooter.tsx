import Icon from "@/components/ui/icon";

const SharedFooter = () => (
  <footer className="bg-gray-100 text-gray-900 py-10 border-t border-gray-200">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-2">
        <img
          src="https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/0d49a1e8-95c3-4e50-aa1e-2cd26763371f.png"
          alt="ProFiX логотип"
          className="h-8 w-8 object-contain"
        />
        <span className="font-oswald text-lg font-bold tracking-wide">
          <span className="text-[#3ca615]">ПРО</span><span className="text-black">ФИКС</span>
        </span>
      </div>
      <div className="text-center text-gray-500 text-sm">
        <p>г. Якутск, ул. Халтурина, 6</p>
        <p className="mt-1">© 2026 ProFiX. Все права защищены.</p>
      </div>
      <div className="flex flex-col items-end gap-1 text-sm">
        <a href="tel:+79142727187" className="text-gray-900 hover:text-[#3ca615] transition-colors flex items-center gap-1.5">
          <Icon name="Phone" size={14} />
          +7 (914) 272-71-87
        </a>
        <a href="mailto:727187@it-profix.ru" className="text-gray-500 hover:text-[#3ca615] transition-colors flex items-center gap-1.5">
          <Icon name="Mail" size={14} />
          727187@it-profix.ru
        </a>
      </div>
    </div>
  </footer>
);

export default SharedFooter;
