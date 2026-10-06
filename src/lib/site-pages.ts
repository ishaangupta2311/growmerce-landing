/**
 * The pages a visitor can be sent to by name: what the sitemap lists, and what
 * the 404 page chooses from when it guesses what somebody meant.
 */

export type SitePage = { path: string; label: string };

/* The public marketing pages on growmerce.ai. Growsearch's own pages live on
   search.growmerce.ai, and the /v concepts are archived — neither belongs here. */
export const MARKETING_PAGES: readonly SitePage[] = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/products/ai-search", label: "Growsearch" },
  { path: "/pricing", label: "Pricing" },
  { path: "/solutions", label: "Solutions" },
  { path: "/compare", label: "Compare" },
  { path: "/fit", label: "Is it a fit?" },
  { path: "/try", label: "Try it free" },
  { path: "/contact", label: "Contact" },
  { path: "/help", label: "Help centre" },
  { path: "/blog", label: "Blog" },
  { path: "/privacy", label: "Privacy policy" },
  { path: "/terms", label: "Terms" },
];

/* Real addresses that are kept out of the sitemap but are still worth
   suggesting to somebody who nearly typed one. */
export const FINDABLE_PAGES: readonly SitePage[] = [
  ...MARKETING_PAGES,
  { path: "/affiliates", label: "Affiliate program" },
  { path: "/affiliates/login", label: "Affiliate sign-in" },
  { path: "/affiliates/signup", label: "Apply to the affiliate program" },
];

/**
 * Edit distance, counting two swapped neighbours as one edit and not two:
 * `/hepl` for `/help` is the commonest slip there is, and on a four-letter
 * name two edits would be too many to call it a near miss. The inputs are
 * short paths, so the whole table is kept and nothing is clever.
 */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/**
 * The page somebody most likely meant by a path that does not exist, or null
 * when nothing is close enough to say so with a straight face.
 *
 * A near miss on the whole path first: `/pricng`, `/abuot`, `/affilates`. Two
 * edits is the limit, and fewer than half the characters, so a short path like
 * `/fit` is not "nearly" every other three-letter word. Failing that, the page
 * the path sits under — a blog post that has been unpublished is best answered
 * with the blog.
 */
export function closestPage(pathname: string): SitePage | null {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  let best: SitePage | null = null;
  let bestDistance = Infinity;
  for (const page of FINDABLE_PAGES) {
    if (page.path === "/") continue;
    const d = distance(path, page.path);
    if (d < bestDistance) {
      best = page;
      bestDistance = d;
    }
  }
  if (best && bestDistance <= 2 && bestDistance < (path.length - 1) / 2) return best;

  const parents = FINDABLE_PAGES.filter(
    (page) => page.path !== "/" && path.startsWith(`${page.path}/`),
  );
  return parents.sort((a, b) => b.path.length - a.path.length)[0] ?? null;
}
