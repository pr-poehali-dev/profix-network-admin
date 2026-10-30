import { createFileRoute, notFound } from "@tanstack/react-router";
import Blog from "@/pages/Blog";
import { seoHead } from "@/components/SEO";
import { fetchPublicPost } from "@/lib/public-data";
import { getYouTubeId } from "@/pages/Blog_Cards";

export const Route = createFileRoute("/blog/$id")({
  loader: async ({ params }) => {
    const post = await fetchPublicPost(params.id);
    // null — записи точно нет; undefined — сервер недоступен, страница догрузит данные сама
    if (post === null) throw notFound();
    return { post: post ?? null };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return {};
    const ytId = post.video_url ? getYouTubeId(post.video_url) : null;
    return seoHead({
      title: `${post.title} — ПРОФИКС`,
      description: post.excerpt || post.title,
      image: post.cover_url || (ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : undefined),
      type: "article",
      publishedTime: post.created_at,
      canonical: `/blog/${post.id}`,
    });
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { post } = Route.useLoaderData();
  return <Blog initialPost={post} />;
}
