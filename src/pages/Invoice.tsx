import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Icon from "@/components/ui/icon";
import { shopApi } from "@/lib/shop-api";

type PaymentStatus = "pending" | "proof_uploaded" | "paid" | "rejected" | "not_required";

interface InvoiceData {
  ticket_id: number;
  invoice_number: string;
  title: string;
  amount: number;
  payment_method: string;
  payment_status: PaymentStatus;
  created_at: string;
  client: { name: string; phone: string; email?: string };
  items: string[];
  requisites: Record<string, string>;
}

const STATUS_LABELS: Record<PaymentStatus, { label: string; color: string; icon: string }> = {
  pending:        { label: "Ожидает оплаты",  color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "Clock" },
  proof_uploaded: { label: "Чек загружен",     color: "bg-blue-50 text-blue-700 border-blue-200",      icon: "Upload" },
  paid:           { label: "Оплачен",          color: "bg-green-50 text-green-700 border-green-200",    icon: "CheckCircle" },
  rejected:       { label: "Отклонён",         color: "bg-red-50 text-red-700 border-red-200",          icon: "XCircle" },
  not_required:   { label: "Без оплаты",       color: "bg-gray-50 text-gray-600 border-gray-200",       icon: "Minus" },
};

// СБП QR строка по стандарту ЦБ РФ
function buildSbpQr(data: InvoiceData): string {
  const r = data.requisites;
  const bic  = r.bik || "";
  const acc  = r.account || "";
  const name = r.company_short || r.company_full || "ООО ПРОФИКС";
  const sum  = (data.amount * 100).toFixed(0); // в копейках
  const purpose = `Оплата счёта ${data.invoice_number}`;
  if (!bic || !acc) {
    // Fallback — текстовый QR
    return [
      `Получатель: ${name}`,
      r.inn ? `ИНН: ${r.inn}` : "",
      bic ? `БИК: ${bic}` : "",
      acc ? `Счёт: ${acc}` : "",
      `Сумма: ${data.amount.toLocaleString("ru-RU")} ₽`,
      `Назначение: ${purpose}`,
    ].filter(Boolean).join("\n");
  }
  // Стандарт ЦБ РФ для СБП/QR
  return `ST00012|Name=${name}|PersonalAcc=${acc}|BankName=${r.bank_name||""}|BIC=${bic}|CorrespAcc=${r.corr_account||""}|Sum=${sum}|Purpose=${purpose}`;
}

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proofUploading, setProofUploading] = useState(false);
  const [proofDone, setProofDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    shopApi.getInvoice(id)
      .then(res => {
        if (res.invoice_number) setData(res as InvoiceData);
        else setError("Счёт не найден");
      })
      .catch(() => setError("Ошибка загрузки счёта"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    setProofUploading(true);
    const reader = new FileReader();
    reader.onload = async ev => {
      const b64 = (ev.target?.result as string).split(",")[1];
      try {
        const res = await shopApi.uploadPaymentProof(data.invoice_number, b64, file.type);
        if (res.ok) {
          setProofDone(true);
          setData(d => d ? { ...d, payment_status: "proof_uploaded" } : d);
        }
      } catch { /* ignore */ }
      finally { setProofUploading(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handlePrint() { window.print(); }

  if (loading) return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center font-golos">
      <div className="text-center text-gray-400">
        <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-3" />
        <p>Загрузка счёта...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center font-golos">
      <div className="text-center">
        <Icon name="FileX" size={48} className="mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-4">{error || "Счёт не найден"}</p>
        <button onClick={() => navigate("/")} className="text-[#3ca615] hover:underline text-sm">← На главную</button>
      </div>
    </div>
  );

  const r = data.requisites;
  const status = STATUS_LABELS[data.payment_status] || STATUS_LABELS.pending;
  const qrValue = buildSbpQr(data);
  const isSbp = data.payment_method === "qr";
  const isInvoice = data.payment_method === "invoice";
  const needsPayment = data.payment_status === "pending" || data.payment_status === "proof_uploaded";
  const date = new Date(data.created_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <>
      {/* Панель действий — скрывается при печати */}
      <div className="print:hidden bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <Icon name="ChevronLeft" size={20} />
            </button>
            <span className="font-oswald text-lg font-bold">
              <span className="text-[#3ca615]">ПРО</span><span className="text-gray-900">ФИКС</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${status.color}`}>
              <Icon name={status.icon as "Clock"} size={13} />
              {status.label}
            </div>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-[#3ca615] hover:text-[#3ca615] transition-colors">
              <Icon name="Printer" size={15} />
              <span className="hidden sm:inline">Распечатать PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-screen bg-[#F7F9FC] font-golos print:bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 print:py-4 print:px-6">

          {/* ── Счёт ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm print:shadow-none print:border-0 overflow-hidden">

            {/* Шапка счёта */}
            <div className="flex items-start justify-between p-6 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Счёт на оплату</p>
                <h1 className="font-oswald text-2xl font-bold text-gray-900">{data.invoice_number}</h1>
                <p className="text-sm text-gray-500 mt-1">от {date}</p>
              </div>
              <div className="text-right">
                <p className="font-oswald text-3xl font-bold text-[#3ca615]">
                  {data.amount.toLocaleString("ru-RU")} ₽
                </p>
                <p className="text-xs text-gray-400 mt-1">сумма к оплате</p>
              </div>
            </div>

            {/* Поставщик и покупатель */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              <div className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Поставщик</p>
                <p className="font-semibold text-gray-900 text-sm mb-1">{r.company_full || r.company_short || "ООО «ПРОФИКС»"}</p>
                {r.inn   && <p className="text-xs text-gray-500">ИНН: {r.inn}</p>}
                {r.ogrn  && <p className="text-xs text-gray-500">ОГРН: {r.ogrn}</p>}
                {r.kpp   && <p className="text-xs text-gray-500">КПП: {r.kpp}</p>}
                {r.legal_address && <p className="text-xs text-gray-500 mt-1">{r.legal_address}</p>}
                {r.phone && <p className="text-xs text-gray-500 mt-1">{r.phone}</p>}
                {r.email && <p className="text-xs text-gray-500">{r.email}</p>}
              </div>
              <div className="p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Покупатель</p>
                <p className="font-semibold text-gray-900 text-sm mb-1">{data.client.name}</p>
                <p className="text-xs text-gray-500">{data.client.phone}</p>
                {data.client.email && <p className="text-xs text-gray-500">{data.client.email}</p>}
              </div>
            </div>

            {/* Банковские реквизиты */}
            {(r.bank_name || r.account || r.bik) && (
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Банковские реквизиты</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {r.bank_name && <div><span className="text-gray-400">Банк:</span> <span className="text-gray-700 font-medium">{r.bank_name}</span></div>}
                  {r.bik       && <div><span className="text-gray-400">БИК:</span> <span className="text-gray-700 font-medium">{r.bik}</span></div>}
                  {r.corr_account && <div><span className="text-gray-400">К/с:</span> <span className="text-gray-700 font-medium">{r.corr_account}</span></div>}
                  {r.account   && <div className="sm:col-span-3"><span className="text-gray-400">Р/с:</span> <span className="text-gray-700 font-medium font-mono">{r.account}</span></div>}
                </div>
              </div>
            )}

            {/* Товары */}
            <div className="p-5 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Состав заказа</p>
              <div className="space-y-1">
                {data.items.length > 0 ? data.items.map((line, i) => {
                  const parts = line.match(/^(.+?) x(\d+) = (.+)$/);
                  return (
                    <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                      {parts ? (
                        <>
                          <span className="text-gray-700 flex-1">{parts[1]} <span className="text-gray-400">×{parts[2]}</span></span>
                          <span className="font-semibold text-gray-900 ml-4">{parts[3]}</span>
                        </>
                      ) : (
                        <span className="text-gray-700">{line}</span>
                      )}
                    </div>
                  );
                }) : (
                  <p className="text-sm text-gray-400">{data.title}</p>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-gray-200">
                <span className="font-bold text-gray-900">Итого к оплате:</span>
                <span className="font-oswald text-xl font-bold text-[#3ca615]">{data.amount.toLocaleString("ru-RU")} ₽</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">НДС не облагается</p>
            </div>

            {/* Назначение платежа */}
            <div className="px-5 pb-4 text-xs text-gray-500">
              Назначение платежа: <span className="font-medium text-gray-700">Оплата счёта {data.invoice_number}</span>
            </div>
          </div>

          {/* ── QR и загрузка чека (только на экране) ── */}
          {(isSbp || isInvoice) && needsPayment && (
            <div className="print:hidden mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* QR-код */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-xl bg-[#edf7e8] flex items-center justify-center mb-3">
                  <Icon name="QrCode" size={20} className="text-[#3ca615]" />
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">
                  {isSbp ? "QR для оплаты через СБП" : "QR с реквизитами"}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {isSbp ? "Сканируйте в мобильном банке" : "Отсканируйте для получения реквизитов"}
                </p>
                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                  <QRCodeSVG value={qrValue} size={160} />
                </div>
                {isSbp && r.bik && (
                  <p className="text-xs text-gray-400 mt-3">Работает в Сбербанке, Тинькофф, ВТБ и других банках</p>
                )}
                {isSbp && !r.bik && (
                  <p className="text-xs text-orange-500 mt-3">Банковские реквизиты не заполнены в системе</p>
                )}
              </div>

              {/* Загрузка чека */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Icon name="Upload" size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Подтвердить оплату</p>
                    <p className="text-xs text-gray-400">Загрузите скриншот чека</p>
                  </div>
                </div>

                {proofDone || data.payment_status === "proof_uploaded" ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <Icon name="CheckCircle" size={16} className="text-green-600 shrink-0" />
                    <p className="text-sm text-green-700">Чек загружен! Менеджер проверит оплату.</p>
                  </div>
                ) : data.payment_status === "paid" ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <Icon name="CheckCircle" size={16} className="text-green-600 shrink-0" />
                    <p className="text-sm text-green-700 font-semibold">Оплата подтверждена!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-3">
                      После оплаты загрузите фото или скриншот чека — менеджер подтвердит получение.
                    </p>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={proofUploading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 text-sm font-medium hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-60">
                      {proofUploading
                        ? <><Icon name="Loader2" size={15} className="animate-spin" />Загрузка...</>
                        : <><Icon name="ImagePlus" size={15} />Загрузить чек</>
                      }
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Оплачен */}
          {data.payment_status === "paid" && (
            <div className="print:hidden mt-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
              <Icon name="CheckCircle" size={24} className="text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Оплата подтверждена</p>
                <p className="text-xs text-green-600">Менеджер получил подтверждение оплаты. Спасибо!</p>
              </div>
            </div>
          )}

          <p className="print:hidden text-center text-xs text-gray-400 mt-6">
            Счёт действителен. По вопросам:{" "}
            <a href={`mailto:${r.email || "727187@it-profix.ru"}`} className="text-[#3ca615] hover:underline">
              {r.email || "727187@it-profix.ru"}
            </a>
          </p>
        </div>
      </div>

      {/* Стили для печати */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
