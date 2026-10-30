import { createFileRoute } from "@tanstack/react-router";
import DataMobile from "@/pages/DataMobile";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/datamobile")({
  head: () =>
    seoHead({
      title: "DataMobile — ПО для склада и торговли",
      description: "Официальный партнёр DataMobile в Якутске. Продажа и внедрение ПО для автоматизации склада и торгового зала. DataMobile Стандарт, Online, модули Маркировка и RFID.",
      keywords: "DataMobile Якутск, ПО для склада, автоматизация склада, DataMobile купить",
      canonical: "/datamobile",
    }),
  component: DataMobile,
});
