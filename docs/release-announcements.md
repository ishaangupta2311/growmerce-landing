# Release announcements

When Growsearch ships a production release, merchants hear about it twice: a
post on the blog and an email. The Growsearch app (`smart-search` repo) writes
both from its release notes and sends them here as a **draft**. Somebody
reviews the draft at `/admin/announcements` and approves it. Approving
publishes the post and emails the merchants. Nothing goes out without that
approval, and at most one announcement email goes out every 7 days.

## The flow

1. A production release runs the app's `npm run announce`. It asks this site
   for `status` to find `lastRef`, the release up to which notes have already
   been dealt with.
2. It writes a blog post and an email from every release note since `lastRef`
   and sends them as a `draft`. If it decides the notes need no announcement
   (internal changes only), it sends `skip` instead.
3. The draft becomes the one **pending** announcement, owning a blog post kept
   in status `draft`. If one is already pending, the new draft **replaces** its
   content: a newer release supersedes it, and the app has regenerated from
   everything since `lastRef`, so nothing is lost.
4. In the admin, somebody reads the post (preview on the page, or the blog
   editor), edits the email, sends themselves a test, then either:
   - **Approves**: the post is published (and the blog pages revalidated), the
     email goes to every subscribed merchant with Growsearch installed with a
     button to the post, and the announcement is marked approved.
   - **Discards**: nothing is published or sent, and the draft post is deleted
     (unless somebody published it by hand meanwhile).

Approved, skipped and discarded announcements all move `lastRef` on. So
discarding means "these notes won't be announced", not "try again later". To
announce them after all, write the post and a campaign by hand.

## The 7-day cap

If any announcement's email went out in the last 7 days, Approve is off and the
page says when the next email can go out (to the minute, in UTC). `status` gives
the app the same date as `nextEmailAt`. A draft can still arrive and be edited
while the cap holds. It waits, and later releases replace it.

## Approve is safe to retry

Approve does three things in order: publish the post, send the campaign, and
mark the row approved. Any of them can fail, so pressing Approve again is
always safe:

- A post that is already live isn't published again (its date stays).
- The campaign id is minted with the announcement and never changes. The app
  answers a repeated id with the campaign it already has, so merchants get one
  email however many times it's asked.
- If the send fails, the announcement stays pending with the error shown on
  the page. The post is already live by then.

If the app replaces the draft while somebody is approving it, the email that
went out is the one that was approved, and the row is pointed back at the post
that was published. The replacement's fresh draft post is left in the blog as
an ordinary draft.

Editing the post in the blog editor is fine. Save it as a draft and Approve
publishes it as it stands. A newer draft from the app overwrites the post's
title, excerpt, content and SEO description, but keeps the byline and category
you chose.

## Storage

`blog.announcement` (`migrations/0013_announcements.sql`): status (`pending`,
`approved`, `skipped`, `discarded`), `since_ref`/`release_ref`, the note
filenames, the post, the email (subject, body, button label), the campaign id,
the skip reason, the last approval error, the recipient count, and who did what
and when. A partial unique index allows only one `pending` row. Every write that
decides which row is pending also runs behind one advisory lock.

