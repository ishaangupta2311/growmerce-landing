/**
 * Shapes shared by the admin panel, the public blog and the Server Actions
 * between them. Client-safe: types and constants only.
 *
 * Ids are strings because Postgres `bigint` does not fit a JS number safely
 * and postgres.js returns it as text. Dates cross the server/client boundary
 * as ISO strings.
 */

export const POST_STATUSES = ["draft", "scheduled", "published"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const TWITTER_CARDS = ["summary_large_image", "summary"] as const;
export type TwitterCard = (typeof TWITTER_CARDS)[number];

/** What the editor's buttons ask for. */
export const POST_INTENTS = ["draft", "update", "publish", "schedule", "unpublish"] as const;
export type PostIntent = (typeof POST_INTENTS)[number];

export const POST_SORTS = {
  updated_desc: "Recently updated",
  updated_asc: "Least recently updated",
  published_desc: "Newest published",
  published_asc: "Oldest published",
  created_desc: "Newest created",
  title_asc: "Title A–Z",
  title_desc: "Title Z–A",
} as const;
export type PostSort = keyof typeof POST_SORTS;

export type Option = { id: string; name: string };

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type AdminPostRow = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  featuredImage: string | null;
  authorName: string | null;
  categoryName: string | null;
  publishedAt: string | null;
  scheduledAt: string | null;
  updatedAt: string;
};

/** Everything the editor loads and sends back. */
export type PostFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  ogImage: string;
  twitterCard: TwitterCard;
  authorId: string;
  categoryId: string;
  tagIds: string[];
  /** ISO timestamps, or "" for unset. */
  publishedAt: string;
  scheduledAt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
};

export type EditablePost = PostFormValues & {
  id: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
};

export type TagRow = { id: string; name: string; slug: string; postCount: number };

export type AuthorRow = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  adminEmail: string | null;
};

/**
 * Vercel refuses function request bodies over 4.5 MB, so anything larger
 * could never arrive. Checked in the browser for a fast answer and again on
 * the server, which is the check that counts.
 */
export const MEDIA_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MEDIA_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  altText: string | null;
  createdAt: string;
};

/** A post as the public article template renders it — also what a preview stores. */
export type ArticleData = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  /** Already sanitised. */
  contentHtml: string;
  featuredImage: string | null;
  ogImage: string | null;
  twitterCard: TwitterCard;
  publishedAt: string | null;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalUrl: string | null;
  author: { name: string; slug: string; bio: string | null; avatarUrl: string | null } | null;
  category: { name: string; slug: string } | null;
  tags: { name: string; slug: string }[];
};

export type ArticleCard = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: string;
  authorName: string | null;
  categoryName: string | null;
};
