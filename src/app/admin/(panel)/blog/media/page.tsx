import type { Metadata } from "next";
import { PageHeader, Pagination } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { listMedia } from "@/lib/blog/media";
import MediaLibrary from "./MediaLibrary";

export const metadata: Metadata = { title: "Media" };

const PAGE_SIZE = 36;

export default async function MediaPage({ searchParams }: PageProps<"/admin/blog/media">) {
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const requested = Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1;
  const [, { items, total, page, pageCount }] = await Promise.all([requireAdmin(), listMedia(query, requested, PAGE_SIZE)]);

  return (
    <>
      <PageHeader title="Media" description={`${total} ${total === 1 ? "image" : "images"} in the library`} />
      <MediaLibrary items={items} query={query} />
      {pageCount > 1 && (
        <div className="mt-4">
          <Pagination page={page} pageCount={pageCount} basePath="/admin/blog/media" params={{ q: query || undefined }} />
        </div>
      )}
    </>
  );
}
