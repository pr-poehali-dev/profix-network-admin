import { createFileRoute } from "@tanstack/react-router";
import Shop from "@/pages/Shop";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Магазин — ПРОФИКС" },
      { name: "description", content: "Интернет-магазин ПРОФИКС: кассовое оборудование, сканеры, ПО и расходные материалы" },
    ],
  }),
  component: Shop,
});
