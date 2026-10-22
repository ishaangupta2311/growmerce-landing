import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { requireAccess } from "@/lib/admin/session";
import { formatDateTime } from "@/lib/announcements/format";
import {
  announcementsView,
  EMAIL_CAP_DAYS,
  postUrl,
  type Announcement,
  type AnnouncementStatus,
} from "@/lib/announcements/store";
import { emailOverview, type Answer, type EmailOverview } from "@/lib/growsearch/email";
import { allows } from "@/lib/team/permissions";
import { PageHeader } from "@/components/admin/ui";
import AnnouncementForm from "@/components/admin/announcements/AnnouncementForm";
import DiscardButton from "@/components/admin/announcements/DiscardButton";
import Empty from "@/components/affiliate/Empty";
import Panel from "@/components/affiliate/Panel";
import { Body, Head, Row, RowHeader, Table, Td, Th } from "@/components/affiliate/Table";

export const metadata: Metadata = { title: "Release announcements" };

/**
 * Release announcements: the blog post and merchant email the Growsearch app
 * drafts for each production release, waiting here for somebody to approve
 * them. See docs/release-announcements.md and src/lib/announcements/store.ts.
 *
 * Approving, discarding, editing and testing need edit on Announcements; view
 * shows the draft and the history only.
 *
 * The app's figures (how many merchants an approval reaches, how each sent
 * announcement did) come from the Growsearch app, which sleeps and can take
 * most of a minute to wake. They stream in behind Suspense so the draft never
 * waits on them.
 */

type Overview = Promise<Answer<EmailOverview>> | null;

const DONE: Record<string, string> = {
  approved: "Approved. The post is live and the email is on its way to merchants; results appear below as they arrive.",
  "already-sent": "Approved. The post is live. The email had already been sent, so it was not sent again.",
  discarded: "Discarded. Nothing was published or sent, and those release notes will not be announced.",
};

const STATUS: Record<AnnouncementStatus, { label: string; tone: string }> = {
  pending: { label: "Waiting", tone: "bg-peach text-charcoal ring-brand/20" },
  approved: { label: "Sent", tone: "bg-brand/10 text-brand ring-brand/25" },
  skipped: { label: "Skipped", tone: "bg-cream text-body-mute ring-line" },
  discarded: { label: "Discarded", tone: "bg-white text-muted ring-line" },
};