New posts go in the **Product updates** category (`product-updates`, created
the first time it's needed). The byline is an author called "Growsearch team"
if one exists, otherwise the author with the most posts, and "Growsearch team"
is created only if there are no authors at all.

## The API

`POST /api/announcements/<operation>`. JSON in, JSON out, never cached
(`cache-control: no-store`). Code: `src/app/api/announcements/[operation]/route.ts`,
`src/lib/announcements/`.

### Signing

| Header                  | Value                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `x-growmerce-timestamp` | Unix time in milliseconds                                                              |
| `x-growmerce-signature` | `sha256=` + hex HMAC-SHA256 of `<timestamp>.<path>.<rawBody>` under `ANNOUNCE_SECRET` |

`path` is the request path, e.g. `/api/announcements/draft`, and `rawBody` is
the exact bytes sent. The timestamp is signed as the header text.

```js
const path = "/api/announcements/draft";
const body = JSON.stringify(payload);
const timestamp = String(Date.now());
const signature = createHmac("sha256", process.env.ANNOUNCE_SECRET)
  .update(`${timestamp}.${path}.${body}`)
  .digest("hex");
// headers: x-growmerce-timestamp: timestamp, x-growmerce-signature: `sha256=${signature}`
```

### Answers

| Status | When                                                                                  |
| ------ | ------------------------------------------------------------------------------------- |
| 200    | Done. The body is the operation's answer, plus `ok: true`.                            |
| 400    | Invalid JSON or input. `error` names the field: `"releaseRef: must not be empty"`.    |
| 401    | Missing, malformed or wrong signature, or a timestamp more than 5 minutes either side. |
| 404    | Unknown operation (checked after the signature).                                      |
| 409    | `skip` while an announcement is pending.                                              |
| 413    | Body over 256 KB.                                                                     |
| 500    | Ours (e.g. the database). Worth retrying.                                             |
| 503    | `ANNOUNCE_SECRET` unset (or shorter than 32 characters) on this site.                 |

Errors are `{ "ok": false, "error": "..." }`. The 401 doesn't say which check
failed. The site's log does.

### `status`

Body `{}`.

```json
{
  "lastRef": "v1.4.0",
  "lastEmailSentAt": "2026-10-20T09:12:00.000Z",
  "nextEmailAt": "2026-10-27T09:12:00.000Z",
  "pending": null
}
```

- `lastRef`: the `releaseRef` of the most recent announcement that is
  approved, skipped or discarded, or null if there are none.
- `lastEmailSentAt`: the latest announcement email.
- `nextEmailAt`: `lastEmailSentAt` + 7 days if that's in the future, else null.
- `pending`: null, or
  `{ id, releaseRef, sinceRef, updatedAt, adminUrl }`.

### `draft`

```json
{
  "sinceRef": "v1.4.0",
  "releaseRef": "v1.6.0",
  "notes": ["2026-10-18-search-analytics.md", "2026-10-21-faster-typo-fixes.md"],
  "blog": { "title": "...", "excerpt": "...", "html": "<p>...</p>", "seoDescription": "..." },
  "email": { "subject": "...", "body": "Hi {{shop_name}},\n\n...", "ctaLabel": "See what's new" }
}
```

Creates the pending announcement, or replaces the pending one's content.
Answers `{ id, postId, adminUrl }`.

- `sinceRef` may be null (the first announcement). Refs are 1–200 characters,
  at most 500 notes.
- `blog.html` goes through the blog's sanitiser (`src/lib/blog/sanitize.ts`):
  `h1` becomes `h2`, scripts, styles beyond alignment, event handlers and
  `javascript:` links are dropped. If nothing is left, the answer is 400.
- Limits match the admin's own forms: title 200, excerpt 500, SEO description
  320, subject 150, email body 10,000, button label 60. An empty button label
  becomes "Read what's new".
- The post gets a unique slug from the title (`search-analytics`,
  `search-analytics-2`, …). On a replace the same draft post is rewritten. If it
  was published or deleted meanwhile, a fresh draft is created.
- The email body is plain text with blank lines between paragraphs.
  `{{shop_name}}` becomes the store's name, as in any campaign.

### `skip`

```json
{ "sinceRef": "v1.4.0", "releaseRef": "v1.4.1", "notes": ["..."], "reason": "Internal changes only." }
```

Records a skipped announcement, which moves `lastRef` on and publishes and sends
nothing. Answers `{ id }`. A retried skip for the same refs returns the same
row. 409 while an announcement is pending: those notes are part of it.

## Configuration

| Variable              | Purpose                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANNOUNCE_SECRET`     | Shared with the Growsearch app under the same name. Signs the app's requests to this API. At least 32 characters (`openssl rand -hex 32`). Unset: every request answers 503. |
| `PORTAL_EMAIL_SECRET` | Already set for `/admin/email`. Approve and the test send use the same signed client (`src/lib/growsearch/email.ts`).                                                          |
| `GROWSEARCH_APP_URL`  | Optional, as for merchant email.                                                                                                                                                |

`ANNOUNCE_SECRET` is its own key, not `PORTAL_EMAIL_SECRET`. The key that can
put a draft in front of the owner can't also email every merchant, and the
reverse.

Absolute URLs need no configuration. The email's button and the public post
links use `SITE_ORIGIN` (`src/lib/site-urls.ts`, `https://www.growmerce.ai`),
because merchants must always land on the live site. `adminUrl` in the API's
answers uses the host the request came in on, so a preview deployment links to
its own admin.

Run `npm run db:migrate` once to create the table.

## Access

The **Announcements** tab, under Merchants, has its own permission
(`announcements` in `src/lib/team/permissions.ts`). View shows the draft and
the history. Edit saves the email, sends tests, approves and discards. Approving
needs only this permission, not Blog → Posts, because publishing the post is
part of the announcement. The link into the blog editor shows only to roles that
can open Posts. The page and every action check with `requireAccess` /
`requireAdmin`.

## Checking it

`npm run check:announcements` runs self-contained checks of the signature (a
correct request, the 5-minute window both ways, a wrong body, path, timestamp
or key, malformed and missing headers, an unset key) and of the request bodies.
It needs no database or network.
