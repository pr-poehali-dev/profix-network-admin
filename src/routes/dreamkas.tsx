import { createFileRoute } from "@tanstack/react-router";
import Dreamkas from "@/pages/Dreamkas";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/dreamkas")({
  head: () =>
    seoHead({
      title: "Дримкас — кассы для малого бизнеса",
      description: "Официальный партнёр Дримкас в Якутске. Онлайн-кассы для магазинов, кафе и сферы услуг. Подключение к ОФД, регистрация в ФНС, настройка маркировки.",
      keywords: "Дримкас Якутск, касса для магазина, онлайн-касса купить, касса для кафе",
      canonical: "/dreamkas",
    }),
  component: Dreamkas,
});
