# Merchant email in the admin

`/admin/email` shows the email Growsearch sends to the merchants who installed
it, and sends one-off campaigns. Nothing about that email is stored here: the
contact list, the automatic emails, the sending and the results all live in the
Growsearch app (`smart-search` repo, `docs/merchant-email.md`). This page is a
window onto it.

## What the page does

- **The list.** Every store Growsearch holds a contact for, its address, and
  whether it is subscribed, unsubscribed or uninstalled.
- **Automatic emails.** The welcome, the setup nudge, the review request and
  the weekly report, with how many were sent, delivered, opened, clicked,
  bounced and reported as spam. The weekly report row adds up every week's
  report; in a store's history each one is named by its week ("Weekly report
  (Oct 19)"). "Send what is due now" runs the app's daily sweep on demand; it
  sends only what is already due.
- **Results.** Before answering, the app reads the latest delivery results
  back from Resend. Without its `RESEND_READ_API_KEY` the page says so, and the
  delivered, opened and clicked columns fill only from Resend's webhook. If the
  read fails, the page says the figures are the last ones stored.
- **Seeing what was sent.** Click an email's name (in Automatic emails,
  Campaigns, or a store's history) to open it. A dialog lists every store it
  went to, with its results, and shows the email as that store received it,
  read from the app's `email` operation. Emails sent before 2026-10-28 are read
  back from Resend the first time; if Resend no longer has one, the dialog
  says so. The email is shown in a sandboxed frame where links do not open: it
  carries the merchant's real unsubscribe link.
- **Weekly report copies.** The stores table has a "Weekly report copies to"
  column: up to 10 addresses per store, usually the agency that runs it, that
  each get their own copy of every weekly report. Type an address and press
  Add or Enter to add it (several can be pasted at once, separated by commas
  or spaces); press × on one to remove it. Each change saves at once. Needs
  edit on Email; a view-only role sees the addresses. Only admins can set
  them; merchants do not see them in the app. Each copy is a separate email
  with its own unsubscribe link, so an agency unsubscribing, or its address
  bouncing, removes only that address and never touches the merchant's email.
  Copies stop while the store is unsubscribed or uninstalled. None can be the
  store's own address. The copies' results have their own "Weekly report
  copy" row under Automatic emails, and show in a store's history as "Weekly
  report copy (Nov 9)", one per address.
- **Team alerts.** Who gets the emails Growsearch sends the team when a store
  installs it, approves a plan, or uninstalls: one list for all three, edited
  the same way. Each alert is one email to everyone on the list. The list
  cannot be emptied. Until it is first saved, the alerts go to
  `OWNER_ALERT_EMAIL` on the Growsearch app, which also switches them on: a
  deployment without it sends none, and the panel says so. See the app's
  `docs/owner-alerts.md`.
- Changes to either list are logged in the team activity log.
- **Campaigns.** A subject, a plain-text message and an optional button, sent
  to subscribed merchants. `{{shop_name}}` becomes the store's name. "Send me a
  test" sends one sample to the address given and stores nothing.

Release announcements (`/admin/announcements`, see
`docs/release-announcements.md`) send through the same campaign path, once
approved: audience "installed", with a button to the new blog post.

## Audiences

- **Merchants with Growsearch installed** is the default.
- **Everyone, including stores that uninstalled** also reaches stores that
  removed the app. Growsearch keeps those contacts as a deliberate exception to
  its data retention, with a compliance risk recorded in the app's
  `docs/merchant-email.md`. Use it sparingly.

An unsubscribed address is in neither. That is enforced in the app, not here.

## How it talks to the app

`src/lib/growsearch/email.ts` makes signed, server-to-server `POST` requests to
`<app>/api/portal/email/<operation>`. The signature is the affiliate scheme
pointed the other way: `x-growmerce-timestamp`, and `x-growmerce-signature`
carrying the HMAC-SHA256 of `<timestamp>.<path>.<body>` under
`PORTAL_EMAIL_SECRET`.

A campaign's id is minted when the page renders and sent with the form, so a
double click or a retried request sends once: the app answers a repeated id
with the campaign it already has.

## Configuration

| Variable              | Purpose                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `PORTAL_EMAIL_SECRET` | Shared with the Growsearch app, under the same name there. Unset: the page cannot load.     |
| `GROWSEARCH_APP_URL`  | Optional. Where the app is; defaults to production. Set only to point at another deployment. |

Access is the same as the rest of `/admin`: `requireAdmin()` on the page and on
every action.
