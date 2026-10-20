import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  CircleCheck,
  ExternalLink,
  FileText,
  FolderOpen,
  Hourglass,
  Images,
  Pencil,
  Plus,
  Store,
  Tags,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { LocalTime } from "@/components/admin/overlay";
import { ButtonLink, Card, EmptyState, PageHeader, StatusBadge } from "@/components/admin/ui";
import { requireAccess } from "@/lib/admin/session";
import { adminOverview } from "@/lib/affiliate/admin-store";
import { formatMoney } from "@/lib/affiliate/format";
import { getDashboard } from "@/lib/blog/posts";
import { allows, allowsApps, type Grant } from "@/lib/team/permissions";

export const metadata: Metadata = { title: "Overview" };

type Stat = { label: string; value: string | number; icon: LucideIcon; tone: string; href?: string; note?: string };

/**
 * One figure that opens the list it counts. Shared by the blog row and the
 * affiliate row. Without an `href` (a list the role cannot open) it is the
 * same figure, not a link.
 */
function StatLink({ label, value, icon: Icon, tone, href, note }: Stat) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-zinc-500">{label}</p>
        <span className={`grid size-8 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs font-semibold text-zinc-500">{note}</p>}
    </>
  );
  const frame = "rounded-xl border border-zinc-200 bg-white p-4 shadow-xs sm:p-5";
  if (!href) return <div className={frame}>{body}</div>;
  return (
    <Link href={href} className={`group ${frame} transition-all hover:border-zinc-300 hover:shadow-sm`}>
      {body}
    </Link>
  );
}

/** The tabs a role can open, in the sidebar's order: where the welcome card points when neither section shows. */
function visibleTabs(grant: Grant): { href: string; label: string }[] {
  const tabs = [
    { href: "/admin/apps", label: "Your apps", show: allowsApps(grant) },
    { href: "/admin/blog/categories", label: "Categories", show: allows(grant, "blog.categories") },
    { href: "/admin/blog/tags", label: "Tags", show: allows(grant, "blog.tags") },
    { href: "/admin/blog/media", label: "Media", show: allows(grant, "blog.media") },
    { href: "/admin/blog/settings", label: "Authors", show: allows(grant, "blog.authors") },
    { href: "/admin/affiliates/partners", label: "Partners", show: allows(grant, "affiliates.partners") },
    { href: "/admin/affiliates/payouts", label: "Payouts", show: allows(grant, "affiliates.payouts") },
    { href: "/admin/affiliates/events", label: "Ingest log", show: allows(grant, "affiliates.events") },
    { href: "/admin/email", label: "Email", show: allows(grant, "email") },
    { href: "/admin/team", label: "Team", show: allows(grant, "team") },
  ];
  return tabs.filter((tab) => tab.show).map(({ href, label }) => ({ href, label }));
}

function SectionHeading({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
        {label}
        <ArrowRight aria-hidden className="size-3.5" />
      </Link>
    </div>
  );
}

const NONE = Promise.resolve(null);

/**
 * The admin's front page: the blog and the affiliate program, each with the
 * few figures worth opening the admin for, and a way into the rest. Each
 * section shows only to a role that can open its tab, and is not even loaded
 * otherwise.
 */
export default async function OverviewPage() {
  /* The check comes first, alone: what to load depends on the role. */
  const admin = await requireAccess("overview");
  const { grant } = admin;
  const showBlog = allows(grant, "blog.posts");
  const showAffiliates = allows(grant, "affiliates.overview");
  const canWrite = allows(grant, "blog.posts", "edit");

  const [blog, affiliates] = await Promise.all([
    showBlog ? getDashboard() : NONE,
    showAffiliates ? adminOverview() : NONE,
  ]);

  const stats: Stat[] = blog
    ? [
        { label: "Total blogs", value: blog.counts.total, icon: FileText, tone: "bg-zinc-100 text-zinc-700", href: "/admin/blog" },
        { label: "Published", value: blog.counts.published, icon: CircleCheck, tone: "bg-emerald-50 text-emerald-600", href: "/admin/blog?status=published" },
        { label: "Drafts", value: blog.counts.draft, icon: Pencil, tone: "bg-amber-50 text-amber-600", href: "/admin/blog?status=draft" },
        { label: "Scheduled", value: blog.counts.scheduled, icon: CalendarClock, tone: "bg-sky-50 text-sky-600", href: "/admin/blog?status=scheduled" },
      ]
    : [];

  /* Only the libraries the role can open: a count that leads nowhere is noise. */
  const library = blog
    ? [
        { label: "Categories", value: blog.extras.categories, icon: FolderOpen, href: "/admin/blog/categories", key: "blog.categories" },
        { label: "Tags", value: blog.extras.tags, icon: Tags, href: "/admin/blog/tags", key: "blog.tags" },
        { label: "Media files", value: blog.extras.media, icon: Images, href: "/admin/blog/media", key: "blog.media" },
      ].filter((item) => allows(grant, item.key))
    : [];

  /* The largest currency headlines, as on the affiliate overview; the rest are
     named rather than added to it, because two currencies are two amounts. */
  const owed = affiliates?.owed[0];
  const clearing = affiliates?.clearing[0];
  const others = (count: number) => (count > 1 ? `+ ${count - 1} other currenc${count === 2 ? "y" : "ies"}` : undefined);
  /* Each figure opens its list only for a role that can see that list. */
  const linkIf = (key: string, href: string) => (allows(grant, key) ? href : undefined);

  const affiliateStats: Stat[] = affiliates
    ? [
        {
          label: "Awaiting approval",
          value: affiliates.pendingApplications,
          icon: UserPlus,
          tone: affiliates.pendingApplications > 0 ? "bg-amber-50 text-amber-600" : "bg-zinc-100 text-zinc-700",
          href: linkIf("affiliates.partners", "/admin/affiliates/partners?status=pending"),
        },
        {
          label: "Owed now",
          value: owed ? formatMoney(owed.cents, owed.currency) : "-",
          icon: Banknote,
          tone: "bg-emerald-50 text-emerald-600",
          href: linkIf("affiliates.payouts", "/admin/affiliates/payouts"),
          note: others(affiliates.owed.length),
        },
        {
          label: "Still clearing",
          value: clearing ? formatMoney(clearing.cents, clearing.currency) : "-",
          icon: Hourglass,
          tone: "bg-sky-50 text-sky-600",
          href: "/admin/affiliates",
          note: others(affiliates.clearing.length),
        },
        {
          label: "Stores referred",
          value: affiliates.referrals,
          icon: Store,
          tone: "bg-zinc-100 text-zinc-700",
          href: linkIf("affiliates.partners", "/admin/affiliates/partners"),
        },
      ]
    : [];

  const firstName = admin.name.split(" ")[0] || "there";

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          showBlog && showAffiliates
            ? `Welcome back, ${firstName}. The blog and the affiliate program at a glance.`
            : showBlog
              ? `Welcome back, ${firstName}. The blog at a glance.`
              : showAffiliates
                ? `Welcome back, ${firstName}. The affiliate program at a glance.`
                : `Welcome back, ${firstName}.`
        }
        actions={
          canWrite && (
            <ButtonLink href="/admin/blog/new" variant="primary">
              <Plus className="size-4" />
              New post
            </ButtonLink>
          )
        }
      />

      {!blog && !affiliates && <WelcomeCard tabs={visibleTabs(grant)} />}

      {blog && (
        <>
          <SectionHeading title="Blog" href="/admin/blog" label="All posts" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatLink key={stat.label} {...stat} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Card
              title="Recently published"
              description="The latest posts readers can see."
              bodyClassName="p-0"
              actions={
                <Link href="/admin/blog?status=published&sort=published_desc" className="text-xs font-semibold text-brand hover:underline">
                  View all
                </Link>
              }
            >
              {blog.recentlyPublished.length === 0 ? (
                <EmptyState icon={<CircleCheck className="size-5" />} title="Nothing published yet">
                  Published posts will show up here.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {blog.recentlyPublished.map((post) => (
                    <li key={post.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/blog/${post.id}/edit`} className="block truncate text-sm font-semibold text-zinc-900 hover:text-brand">
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
                <Link href="/admin/blog" className="text-xs font-semibold text-brand hover:underline">
                  View all
                </Link>
              }
            >
              {blog.recentlyUpdated.length === 0 ? (
                <EmptyState
                  icon={<FileText className="size-5" />}
                  title="No posts yet"
                  action={
                    canWrite && (
                      <ButtonLink href="/admin/blog/new" variant="primary" size="sm">
                        <Plus className="size-4" />
                        Write the first post
                      </ButtonLink>
                    )
                  }
                >
                  {canWrite ? "Create a post and it will appear here." : "Posts will show up here once somebody writes one."}
                </EmptyState>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {blog.recentlyUpdated.map((post) => (
                    <li key={post.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <div className="min-w-0 flex-1">
                        <Link href={`/admin/blog/${post.id}/edit`} className="block truncate text-sm font-semibold text-zinc-900 hover:text-brand">
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

          {library.length > 0 && (
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
          )}
        </>
      )}

      {affiliates && (
        <div className={blog ? "mt-10" : undefined}>
          <SectionHeading title="Affiliates" href="/admin/affiliates" label="Open affiliates" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {affiliateStats.map((stat) => (
              <StatLink key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** For a role that sees neither the blog nor the affiliate program: where to go instead. */
function WelcomeCard({ tabs }: { tabs: { href: string; label: string }[] }) {
  return (
    <Card>
      <p className="text-sm text-zinc-600">
        {tabs.length > 0
          ? "Your role doesn't include the blog or the affiliate program, so there are no figures here. These are yours:"
          : "Your role doesn't include anything else in the admin yet. Ask whoever manages the team if you need more."}
      </p>
      {tabs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <ButtonLink key={tab.href} href={tab.href} size="sm">
              {tab.label}
              <ArrowRight aria-hidden className="size-3.5" />
            </ButtonLink>
          ))}
        </div>
      )}
    </Card>
  );
}
