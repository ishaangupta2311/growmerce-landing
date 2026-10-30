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

/** The drawn pictures the app's email layout has (app/announcement-email.js there). */
export const ANNOUNCEMENT_VISUALS = ["blog-answer", "placements"] as const;

const line = (max: number, name: string) =>
  z.string().trim().max(max, `${name} must be ${max} characters or fewer`).default("");
const requiredLine = (max: number, name: string) =>
  z.string().trim().min(1, `${name} must not be empty`).max(max, `${name} must be ${max} characters or fewer`);

/**
 * The email, as fixed parts the app's layout puts together. Plain text in every
 * part; the app escapes it and validates it again before sending, with the same
 * limits.
 */
export const announcementSchema = z.object({
  title: requiredLine(120, "the title"),
  intro: requiredLine(400, "the intro"),
  action: z
    .object({
      title: requiredLine(80, "the action title"),
      text: line(300, "the action text"),
      ctaLabel: requiredLine(40, "the action button"),
    })
    .nullable()
    .default(null),
  sections: z
    .array(
      z.object({
        heading: line(80, "a section heading"),
        text: line(400, "a section's text"),
        visual: z.enum(ANNOUNCEMENT_VISUALS).nullable().default(null),
        caption: line(200, "a caption"),
        lead: line(200, "a lead line"),
        items: z
          .array(z.object({ title: requiredLine(60, "an item title"), text: line(200, "an item's text") }))
          .max(4, "a section has at most 4 items")
          .default([]),
        note: line(300, "a note"),
      }).refine(
        (section) =>
          Boolean(
            section.heading || section.text || section.visual || section.caption || section.lead || section.note,
          ) || section.items.length > 0,
        "a section must not be empty",
      ),
    )
    .max(4, "an email has at most 4 sections")
    .default([]),
});

export type AnnouncementContent = z.output<typeof announcementSchema>;

const emailBase = {
  subject: z.string().trim().min(1, "the subject must not be empty").max(150, "the subject must be 150 characters or fewer"),
  ctaLabel: z.string().trim().max(40, "the button label must be 40 characters or fewer"),
};

/** `blog` writes a new draft post; `postSlug` uses a post already on the blog, left as it is. */
export const draftSchema = z
  .object({
    sinceRef: ref.nullable(),
    releaseRef: ref,
    notes,
    postSlug: z.string().trim().min(1).max(200).optional(),
    blog: z
      .object({
        title: z.string().trim().min(1, "the title must not be empty").max(200, "the title must be 200 characters or fewer"),
        excerpt: z.string().trim().max(500, "the excerpt must be 500 characters or fewer"),
        html: z.string().trim().min(1, "the post must have content"),
        seoDescription: z.string().trim().max(320, "the SEO description must be 320 characters or fewer"),
      })
      .optional(),
    email: z.object({ ...emailBase, announcement: announcementSchema }),
  })
  .refine((draft) => Boolean(draft.blog) !== Boolean(draft.postSlug), {
    message: "send either blog or postSlug",
    path: ["blog"],
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
