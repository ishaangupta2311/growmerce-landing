# Merchant email in the admin

`/admin/email` shows the email Growsearch sends to the merchants who installed
it, and sends one-off campaigns. Nothing about that email is stored here: the
contact list, the automatic emails, the sending and the results all live in the
Growsearch app (`smart-search` repo, `docs/merchant-email.md`). This page is a
window onto it.

## What the page does

- **The list.** Every store Growsearch holds a contact for, its address, and
  whether it is subscribed, unsubscribed or uninstalled.
- **Automatic emails.** The welcome, the setup nudge and the review request,
  with how many were sent, delivered, opened, clicked, bounced and reported as
  spam. "Send what is due now" runs the app's daily sweep on demand; it sends
  only what is already due.
- **Campaigns.** A subject, a plain-text message and an optional button, sent
  to subscribed merchants. `{{shop_name}}` becomes the store's name. "Send me a
  test" sends one sample to the address given and stores nothing.

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
both actions.
