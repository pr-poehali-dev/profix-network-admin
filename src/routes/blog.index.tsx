import { createFileRoute } from "@tanstack/react-router";
import Blog from "@/pages/Blog";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/blog/")({
  head: () =>
    seoHead({
      title: "Блог ПРОФИКС — IT-советы, новости и видео из Якутска",
      description: "Полезные статьи, новости IT-рынка Якутска, видео о ремонте оборудования и автоматизации бизнеса от компании ПРОФИКС. Советы по 1С, кассам, сетям.",
      keywords: "IT блог Якутск, новости IT Якутия, ремонт компьютеров советы Якутск, 1С статьи Якутск, видео ккт",
      canonical: "/blog",
    }),
  component: Blog,
});
