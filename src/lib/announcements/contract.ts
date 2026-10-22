import { z } from "zod";

/**
 * The bodies the Growsearch app's `npm run announce` sends to
 * /api/announcements/<operation>. Specified in docs/release-announcements.md;
 * the app side holds the same shapes. Every limit here is one the admin's own
 * forms already hold (the blog editor's, the campaign form's), so a draft that
 * passes can be edited and saved in the admin without tripping a rule.
 */

/** A release reference: a tag, a version or a commit. Opaque here. */
const ref = z
  .string()
  .trim()
  .min(1, "must not be empty")
  .max(200, "must be 200 characters or fewer")
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "must not contain control characters");

const notes = z
  .array(z.string().trim().min(1, "a note filename must not be empty").max(300, "a note filename is too long"))
  .max(500, "too many notes");

export const draftSchema = z.object({
  sinceRef: ref.nullable(),
  releaseRef: ref,
  notes,
  blog: z.object({
    title: z.string().trim().min(1, "the title must not be empty").max(200, "the title must be 200 characters or fewer"),
    excerpt: z.string().trim().max(500, "the excerpt must be 500 characters or fewer"),
    html: z.string().trim().min(1, "the post must have content"),
    seoDescription: z.string().trim().max(320, "the SEO description must be 320 characters or fewer"),
  }),
  email: z.object({
    subject: z.string().trim().min(1, "the subject must not be empty").max(150, "the subject must be 150 characters or fewer"),
    body: z.string().trim().min(1, "the body must not be empty").max(10_000, "the body must be 10,000 characters or fewer"),
    ctaLabel: z.string().trim().max(60, "the button label must be 60 characters or fewer"),
  }),
});

export type DraftInput = z.output<typeof draftSchema>;

export const skipSchema = z.object({
  sinceRef: ref.nullable(),
  releaseRef: ref,
  notes,
  reason: z.string().trim().max(1000, "the reason must be 1,000 characters or fewer"),
});

export type SkipInput = z.output<typeof skipSchema>;

/** `{}`, and nothing else: a status request carries no input. */
export const statusSchema = z.object({}).strict();

/** The first problem, as one sentence naming the field. */
export function describeIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "invalid body";
  const where = issue.path.length > 0 ? issue.path.join(".") : "body";
  return `${where}: ${issue.message}`;
}

/** The button label when the app sends none. A link with no label is no button. */
export const DEFAULT_CTA_LABEL = "Read what's new";
