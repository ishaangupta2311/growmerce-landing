import type { Metadata } from "next";
import { PageHeader, Pagination } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { listMedia } from "@/lib/blog/media";
import { allows } from "@/lib/team/permissions";
import MediaLibrary from "./MediaLibrary";

export const metadata: Metadata = { title: "Media" };

const PAGE_SIZE = 36;

export default async function MediaPage({ searchParams }: PageProps<"/admin/blog/media">) {
  const admin = await requireAccess("blog.media");
  const params = await searchParams;
  const query = (typeof params.q === "string" ? params.q : "").trim().slice(0, 100);
  const requested = Number.parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1;
  const { items, total, page, pageCount } = await listMedia(query, requested, PAGE_SIZE);

  return (
    <>
      <PageHeader title="Media" description={`${total} ${total === 1 ? "image" : "images"} in the library`} />
      <MediaLibrary items={items} query={query} canEdit={allows(admin.grant, "blog.media", "edit")} />
      {pageCount > 1 && (
        <div className="mt-4">
          <Pagination page={page} pageCount={pageCount} basePath="/admin/blog/media" params={{ q: query || undefined }} />
        </div>
      )}
    </>
  );
}
