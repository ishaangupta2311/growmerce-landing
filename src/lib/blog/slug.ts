/**
 * URL slugs for posts, categories, tags and authors.
 *
 * Pure and dependency-free: the editor uses it to suggest a slug as you type,
 * the server uses it to normalise what arrives, and the seed script uses it
 * outside Next.js entirely.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX_LENGTH = 120;

/** "Héllo, World!" → "hello-world". Empty when nothing usable is left. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

/** `base`, or `base-2`, `base-3`… — the first one not in `taken`. */
export function nextFreeSlug(base: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** The LIKE pattern that finds `base` and its numbered siblings. */
export function slugFamilyPattern(base: string): string {
  return `${base.replace(/[\\%_]/g, "\\$&")}-%`;
}
