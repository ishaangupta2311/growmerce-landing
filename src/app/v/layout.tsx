import type { Metadata } from "next";

/* The archived design variants under /v are previews, not pages to rank. Set
   here once so /v, /v/1 and /v/4 all inherit it: a child layout that sets only
   title and description leaves a parent's `robots` alone (metadata merges
   shallowly, key by key). robots.txt must NOT disallow /v, or crawlers would
   never fetch the page and see this tag. */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function VariantsLayout({ children }: LayoutProps<"/v">) {
  return children;
}
