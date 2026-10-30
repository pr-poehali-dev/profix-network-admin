import { createFileRoute } from "@tanstack/react-router";
import OfdYandex from "@/pages/OfdYandex";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/ofd-yandex")({
  head: () =>
    seoHead({
      title: "ОФД Яндекс — оператор фискальных данных",
      description: "Подключение к ОФД Яндекс в Якутске. Передача данных с касс в ФНС, мониторинг и аналитика продаж. Быстрое подключение, выгодные тарифы.",
      keywords: "ОФД Якутск, оператор фискальных данных, подключить ОФД, ОФД Яндекс",
      canonical: "/ofd-yandex",
    }),
  component: OfdYandex,
});
