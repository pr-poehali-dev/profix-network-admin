import { createFileRoute } from "@tanstack/react-router";
import POSCenter from "@/pages/POSCenter";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/poscenter")({
  head: () =>
    seoHead({
      title: "POSCenter — торговое POS-оборудование",
      description: "Официальный партнёр POSCenter в Якутске. POS-терминалы, фискальные регистраторы, ТСД, сканеры штрихкодов и принтеры этикеток. Поставка и настройка.",
      keywords: "POSCenter Якутск, POS-терминал, фискальный регистратор, ТСД, сканер штрихкодов",
      canonical: "/poscenter",
    }),
  component: POSCenter,
});
