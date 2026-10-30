import { createFileRoute } from "@tanstack/react-router";
import Sbis from "@/pages/Sbis";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/sbis")({
  head: () =>
    seoHead({
      title: "СБИС — электронный документооборот и отчётность",
      description: "Официальный партнёр СБИС в Якутске. Подключение ЭДО, сдача электронной отчётности, CRM, бухгалтерия и кадровый учёт. Настройка и обучение.",
      keywords: "СБИС Якутск, ЭДО, электронная отчётность, сдача отчётности онлайн, СБИС подключить",
      canonical: "/sbis",
    }),
  component: Sbis,
});
