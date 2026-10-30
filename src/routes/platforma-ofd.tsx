import { createFileRoute } from "@tanstack/react-router";
import PlatformaOfd from "@/pages/PlatformaOfd";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/platforma-ofd")({
  head: () =>
    seoHead({
      title: "Платформа ОФД — передача фискальных данных",
      description: "Подключение к Платформе ОФД (Эвотор ОФД) в Якутске. Аккредитованный оператор фискальных данных. Надёжная передача чеков в ФНС, личный кабинет.",
      keywords: "Платформа ОФД, Эвотор ОФД Якутск, подключить ОФД, оператор фискальных данных",
      canonical: "/platforma-ofd",
    }),
  component: PlatformaOfd,
});
