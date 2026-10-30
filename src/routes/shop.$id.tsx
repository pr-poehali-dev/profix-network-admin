import { createFileRoute, notFound } from "@tanstack/react-router";
import ShopProduct from "@/pages/ShopProduct";
import { fetchPublicProduct } from "@/lib/public-data";

export const Route = createFileRoute("/shop/$id")({
  loader: async ({ params }) => {
    const product = await fetchPublicProduct(params.id);
    // null — записи точно нет; undefined — сервер недоступен, страница догрузит данные сама
    if (product === null) throw notFound();
    return { product: product ?? null };
  },
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) return {};
    return {
      meta: [
        { title: `${product.name} — ПРОФИКС` },
        { name: "description", content: product.description?.slice(0, 160) || product.name },
      ],
    };
  },
  component: ShopProductPage,
});

function ShopProductPage() {
  const { product } = Route.useLoaderData();
  return <ShopProduct key={product?.id ?? "none"} initialProduct={product} />;
}
