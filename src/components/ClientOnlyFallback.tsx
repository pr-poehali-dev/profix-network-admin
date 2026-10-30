// Заглушка для страниц, которые рендерятся только в браузере (вход хранится в localStorage)
export default function ClientOnlyFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] gap-3 px-4 text-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-500 rounded-full animate-spin" />
      <p className="font-oswald text-lg font-bold text-[#0D1B2A]">ПРОФИКС — IT-сервис в Якутске</p>
      <p className="text-sm text-gray-400">
        Загружаем личный кабинет. Если страница не открылась, обновите её или{" "}
        <a href="/login" className="underline" style={{ color: "#3ca615" }}>войдите заново</a>.
      </p>
    </div>
  );
}