function StatusPill({ status }: { status: AnnouncementStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 font-poppins text-[12.5px] font-bold whitespace-nowrap ring-1 ring-inset ${STATUS[status].tone}`}
    >
      {STATUS[status].label}
    </span>
  );
}

function releaseRange(item: Pick<Announcement, "sinceRef" | "releaseRef">): string {
  return item.sinceRef ? `${item.sinceRef} → ${item.releaseRef}` : `Up to ${item.releaseRef}`;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** How many merchants approving would reach, once the app answers. */
async function Reach({ overview }: { overview: Overview }) {
  const answer = await overview;
  if (!answer) return null;
  if (!answer.ok) {
    return (
      <p className="text-[13.5px] leading-snug text-body-mute">
        Could not ask the Growsearch app how many merchants this reaches: {answer.error}
      </p>
    );
  }
  return (
    <p className="text-[13.5px] leading-snug text-body-mute">
      Approving emails {plural(answer.data.audiences.installed, "merchant")} with Growsearch installed. Unsubscribed
      addresses are never included.
      {!answer.data.configured && " Email is not configured on the Growsearch app, so nothing would send."}
    </p>
  );
}

/** A sent announcement's results, from the app's campaign list. Nothing when it has none. */
async function Results({ overview, campaignId }: { overview: Overview; campaignId: string }) {
  const answer = await overview;
  const campaign = answer?.ok ? answer.data.campaigns.find((item) => item.id === campaignId) : undefined;
  if (!campaign) return null;
  return (
    <span className="mt-0.5 block text-[13px] leading-snug text-muted">
      {campaign.delivered} delivered · {campaign.opened} opened · {campaign.clicked} clicked
      {campaign.completedAt ? "" : " · still sending"}
    </span>
  );
}

function PostLinks({ post, canOpenPosts }: { post: NonNullable<Announcement["post"]>; canOpenPosts: boolean }) {
  return (
    <span className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-bold">
      {canOpenPosts && (
        <Link href={`/admin/blog/${post.id}/edit`} className="text-brand hover:underline">
          Open in the blog editor
        </Link>
      )}
      {post.status === "published" && (
        <a href={postUrl(post.slug)} target="_blank" rel="noreferrer" className="text-brand hover:underline">
          View on the blog
        </a>
      )}
    </span>
  );
}

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAccess("announcements");
  const canEdit = allows(admin.grant, "announcements", "edit");
  const canOpenPosts = allows(admin.grant, "blog.posts");

  const [view, params] = await Promise.all([announcementsView(), searchParams]);
  const done = typeof params.done === "string" ? DONE[params.done] : undefined;
  const { pending, history } = view;

  /* Started, not awaited: the components that need it wait inside Suspense. */
  const overview: Overview = pending || history.some((item) => item.emailSentAt) ? emailOverview() : null;

  const capNote = view.nextEmailAt
    ? `The last announcement email went out on ${formatDateTime(view.lastEmailSentAt!)}. At most one goes out every ${EMAIL_CAP_DAYS} days, so the next can go out on ${formatDateTime(view.nextEmailAt)}.`
    : null;

  return (
    <>
      <PageHeader
        title="Release announcements"
        description="A blog post and a merchant email for each Growsearch release, drafted by the app. Nothing goes out until it is approved here."
      />
      <div className="space-y-8">
        {done && (
          <p role="status" className="rounded-[10px] border border-line bg-cream px-4 py-3 text-[14.5px] leading-snug text-body-mute">
            {done}
          </p>
        )}

        {!pending ? (
          <Panel title="Waiting for approval">
            <Empty title="No announcement is waiting">
              When a production release of Growsearch runs the app&apos;s <code>npm run announce</code>, it writes a
              blog post and a merchant email from the release notes and puts them here. Nothing is published or sent
              until somebody approves it.
            </Empty>
            {capNote && <p className="mt-4 text-[13.5px] leading-snug text-body-mute">{capNote}</p>}
          </Panel>
        ) : (
          <>
            <Panel title="Waiting for approval" action={canEdit ? <DiscardButton id={pending.id} /> : undefined}>
              <div className="space-y-5">
                {pending.lastError && (
                  <p
                    role="alert"
                    className="rounded-[10px] border border-brand/30 bg-cream px-4 py-3 text-[14.5px] leading-snug text-brand"
                  >
                    {pending.lastError}
                  </p>
                )}
                <dl className="grid gap-x-8 gap-y-4 text-[15px] sm:grid-cols-3">
                  <div>
                    <dt className="font-poppins text-[12.5px] font-bold tracking-[0.04em] text-body-mute uppercase">
                      Releases
                    </dt>
                    <dd className="mt-1 font-bold break-all text-charcoal">{releaseRange(pending)}</dd>
                  </div>
                  <div>
                    <dt className="font-poppins text-[12.5px] font-bold tracking-[0.04em] text-body-mute uppercase">
                      Drafted
                    </dt>
                    <dd className="mt-1 text-charcoal">
                      {formatDateTime(pending.createdAt)}
                      {pending.updatedAt !== pending.createdAt && (
                        <span className="block text-[13px] text-muted">Redrafted for a newer release {formatDateTime(pending.updatedAt)}</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-poppins text-[12.5px] font-bold tracking-[0.04em] text-body-mute uppercase">
                      Release notes
                    </dt>
                    <dd className="mt-1 text-charcoal">{plural(pending.notes.length, "note")}</dd>
                  </div>
                </dl>
                {pending.notes.length > 0 && (
                  <details className="rounded-[10px] border border-line px-4 py-3">
                    <summary className="cursor-pointer font-poppins text-[14px] font-bold text-charcoal">
                      Notes covered
                    </summary>
                    <ul className="mt-3 space-y-1 font-mono text-[13px] break-all text-body-mute">
                      {pending.notes.map((note) => (
                        <li key={note}>{note}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </Panel>

            <Panel title="Blog post">
              {pending.post ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-poppins text-[17px] font-bold text-charcoal">{pending.post.title}</p>
                    <p className="mt-1 text-[13.5px] break-all text-muted">
                      {pending.post.status === "published"
                        ? "Published"
                        : pending.post.status === "scheduled"
                          ? "Scheduled"
                          : "Draft, not public"}{" "}
                      · {postUrl(pending.post.slug)}
                    </p>
                  </div>
                  <PostLinks post={pending.post} canOpenPosts={canOpenPosts} />
                  {pending.postHtml !== null && (
                    <details className="rounded-[10px] border border-line px-4 py-3">
                      <summary className="cursor-pointer font-poppins text-[14px] font-bold text-charcoal">
                        Preview the post
                      </summary>
                      <article className="mt-4 max-w-[70ch]">
                        <h3 className="font-poppins text-[26px] leading-tight font-bold text-charcoal">
                          {pending.post.title}
                        </h3>
                        {pending.post.excerpt && (
                          <p className="mt-2 text-[17px] leading-relaxed text-body-mute">{pending.post.excerpt}</p>
                        )}
                        <div className="blog-prose mt-6" dangerouslySetInnerHTML={{ __html: pending.postHtml }} />
                      </article>
                    </details>
                  )}
                  <p className="text-[13.5px] leading-snug text-body-mute">
                    Edit the post in the blog editor and save it as a draft; approving publishes it as it stands.
                  </p>
                </div>
              ) : (
                <Empty title="The draft post was deleted">
                  Run <code>npm run announce</code> in the Growsearch app again to draft a new one, or discard this
                  announcement.
                </Empty>
              )}
            </Panel>

            <Panel title="Email to merchants">
              <div className="space-y-5">
                {capNote && (
                  <p
                    role="status"
                    className="rounded-[10px] border border-line bg-cream px-4 py-3 text-[14.5px] leading-snug text-body-mute"
                  >
                    {capNote}
                  </p>
                )}
                {canEdit ? (
                  <AnnouncementForm
                    key={pending.updatedAt}
                    id={pending.id}
                    subject={pending.emailSubject ?? ""}
                    body={pending.emailBody ?? ""}
                    ctaLabel={pending.emailCtaLabel ?? ""}
                    adminEmail={admin.email}
                    canApprove={!view.nextEmailAt && Boolean(pending.post)}
                    approveNote={
                      view.nextEmailAt
                        ? `Approve opens on ${formatDateTime(view.nextEmailAt)}.`
                        : "Approving publishes the post now and emails merchants with Growsearch installed, with a button to the post."
                    }
                  />
                ) : (
                  <div className="space-y-4 text-[15px] text-charcoal">
                    <p>
                      <span className="font-bold">Subject:</span> {pending.emailSubject}
                    </p>
                    <p className="whitespace-pre-wrap">{pending.emailBody}</p>
                    <p>
                      <span className="font-bold">Button:</span> {pending.emailCtaLabel}
                    </p>
                    <p className="text-[13.5px] text-body-mute">View only. Your role can see announcements but not approve them.</p>
                  </div>
                )}
                <Suspense fallback={<p className="text-[13.5px] text-muted">Asking the Growsearch app how many merchants this reaches…</p>}>
                  <Reach overview={overview} />
                </Suspense>
              </div>
            </Panel>
          </>
        )}

        <Panel title="History" scroll={history.length > 0}>
          {history.length === 0 ? (
            <Empty title="Nothing announced yet">
              Every announcement approved, skipped by the app or discarded here is listed, newest first.
            </Empty>
          ) : (
            <Table caption="Past release announcements">
              <Head>
                <Th>Releases</Th>
                <Th>Status</Th>
                <Th>When</Th>
                <Th>Post</Th>
                <Th>Email</Th>
              </Head>
              <Body>
                {history.map((item) => (
                  <Row key={item.id}>
                    <RowHeader>
                      <span className="block max-w-[32ch] text-[15px] font-bold break-all text-charcoal">
                        {releaseRange(item)}
                      </span>
                      <span className="mt-0.5 block max-w-[40ch] text-[13px] leading-snug text-muted">
                        {plural(item.notes.length, "note")}
                        {item.reason ? ` · ${item.reason}` : ""}
                      </span>
                    </RowHeader>
                    <Td>
                      <StatusPill status={item.status} />
                    </Td>
                    <Td>
                      <span className="block whitespace-nowrap">
                        {formatDateTime(item.approvedAt ?? item.discardedAt ?? item.createdAt)}
                      </span>
                      {(item.approvedBy ?? item.discardedBy) && (
                        <span className="mt-0.5 block text-[13px] text-muted">{item.approvedBy ?? item.discardedBy}</span>
                      )}
                    </Td>
                    <Td>
                      {item.post ? (
                        <span className="block max-w-[36ch]">
                          <span className="block text-[14px] font-bold">{item.post.title}</span>
                          <PostLinks post={item.post} canOpenPosts={canOpenPosts} />
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </Td>
                    <Td>
                      {item.emailSentAt ? (
                        <span className="block max-w-[36ch]">
                          <span className="block text-[14px]">
                            {item.emailSubject}
                            {item.emailRecipients !== null ? ` · ${plural(item.emailRecipients, "merchant")}` : ""}
                          </span>
                          <Suspense fallback={null}>
                            <Results overview={overview} campaignId={item.campaignId} />
                          </Suspense>
                        </span>
                      ) : (
                        <span className="text-muted">Not sent</span>
                      )}
                    </Td>
                  </Row>
                ))}
              </Body>
            </Table>
          )}
        </Panel>

        <p className="max-w-[70ch] text-[13.5px] leading-relaxed text-body-mute">
          At most one announcement email goes out every {EMAIL_CAP_DAYS} days. A newer release arriving while one is
          waiting replaces it, covering everything since the last announcement. Discarding or skipping marks those
          release notes as dealt with, so they are not announced later.
        </p>
      </div>
    </>
  );
}
