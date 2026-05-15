import Icon from "@/components/ui/icon";
import { ContentMap, parseJson, Field, ImageUpload } from "./editor-shared";

// ── Секция: Реквизиты компании ────────────────────────────────────────────────

export function RequisitesEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const r = (key: string, def = "") => content[`requisites.${key}`] ?? def;
  const set = (key: string) => (v: string) => onChange(`requisites.${key}`, v);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Основные данные</p>
        <div className="space-y-3">
          <Field label="Полное наименование" value={r("company_full", "ООО «ПРОФИКС»")} onChange={set("company_full")} />
          <Field label="Краткое наименование" value={r("company_short", "ООО «ПРОФИКС»")} onChange={set("company_short")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="ИНН" value={r("inn", "1435253577")} onChange={set("inn")} />
            <Field label="КПП" value={r("kpp", "")} onChange={set("kpp")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ОГРН" value={r("ogrn", "1121435005790")} onChange={set("ogrn")} />
            <Field label="ОКПО" value={r("okpo", "")} onChange={set("okpo")} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Адреса</p>
        <div className="space-y-3">
          <Field label="Юридический адрес" value={r("legal_address", "677009, г. Якутск, ул. Халтурина, дом 6")} onChange={set("legal_address")} textarea />
          <Field label="Фактический адрес" value={r("actual_address", "")} onChange={set("actual_address")} textarea />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Банковские реквизиты</p>
        <div className="space-y-3">
          <Field label="Банк" value={r("bank_name", "")} onChange={set("bank_name")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="БИК" value={r("bik", "")} onChange={set("bik")} />
            <Field label="К/с (корр. счёт)" value={r("corr_account", "")} onChange={set("corr_account")} />
          </div>
          <Field label="Расчётный счёт" value={r("account", "")} onChange={set("account")} />
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Контакты</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Телефон" value={r("phone", "+7 (914) 272-71-87")} onChange={set("phone")} />
            <Field label="Email" value={r("email", "727187@it-profix.ru")} onChange={set("email")} />
          </div>
          <Field label="Сайт" value={r("website", "pfx.su")} onChange={set("website")} />
          <Field label="Руководитель (должность и ФИО)" value={r("director", "")} onChange={set("director")} hint="Например: Генеральный директор Иванов И.И." />
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2">
        <Icon name="Info" size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-600">
          Реквизиты отображаются на странице <a href="/requisites" target="_blank" className="underline">/requisites</a> и добавляются в уведомления о заказах.
        </p>
      </div>
    </div>
  );
}

// ── Секция: Главный экран ─────────────────────────────────────────────────────

export function HeroEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  const stats = parseJson<{val:string;label:string}[]>(content["hero.stats"] || "", [
    {val:"1000+",label:"клиентов"},{val:"15+",label:"лет опыта"},{val:"100%",label:"гарантия"}
  ]);

  function setStats(items: {val:string;label:string}[]) {
    onChange("hero.stats", JSON.stringify(items));
  }

  return (
    <div className="space-y-4">
      <Field label="Заголовок H1" value={content["hero.title"] || ""} onChange={v => onChange("hero.title", v)} textarea hint="Используй перенос строки для разбивки" />
      <Field label="Подзаголовок" value={content["hero.subtitle"] || ""} onChange={v => onChange("hero.subtitle", v)} textarea />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Адрес" value={content["hero.address"] || ""} onChange={v => onChange("hero.address", v)} />
        <Field label="Часы работы" value={content["hero.hours"] || ""} onChange={v => onChange("hero.hours", v)} />
      </div>
      <Field label="Лет опыта (бейдж)" value={content["hero.experience"] || "15+"} onChange={v => onChange("hero.experience", v)} />

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-2">Статистика (3 блока)</label>
        <div className="space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={s.val} onChange={e => { const n=[...stats]; n[i]={...n[i],val:e.target.value}; setStats(n); }}
                placeholder="1000+" className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
              <input value={s.label} onChange={e => { const n=[...stats]; n[i]={...n[i],label:e.target.value}; setStats(n); }}
                placeholder="клиентов" className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Секция: О компании ────────────────────────────────────────────────────────

export function AboutEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Заголовок" value={content["about.title"] || ""} onChange={v => onChange("about.title", v)} />
      <Field label="Абзац 1" value={content["about.text1"] || ""} onChange={v => onChange("about.text1", v)} textarea />
      <Field label="Абзац 2" value={content["about.text2"] || ""} onChange={v => onChange("about.text2", v)} textarea />
    </div>
  );
}

// ── Секция: Контакты ──────────────────────────────────────────────────────────

export function ContactsEditor({ content, onChange }: { content: ContentMap; onChange: (key: string, val: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Основные контакты */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Основные контакты</p>
        <p className="text-[10px] text-gray-400">Применяются в шапке, футере, на всех страницах сайта</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Телефон (отображаемый)" value={content["contacts.phone"] || ""} onChange={v => onChange("contacts.phone", v)} />
          <Field label="Телефон (href)" value={content["contacts.phone_href"] || ""} onChange={v => onChange("contacts.phone_href", v)} hint="Например: tel:+79142727187" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email" value={content["contacts.email"] || ""} onChange={v => onChange("contacts.email", v)} />
          <Field label="Часы работы" value={content["contacts.hours"] || ""} onChange={v => onChange("contacts.hours", v)} />
        </div>
        <Field label="Адрес" value={content["contacts.address"] || ""} onChange={v => onChange("contacts.address", v)} />
      </div>

      {/* Соцсети */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Социальные сети</p>
        <p className="text-[10px] text-gray-400">Оставь пустым — ссылка не будет отображаться</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ВКонтакте (URL)" value={content["contacts.vk"] || ""} onChange={v => onChange("contacts.vk", v)} hint="https://vk.com/..." />
          <Field label="Telegram (URL или @username)" value={content["contacts.telegram"] || ""} onChange={v => onChange("contacts.telegram", v)} hint="https://t.me/..." />
          <Field label="WhatsApp (URL)" value={content["contacts.whatsapp"] || ""} onChange={v => onChange("contacts.whatsapp", v)} hint="https://wa.me/79142727187" />
          <Field label="Instagram (URL)" value={content["contacts.instagram"] || ""} onChange={v => onChange("contacts.instagram", v)} hint="https://instagram.com/..." />
        </div>
      </div>

      {/* Карта */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Карта</p>
        <Field label="URL Яндекс.Карты (iframe)" value={content["contacts.map_url"] || ""} onChange={v => onChange("contacts.map_url", v)}
          hint="Вставь ссылку из конструктора карт Яндекса (Поделиться → Код для вставки → src=...)" />
      </div>

      {/* Футер */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Футер сайта</p>
        <Field label="Текст копирайта" value={content["footer.copyright"] || ""} onChange={v => onChange("footer.copyright", v)}
          hint={`По умолчанию: © ${new Date().getFullYear()} ProFiX. Все права защищены.`} />
        <ImageUpload label="Логотип в футере" value={content["footer.logo"] || ""} onChange={v => onChange("footer.logo", v)} />
      </div>
    </div>
  );
}
