import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/session";
import { editorOptions } from "@/lib/blog/taxonomy";
import type { PostFormValues } from "@/lib/blog/types";
import PostEditor from "../PostEditor";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  const [admin, options] = await Promise.all([requireAdmin(), editorOptions()]);

  const defaults: PostFormValues = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featuredImage: "",
    ogImage: "",
    twitterCard: "summary_large_image",
    authorId: admin.authorId ?? "",
    categoryId: "",
    tagIds: [],
    publishedAt: "",
    scheduledAt: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
  };

  return <PostEditor post={null} defaults={defaults} options={options} />;
}
