import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Drops every cached public blog page after a write that readers can see:
 * a post saved or deleted, or a category, tag or author renamed (their names
 * are printed on the pages). Patterns rather than single paths, so a post
 * whose slug just changed loses its old cached copy too.
 *
 * Not the sitemap: it is cached by the CDN for a minute (see
 * `app/sitemap.xml/route.ts`), not by Next, so there is nothing here to drop.
 */
export function revalidateBlog(): void {
  revalidatePath("/blog");
  revalidatePath("/blog/page/[page]", "page");
  revalidatePath("/blog/[slug]", "page");
  // /about shows the latest posts.
  revalidatePath("/about");
}
