# Pricing lives on the Shopify App Store listing

App Store review (requirement 1.2.3, "Allow pricing plan changes") rejected
Growsearch because the site's /pricing page had an Enterprise "Custom pricing
for high-volume stores" block with "Talk to sales". Every plan has to be bought
through Shopify billing; a merchant must not be able to arrange a plan with us
directly.

So the site no longer sells plans itself:

- `/pricing` and its Enterprise block are deleted. `/pricing` now redirects
  (307, not permanent) to `PRICING_URL`.
- The About page's "Get a plan sized to your store" custom-plan form is deleted.
- Every pricing link reads `PRICING_URL` in `src/lib/site-urls.ts`: the header
  and footer "Pricing" entries, the home page pricing band, the Get started
  CTAs on /solutions and the features page, the /try side card, the Help
  centre's pricing topic, and the Terms. "Get my custom plan" became
  "See plans on Shopify".
- The Terms no longer say enterprise volumes are "handled by arrangement", and
  /fit says "Talk to us" rather than "Talk to sales".

`PRICING_URL` is `SHOPIFY_APP_LISTING`, which is a placeholder (the App Store
home page) until the listing is published. On launch day, setting the real
listing URL there moves every pricing link and the redirect with it.

The plan cards on the Growsearch home page stay. Their prices must match the
plans in the Partner Dashboard's managed pricing.
