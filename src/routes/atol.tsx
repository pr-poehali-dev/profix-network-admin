import { createFileRoute } from "@tanstack/react-router";
import Atol from "@/pages/Atol";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/atol")({
  head: () =>
    seoHead({
      title: "АТОЛ — онлайн-кассы и кассовое оборудование",
      description: "Официальный партнёр АТОЛ в Якутске. Онлайн-кассы, фискальные регистраторы, ТСД АТОЛ Smart. Регистрация ККТ в ФНС под ключ. Соответствие 54-ФЗ.",
      keywords: "АТОЛ Якутск, онлайн-касса, КТТ, фискальный регистратор, 54-ФЗ, регистрация кассы",
      canonical: "/atol",
    }),
  component: Atol,
});
