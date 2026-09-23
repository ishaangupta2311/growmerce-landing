import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { LocalTime } from "@/components/admin/overlay";
import Thumb from "@/components/admin/Thumb";
import { ButtonLink, EmptyState, PageHeader, Pagination, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { listAdminPosts, type PostListQuery } from "@/lib/blog/posts";
import { editorOptions } from "@/lib/blog/taxonomy";
import { POST_SORTS, POST_STATUSES, type PostSort, type PostStatus } from "@/lib/blog/types";
import PostFilters from "./PostFilters";
import PostRowActions from "./PostRowActions";

export const metadata: Metadata = { title: "Blogs" };

const PAGE_SIZE = 15;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function BlogsPage({ searchParams }: PageProps<"/admin/blog">) {
  const params = await searchParams;

  /* Anything unexpected in the URL falls back to the default, never into SQL. */
  const status = one(params.status);
  const category = one(params.category);
  const sort = one(params.sort);
  const query: PostListQuery = {
    q: one(params.q).trim().slice(0, 100),
    status: (POST_STATUSES as readonly string[]).includes(status) ? (status as PostStatus) : "all",
    categoryId: category === "none" || /^\d{1,18}$/.test(category) ? category : null,
    sort: sort in POST_SORTS ? (sort as PostSort) : "updated_desc",
    page: Math.max(1, Number.parseInt(one(params.page), 10) || 1),
    pageSize: PAGE_SIZE,
  };

  const [, { items, total, page, pageCount }, { categories }] = await Promise.all([
    requireAdmin(),
    listAdminPosts(query),
    editorOptions(),
  ]);
  const filtered = Boolean(query.q || query.status !== "all" || query.categoryId);

  return (
    <>
      <PageHeader
        title="Blogs"
        description={`${total} ${total === 1 ? "post" : "posts"}${filtered ? " match these filters" : ""}`}
        actions={
          <ButtonLink href="/admin/blog/new" variant="primary">
            <Plus className="size-4" />
            New post
          </ButtonLink>
        }
      />

      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs">
        <PostFilters categories={categories} />

        {items.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-5" />}
            title={filtered ? "No posts match" : "No posts yet"}
            action={
              !filtered && (
                <ButtonLink href="/admin/blog/new" variant="primary" size="sm">
                  <Plus className="size-4" />
                  Write the first post
                </ButtonLink>
              )
            }
          >
            {filtered ? "Try a different search or clear the filters." : "Posts you write will be listed here."}
          </EmptyState>
        ) : (
          <>
            {/* Table from tablet up */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/70 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
                  <tr>
                    <th scope="col" className="w-16 py-2.5 pl-4">
                      <span className="sr-only">Featured image</span>
                    </th>
                    <th scope="col" className="px-3 py-2.5">Title</th>
                    <th scope="col" className="px-3 py-2.5">Author</th>
                    <th scope="col" className="px-3 py-2.5">Category</th>
                    <th scope="col" className="px-3 py-2.5">Status</th>
                    <th scope="col" className="px-3 py-2.5">Published</th>
                    <th scope="col" className="px-3 py-2.5">Updated</th>
                    <th scope="col" className="py-2.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((post) => (
                    <tr key={post.id} className="hover:bg-zinc-50/60">
                      <td className="py-3 pl-4">
                        <Thumb src={post.featuredImage} className="h-10 w-14" sizes="56px" />
                      </td>
                      <td className="max-w-[320px] px-3 py-3">
                        <Link href={`/admin/blog/${post.id}/edit`} className="line-clamp-2 font-semibold text-zinc-900 hover:text-brand">
                          {post.title}
                        </Link>
                        <p className="mt-0.5 truncate text-xs text-zinc-400">/blog/{post.slug}</p>
                      </td>
                      <td className="px-3 py-3 text-zinc-600">{post.authorName ?? <span className="text-zinc-400">—</span>}</td>
                      <td className="px-3 py-3 text-zinc-600">{post.categoryName ?? <span className="text-zinc-400">—</span>}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-600">
                        {post.status === "scheduled" ? (
                          <span className="text-sky-700">
                            <LocalTime iso={post.scheduledAt} />
                          </span>
                        ) : post.status === "published" ? (
                          <LocalTime iso={post.publishedAt} mode="date" />
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-zinc-600">
                        <LocalTime iso={post.updatedAt} mode="date" />
                      </td>
                      <td className="py-3 pr-3">
                        <PostRowActions post={post} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards on phones */}
            <ul className="divide-y divide-zinc-100 md:hidden">
              {items.map((post) => (
                <li key={post.id} className="flex gap-3 p-3">
                  <Thumb src={post.featuredImage} className="h-16 w-20 shrink-0" sizes="80px" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/blog/${post.id}/edit`} className="line-clamp-2 text-sm font-semibold text-zinc-900">
                      {post.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
                      <StatusBadge status={post.status} />
                      {post.categoryName && <span>{post.categoryName}</span>}
                      <span>
                        Updated <LocalTime iso={post.updatedAt} mode="date" />
                      </span>
                    </div>
                  </div>
                  <PostRowActions post={post} />
                </li>
              ))}
            </ul>
          </>
        )}

        {pageCount > 1 && (
          <div className="border-t border-zinc-100 px-4 py-3">
            <Pagination
              page={page}
              pageCount={pageCount}
              basePath="/admin/blog"
              params={{
                q: query.q || undefined,
                status: query.status === "all" ? undefined : query.status,
                category: query.categoryId ?? undefined,
                sort: query.sort === "updated_desc" ? undefined : query.sort,
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
