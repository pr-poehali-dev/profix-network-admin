import Icon from "@/components/ui/icon";
import { useSiteContent } from "@/hooks/useSiteContent";

const topics = [
  "Услуги по 1С",
  "Внедрение 1С",
  "Консультации по 1С",
  "Разработка в 1С",
  "Продажа программ 1С",
  "1С:ИТС",
  "Торговое оборудование (ККТ, ТСД)",
  "Ремонт компьютеров",
  "Видеонаблюдение",
  "Монтаж сетей",
  "Заправка картриджей",
  "Другой вопрос",
];

interface FormData {
  name: string;
  phone: string;
  email: string;
  topic: string;
  problem: string;
}

interface ContactFooterProps {
  formData: FormData;
  submitted: boolean;
  loading: boolean;
  error: string;
  onFormChange: (data: FormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

const ContactFooter = ({
  formData,
  submitted,
  loading,
  error,
  onFormChange,
  onSubmit,
  onReset,
}: ContactFooterProps) => {
  const { str } = useSiteContent();
  return (
    <>
      {/* CONTACTS / FORM */}
      <section id="contacts" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[#3ca615] text-sm font-semibold uppercase tracking-widest mb-3">Свяжитесь с нами</p>
            <h2 className="font-oswald text-4xl font-bold text-[#0D1B2A]">ОСТАВИТЬ ЗАЯВКУ</h2>
            <div className="w-16 h-1 bg-[#3ca615] mx-auto mt-4 rounded-full" />
            <p className="text-[#6B7280] mt-4">Опишите проблему — мы свяжемся с вами в течение часа</p>
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="CheckCircle" size={32} className="text-green-600" />
              </div>
              <h3 className="font-oswald text-2xl font-bold text-green-800 mb-2">ЗАЯВКА ПРИНЯТА!</h3>
              <p className="text-green-700">Мы свяжемся с вами в ближайшее время.</p>
              <button
                onClick={onReset}
                className="mt-6 bg-[#3ca615] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2d8a10] transition-colors"
              >
                Отправить ещё одну
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="bg-[#F7F9FC] rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Имя *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
                  placeholder="Ваше имя"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Телефон *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => onFormChange({ ...formData, phone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => onFormChange({ ...formData, email: e.target.value })}
                  placeholder="your@email.ru"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Тема обращения *</label>
                <div className="flex flex-wrap gap-2">
                  {topics.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onFormChange({ ...formData, topic: t })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        formData.topic === t
                          ? "bg-[#3ca615] text-white border-[#3ca615]"
                          : "bg-white text-[#374151] border-gray-200 hover:border-[#3ca615] hover:text-[#3ca615]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Описание проблемы *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.problem}
                  onChange={(e) => onFormChange({ ...formData, problem: e.target.value })}
                  placeholder="Опишите вашу проблему или задачу..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#3ca615] focus:ring-2 focus:ring-[#3ca615]/20 transition-all text-sm resize-none"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <Icon name="AlertCircle" size={16} className="shrink-0" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#3ca615] text-white py-4 rounded-xl font-semibold hover:bg-[#2d8a10] transition-all shadow-lg shadow-green-200 hover:shadow-green-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="animate-spin" />
                    Отправляем...
                  </>
                ) : (
                  <>
                    <Icon name="Send" size={18} />
                    Отправить заявку
                  </>
                )}
              </button>
              <p className="text-xs text-center text-gray-400">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
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
            <p>{str("contacts.address", "г. Якутск, ул. Халтурина, 6")}</p>
            <p className="mt-1">© 2026 ProFiX. Все права защищены.</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <a href={str("contacts.phone_href", "tel:+79142727187")} className="text-gray-900 hover:text-[#3ca615] transition-colors flex items-center gap-1.5">
              <Icon name="Phone" size={14} />
              {str("contacts.phone", "+7 (914) 272-71-87")}
            </a>
            <a href={str("contacts.email", "mailto:727187@it-profix.ru")} className="text-gray-500 hover:text-[#3ca615] transition-colors flex items-center gap-1.5">
              <Icon name="Mail" size={14} />
              {str("contacts.email", "727187@it-profix.ru")}
            </a>
            {str("contacts.vk","") && <a href={str("contacts.vk","")} target="_blank" rel="noopener" className="text-gray-500 hover:text-[#3ca615] transition-colors flex items-center gap-1.5"><Icon name="ExternalLink" size={14}/>ВКонтакте</a>}
            {str("contacts.telegram","") && <a href={str("contacts.telegram","")} target="_blank" rel="noopener" className="text-gray-500 hover:text-[#3ca615] transition-colors flex items-center gap-1.5"><Icon name="Send" size={14}/>Telegram</a>}
          </div>
        </div>
      </footer>
    </>
  );
};

export default ContactFooter;