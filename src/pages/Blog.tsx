import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { blogApi, Post } from "@/lib/blog-api";
import { useSiteContent } from "@/hooks/useSiteContent";
import { clientSession, clientApi } from "@/lib/crm-api";
import { BlogPostDetail } from "./Blog_PostDetail";
import { BlogPostList } from "./Blog_PostList";

export default function Blog() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { str } = useSiteContent();

  const [posts, setPosts] = useState<Post[]>([]);
  const [post, setPost]   = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get("type") || "all");
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const youtubeChannel  = str("blog.youtube_channel", "");
  const subscribersCount = str("blog.subscribers", "");
  const channelDesc     = str("blog.channel_desc", "IT-советы, разборы техники и жизнь сервисного центра в Якутске");
  const blogBannerBg    = str("blog.header_bg", "");
  const blogBannerImg   = str("blog.header_bg_img", "");
  const blogPageBg      = str("blog.page_bg", "#F7F9FC");
  const blogBannerDark  = blogBannerBg
    ? ["#0f0f0f","#1a1a2e","#1e3a5f","#111827","#000000","#1a1a1a"].some(
        c => blogBannerBg.toLowerCase() === c
          || blogBannerBg.toLowerCase().startsWith("#0")
          || blogBannerBg.toLowerCase().startsWith("#1")
      )
    : false;

  useEffect(() => {
    const token = clientSession.get();
    if (token) {
      clientApi.verifyToken(token).then(r => setIsLoggedIn(r.valid)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      blogApi.getPost(Number(id))
        .then(r => { if (r.post) { setPost(r.post); setReactions(r.post.reactions || {}); } })
        .finally(() => setLoading(false));
    } else {
      setLoading(true);
      blogApi.getPosts(filter === "all" ? undefined : filter)
        .then(r => { if (r.posts) setPosts(r.posts); })
        .finally(() => setLoading(false));
    }
  }, [id, filter]);

  function changeFilter(f: string) {
    setFilter(f);
    setSearchParams(f === "all" ? {} : { type: f });
  }

  async function handleReact(reaction: "like" | "dislike") {
    if (!post) return;
    const res = await blogApi.react(post.id, reaction);
    if (res.ok) { setReactions(res.reactions); setMyReaction(reaction); }
  }

  // ── Детальный просмотр поста ───────────────────────────────────────────────
  if (id && post) {
    return (
      <BlogPostDetail
        post={post}
        posts={posts}
        reactions={reactions}
        myReaction={myReaction}
        youtubeChannel={youtubeChannel}
        subscribersCount={subscribersCount}
        blogPageBg={blogPageBg}
        blogDarkHeader={blogBannerDark}
        onReact={handleReact}
      />
    );
  }

  // ── Список постов ──────────────────────────────────────────────────────────
  return (
    <BlogPostList
      blogBannerBg={blogBannerBg}
      blogBannerImg={blogBannerImg}
      blogBannerDark={blogBannerDark}
      blogPageBg={blogPageBg}
      youtubeChannel={youtubeChannel}
      subscribersCount={subscribersCount}
      channelDesc={channelDesc}
      postsCount={posts.length}
      filter={filter}
      loading={loading}
      posts={posts}
      isLoggedIn={isLoggedIn}
      changeFilter={changeFilter}
    />
  );
}