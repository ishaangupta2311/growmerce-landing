/**
 * Input rules for everything the admin panel writes.
 *
 * Server Actions are public POST endpoints whatever the UI looks like, so
 * every action parses its input through one of these before touching the
 * database. Empty optional strings become null here, so the database never
 * holds "" where it means "not set".
 */

import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "./slug";
import { TWITTER_CARDS } from "./types";

/** Paths under /blog that a post slug must not shadow. */
const RESERVED_POST_SLUGS = new Set(["page", "category", "tag", "feed", "rss"]);

const UPLOAD_PATH = /^\/uploads\/[0-9a-f-]{36}\/[a-z0-9._-]{1,140}$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** A media-library path or an absolute http(s) URL. */
export function isImageUrl(value: string): boolean {
  return UPLOAD_PATH.test(value) || isHttpUrl(value);
}

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => value || null);

const optionalImage = z
  .string()
  .trim()
  .max(2048, "That URL is too long.")
  .refine((value) => value === "" || isImageUrl(value), "Pick an image from the media library or paste a full https:// URL.")
  .transform((value) => value || null);

const optionalUrl = z
  .string()
  .trim()
  .max(2048, "That URL is too long.")
  .refine((value) => value === "" || isHttpUrl(value), "Enter a full URL starting with https://.")
  .transform((value) => value || null);

export const idSchema = z.string().regex(/^\d{1,18}$/, "Invalid id.");

const optionalId = z
  .union([idSchema, z.literal(""), z.null()])
  .transform((value) => value || null);

const optionalDate = z
  .union([z.iso.datetime({ offset: true }), z.literal(""), z.null()])
  .transform((value) => (value ? new Date(value) : null));

const slugInput = z
  .string()
  .trim()
  .toLowerCase()
  .max(SLUG_MAX_LENGTH, `Keep the slug under ${SLUG_MAX_LENGTH} characters.`)
  .refine((value) => value === "" || SLUG_PATTERN.test(value), "Use lowercase letters, numbers and single hyphens only.");

export const postSchema = z.object({
  title: z.string().trim().min(1, "Give the post a title.").max(200, "Keep the title under 200 characters."),
  slug: slugInput.refine((value) => !RESERVED_POST_SLUGS.has(value), "That slug is reserved. Choose another."),
  excerpt: optionalText(500, "The excerpt"),
  content: z.string().max(1_000_000, "The post is too long to save."),
  featuredImage: optionalImage,
  ogImage: optionalImage,
  twitterCard: z.enum(TWITTER_CARDS),
  authorId: optionalId,
  categoryId: optionalId,
  tagIds: z.array(idSchema).max(30, "Use 30 tags or fewer."),
  publishedAt: optionalDate,
  scheduledAt: optionalDate,
  seoTitle: optionalText(120, "The SEO title"),
  seoDescription: optionalText(320, "The SEO description"),
  seoKeywords: optionalText(500, "The keywords"),
  canonicalUrl: optionalUrl,
});

export type PostInput = z.output<typeof postSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80, "Keep the name under 80 characters."),
  slug: slugInput,
  description: optionalText(500, "The description"),
});

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(60, "Keep the name under 60 characters."),
  slug: slugInput,
});

export const authorSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(100, "Keep the name under 100 characters."),
  slug: slugInput,
  bio: optionalText(1000, "The bio"),
  avatarUrl: optionalImage,
});

/** First message per field, keyed by the top-level field name. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
