import { createFileRoute, notFound } from "@tanstack/react-router";
import CustomPageView from "@/pages/CustomPage";
import { fetchPublicPage } from "@/lib/public-data";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const page = await fetchPublicPage(params.slug);
    // null — записи точно нет; undefined — сервер недоступен, страница догрузит данные сама
    if (page === null) throw notFound();
    return { page: page ?? null };
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page;
    if (!page) return {};
    return {
      meta: [
        { title: `${page.title} — ПРОФИКС` },
        ...(page.meta_desc ? [{ name: "description", content: page.meta_desc }] : []),
      ],
    };
  },
  component: CustomPageRoute,
});

function CustomPageRoute() {
  const { page } = Route.useLoaderData();
  return <CustomPageView initialPage={page} />;
}
