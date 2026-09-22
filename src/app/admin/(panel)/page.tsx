import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CircleCheck, ExternalLink, FileText, FolderOpen, Images, Pencil, Plus, Tags } from "lucide-react";
import { LocalTime } from "@/components/admin/overlay";
import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { getDashboard } from "@/lib/blog/posts";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  /* Session check and data in one round trip; a failed check still
     redirects before anything renders. */
  const [admin, { counts, extras, recentlyPublished, recentlyUpdated }] = await Promise.all([requireAdmin(), getDashboard()]);

  const stats = [
    { label: "Total blogs", value: counts.total, icon: FileText, tone: "bg-zinc-100 text-zinc-700", href: "/admin/blogs" },
    { label: "Published", value: counts.published, icon: CircleCheck, tone: "bg-emerald-50 text-emerald-600", href: "/admin/blogs?status=published" },
    { label: "Drafts", value: counts.draft, icon: Pencil, tone: "bg-amber-50 text-amber-600", href: "/admin/blogs?status=draft" },
    { label: "Scheduled", value: counts.scheduled, icon: CalendarClock, tone: "bg-sky-50 text-sky-600", href: "/admin/blogs?status=scheduled" },
  ];

  const library = [
    { label: "Categories", value: extras.categories, icon: FolderOpen, href: "/admin/categories" },
    { label: "Tags", value: extras.tags, icon: Tags, href: "/admin/tags" },
    { label: "Media files", value: extras.media, icon: Images, href: "/admin/media" },
  ];

  const firstName = admin.name.split(" ")[0] || "there";

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${firstName}. Here's what's happening on the blog.`}
        actions={
          <ButtonLink href="/admin/blogs/new" variant="primary">
            <Plus className="size-4" />
            New post
          </ButtonLink>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-xl border border-zinc-200 bg-white p-4 shadow-xs transition-all hover:border-zinc-300 hover:shadow-sm sm:p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-zinc-500">{label}</p>
              <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 tabular-nums">{value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card
          title="Recently published"
          description="The latest posts readers can see."
          bodyClassName="p-0"
          actions={
            <Link href="/admin/blogs?status=published&sort=published_desc" className="text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          }
        >
          {recentlyPublished.length === 0 ? (
            <EmptyState icon={<CircleCheck className="size-5" />} title="Nothing published yet">
              Published posts will show up here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recentlyPublished.map((post) => (
                <li key={post.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/blogs/${post.id}/edit`} className="block truncate text-sm font-semibold text-zinc-900 hover:text-brand">
                      {post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Published <LocalTime iso={post.publishedAt} mode="date" />
                    </p>
                  </div>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                    aria-label={`View “${post.title}” on the blog`}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Recently updated"
          description="Posts edited most recently, in any state."
          bodyClassName="p-0"
          actions={
            <Link href="/admin/blogs" className="text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          }
        >
          {recentlyUpdated.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No posts yet"
              action={
                <ButtonLink href="/admin/blogs/new" variant="primary" size="sm">
                  <Plus className="size-4" />
                  Write the first post
                </ButtonLink>
              }
            >
              Create a post and it will appear here.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {recentlyUpdated.map((post) => (
                <li key={post.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/blogs/${post.id}/edit`} className="block truncate text-sm font-semibold text-zinc-900 hover:text-brand">
                      {post.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Updated <LocalTime iso={post.updatedAt} />
                    </p>
                  </div>
                  <StatusBadge status={post.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
        {library.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-zinc-300"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
              <Icon className="size-4" />
            </span>
            <div>
              <p className="text-lg leading-none font-extrabold text-zinc-900 tabular-nums">{value}</p>
              <p className="mt-1 text-xs font-semibold text-zinc-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
