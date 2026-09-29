# Plans are bought through Shopify only

App Store review (requirement 1.2.3, "Allow pricing plan changes") rejected
Growsearch because /pricing had an Enterprise "Custom pricing for high-volume
stores" block with "Talk to sales". Every plan has to be bought through Shopify
billing; a merchant must not be able to arrange a plan with us directly.

- The Enterprise block is removed from /pricing. The page keeps the three
  Shopify-billed plans, the Install on Shopify button and the FAQ.
- The About page's "Get a plan sized to your store" custom-plan form is deleted.
- "Get my custom plan" is now "See plans". The Terms no longer say enterprise
  volumes are "handled by arrangement", and /fit says "Talk to us" rather than
  "Talk to sales".
- Each plan card has a Buy button (Buy Basic, Buy Plus, Buy Pro) that opens
  `APP_STORE_SEARCH`, the App Store searched for "growsearch", in a new tab.
- Every pricing link reads `PRICING_URL` in `src/lib/site-urls.ts`: /pricing
  while the listing is in review, the App Store listing once
  `SHOPIFY_LISTING_LIVE` is true. Launch day needs no change here.

Do not add a custom, Enterprise or contact-us-for-a-plan tier back. Plan prices
on the site must match the managed pricing plans in the Partner Dashboard.
