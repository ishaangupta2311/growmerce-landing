-- Release announcements: a blog post and a merchant email for each production
-- release of Growsearch, drafted by the app and approved here.
--
-- The app's `npm run announce` (smart-search repo) writes both from its
-- release notes and posts them to /api/announcements/draft. That lands here as
-- the one `pending` row, owning a blog.post kept in status 'draft'. Nothing
-- goes out until somebody approves it in /admin/announcements: approving
-- publishes the post and sends the email as a campaign through the app's
-- merchant email (src/lib/growsearch/email.ts). See docs/release-announcements.md.
--
-- In the `blog` schema because every row owns a post there, and like the rest
-- of that schema it is reachable only through the server's own connection.
--
-- Re-runnable, like every migration here.

create table if not exists blog.announcement (
  id                uuid        primary key default gen_random_uuid(),
  -- pending: waiting for approval (at most one, see the index below)
  -- approved: post published and email sent
  -- skipped: the app decided these notes need no announcement
  -- discarded: an admin threw the draft away
  -- Every status but pending marks its notes as dealt with: the newest such
  -- row's release_ref is where the app's next announcement starts.
  status            text        not null default 'pending'
                    check (status in ('pending', 'approved', 'skipped', 'discarded')),
  -- The release the notes run from (exclusive; null for the very first) and
  -- to (inclusive). Opaque to this site: tags, versions or commits.
  since_ref         text        check (since_ref is null or length(since_ref) between 1 and 200),
  release_ref       text        not null check (length(release_ref) between 1 and 200),
  -- The release-note filenames covered.
  notes             text[]      not null default '{}',
  post_id           bigint      references blog.post (id) on delete set null,
  email_subject     text,
  -- The email's structured content (src/lib/announcements/contract.ts).
  email_content     jsonb,
  email_cta_label   text,
  -- Minted with the row, so an approval retried after a failure (or a double
  -- click) sends one campaign: the app answers a repeated id with the campaign
  -- it already has. Replaced only when the app has confirmed it never got the
  -- campaign and has withdrawn the id (clearSendRequest).
  campaign_id       uuid        not null default gen_random_uuid(),
  -- Raised by every new draft and every saved edit, so a form opened before
  -- one can't overwrite it or approve what its reader never saw.
  draft_version     integer     not null default 1,
  -- Held while an approval runs: no draft, edit or discard can change the row
  -- until it finishes. A holder that died lapses after a few minutes.
  approval_token    uuid,
  approval_started_at timestamptz,
  -- Set just before the campaign goes to the app, and cleared only if the app
  -- refused that request or later confirms it never got it. While set the email
  -- may have gone out, so the row can't be replaced, edited, discarded or
  -- approved again, and the seven-day cap counts it. Asking the app whether it
  -- has the campaign settles it (settleSent, clearSendRequest).
  send_requested_at timestamptz,
  -- Why the app skipped these notes.
  reason            text,
  -- The last failed approval, shown on the admin page until one succeeds.
  last_error        text,
  -- How many merchants the campaign went to, from the app's receipt.
  email_recipients  integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  approved_at       timestamptz,
  -- Emails copied in, like team.activity, so a row still reads right after
  -- its approver has left the team.
  approved_by       text,
  email_sent_at     timestamptz,
  discarded_at      timestamptz,
  discarded_by      text,
  constraint announcement_campaign_id_key unique (campaign_id),
  constraint announcement_pending_has_email
    check (status <> 'pending' or (email_subject is not null and email_content is not null)),
  constraint announcement_approved_has_dates
    check (status <> 'approved' or (approved_at is not null and email_sent_at is not null)),
  constraint announcement_discarded_has_date
    check (status <> 'discarded' or discarded_at is not null)
);

-- At most one announcement waits for approval. A newer release replaces the
-- pending one's content rather than queueing behind it.
create unique index if not exists announcement_one_pending
  on blog.announcement (status) where status = 'pending';

-- The seven-day email cap reads the latest send.
create index if not exists announcement_email_sent_idx
  on blog.announcement (email_sent_at desc) where email_sent_at is not null;

create index if not exists announcement_created_at_idx on blog.announcement (created_at desc);

alter table blog.announcement enable row level security;
