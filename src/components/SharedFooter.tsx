import Icon from "@/components/ui/icon";
import { useSiteContent } from "@/hooks/useSiteContent";

const SharedFooter = () => {
  const { str } = useSiteContent();
  const phone     = str("contacts.phone",     "+7 (914) 272-71-87");
  const phoneHref = str("contacts.phone_href","tel:+79142727187");
  const email     = str("contacts.email",     "727187@it-profix.ru");
  const address   = str("contacts.address",   "г. Якутск, ул. Халтурина, 6");
  const copyright = str("footer.copyright",   `© ${new Date().getFullYear()} ProFiX. Все права защищены.`);
  const vk        = str("contacts.vk",        "");
  const tg        = str("contacts.telegram",  "");
  const wa        = str("contacts.whatsapp",  "");

  return (
    <footer className="bg-gray-100 text-gray-900 py-10 border-t border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
            <p>{address}</p>
            <p className="mt-1">{copyright}</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1.5 text-sm">
            <a href={phoneHref} className="text-gray-900 hover:text-[#3ca615] transition-colors flex items-center gap-1.5">
              <Icon name="Phone" size={14} /> {phone}
            </a>
            <a href={`mailto:${email}`} className="text-gray-500 hover:text-[#3ca615] transition-colors flex items-center gap-1.5">
              <Icon name="Mail" size={14} /> {email}
            </a>
            {(vk || tg || wa) && (
              <div className="flex items-center gap-2 mt-1">
                {vk && <a href={vk} target="_blank" rel="noopener noreferrer" title="ВКонтакте"
                  className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-[#3ca615] hover:text-white flex items-center justify-center text-gray-500 transition-colors">
                  <Icon name="Users" size={13} />
                </a>}
                {tg && <a href={tg} target="_blank" rel="noopener noreferrer" title="Telegram"
                  className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-[#3ca615] hover:text-white flex items-center justify-center text-gray-500 transition-colors">
                  <Icon name="Send" size={13} />
                </a>}
                {wa && <a href={wa} target="_blank" rel="noopener noreferrer" title="WhatsApp"
                  className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-[#3ca615] hover:text-white flex items-center justify-center text-gray-500 transition-colors">
                  <Icon name="MessageCircle" size={13} />
                </a>}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SharedFooter;