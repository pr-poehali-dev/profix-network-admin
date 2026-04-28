import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { reviewsApi } from "@/lib/crm-api";

interface Review {
  id: number;
  name: string;
  rating: number;
  text: string;
  created_at: string;
  service?: string;
}

const FALLBACK_REVIEWS: Review[] = [
  { id: 1, name: "Алексей М.", rating: 5, text: "Быстро починили ноутбук, всё объяснили. Отличный сервис, рекомендую!", created_at: "2025-03-10T10:00:00", service: "Ремонт ноутбука" },
  { id: 2, name: "Ирина С.", rating: 5, text: "Установили видеонаблюдение в офисе — сделали аккуратно и в срок. Профессиональная команда.", created_at: "2025-02-20T10:00:00", service: "Видеонаблюдение" },
  { id: 3, name: "Дмитрий К.", rating: 5, text: "Зарегистрировали онлайн-кассу без лишних вопросов. Сэкономили кучу времени, спасибо!", created_at: "2025-01-15T10:00:00", service: "Онлайн-касса" },
  { id: 4, name: "Наталья Р.", rating: 4, text: "Настроили сеть в магазине. Работает стабильно уже несколько месяцев. Хорошая работа.", created_at: "2024-12-05T10:00:00", service: "Сетевое оборудование" },
  { id: 5, name: "Сергей Т.", rating: 5, text: "Обращаюсь уже второй раз — каждый раз на высшем уровне. Теперь только к ним!", created_at: "2024-11-18T10:00:00", service: "Обслуживание 1С" },
  { id: 6, name: "Екатерина В.", rating: 5, text: "Оперативно выехали, устранили проблему с компьютером. Цены адекватные, мастера вежливые.", created_at: "2024-10-30T10:00:00", service: "Ремонт компьютера" },
];

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>(FALLBACK_REVIEWS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsApi.getPublished()
      .then(res => {
        if (res.reviews && res.reviews.length > 0) setReviews(res.reviews);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Icon key={i} name="Star" size={14}
        className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />
    ));

  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section className="bg-[#F7F9FC] py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-oswald text-2xl font-bold text-[#0D1B2A] mb-1">Отзывы клиентов</h2>
            <p className="text-gray-500 text-sm">Что говорят о нас те, кто уже обращался</p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-sm border border-gray-100">
            <span className="font-oswald text-3xl font-bold text-[#3ca615]">{avg}</span>
            <div>
              <div className="flex gap-0.5 mb-0.5">{stars(5)}</div>
              <p className="text-xs text-gray-400">{reviews.length} отзывов</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">{stars(r.rating)}</div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">«{r.text}»</p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#edf7e8] flex items-center justify-center">
                      <Icon name="User" size={13} className="text-[#3ca615]" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{r.name}</span>
                  </div>
                  {r.service && (
                    <span className="text-xs text-gray-400 truncate max-w-[120px]">{r.service}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
