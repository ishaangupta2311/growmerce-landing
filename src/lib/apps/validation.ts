import { z } from "zod";

import { PLATFORMS, SECRET_ENV_PATTERN } from "./types";

/**
 * What the app settings form may save. Mirrors the checks in
 * migrations/0011_apps.sql, so a bad value is a sentence under its field
 * rather than a constraint error.
 */

export const APP_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** "https://app.example.com/" → "https://app.example.com". Null when it is not an app's address. */
export function normalizeBaseUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  /* Plain http only for a local copy of an app, and only off production,
     where it would point the server at its own machine. */
  const local =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.protocol !== "https:" && !local) return null;
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
  return url.origin;
}

export const appIdSchema = z.string().regex(APP_ID_PATTERN, "Lowercase letters, numbers and dashes, up to 40.");

export const appSchema = z.object({
  name: z.string().trim().min(1, "Give the app a name.").max(60, "60 characters at most."),
  platforms: z
    .array(z.enum(PLATFORMS))
    .min(1, "Pick at least one platform.")
    .transform((list) => PLATFORMS.filter((platform) => list.includes(platform))),
  baseUrl: z
    .string()
    .transform((value, ctx) => {
      const url = normalizeBaseUrl(value);
      if (!url) {
        ctx.addIssue({
          code: "custom",
          message: "The app's https address, like https://app.example.com, with no path.",
        });
        return z.NEVER;
      }
      return url;
    }),
  secretEnv: z
    .string()
    .trim()
    .regex(SECRET_ENV_PATTERN, "An environment variable name ending in _ANALYTICS_SECRET."),
  iconUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || /^(\/[^/\\]|https:\/\/)/.test(value), "A site path like /brand/icon.svg, or an https address.")
    .transform((value) => value || null),
});

export type AppInput = z.input<typeof appSchema>;
