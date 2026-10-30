import { createFileRoute } from "@tanstack/react-router";
import OnecFranchise from "@/pages/OnecFranchise";
import { seoHead } from "@/components/SEO";

export const Route = createFileRoute("/1c")({
  head: () =>
    seoHead({
      title: "1С Франчайзи — внедрение и сопровождение 1С",
      description: "Авторизованный партнёр 1С в Якутске. Продажа, внедрение и сопровождение 1С:Розница, 1С:Бухгалтерия, 1С:Зарплата. Обучение и техподдержка.",
      keywords: "1С Якутск, внедрение 1С, 1С Розница, 1С Бухгалтерия, франчайзи 1С",
      canonical: "/1c",
    }),
  component: OnecFranchise,
});
