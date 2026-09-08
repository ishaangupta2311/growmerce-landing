/**
 * The one sentence the whole preview is built around.
 *
 * Both halves of the comparison have to be answering the identical question —
 * the Growsearch mock and the store's own search — or the "before and after" is
 * rigged. That is why this lives in the job and ships in `PreviewResult.query`
 * rather than being decided in the browser: two clients, or a client and a
 * server, would eventually drift.
 *
 * It must always be a sentence a shopper would actually type. Not a keyword —
 * a keyword is what native search is good at, and putting one in would flatter
 * the "before" panel into meaninglessness while telling the merchant nothing
 * about the thing we are selling.
 *
 * The buckets below are deliberately shallow. They exist to avoid asking a
 * cookware shop about rain, not to classify commerce; anything a store's own
 * product titles do not clearly say gets the generic phrase, which is honest.
 * Titles are all we look at, which means a catalogue named entirely in model
 * names ("Tree Dasher", "Cruiser") lands on the fallback — correctly, since we
 * genuinely cannot tell what it sells.
 */

import type { PreviewProduct } from "./types";

/**
 * Order matters twice over: it is the tiebreak when two buckets match equally,
 * and weather is first because it is the phrasing the widget was designed
 * around and should keep winning where it fits.
 */
const BUCKETS: { test: RegExp; query: string }[] = [
  {
    test: /\b(rain|umbrella|coat|jacket|parka|scarf|warm|wool|knit|beanie|glove|waterproof|windproof|boot|commute|hood|sweater|thermal|fleece|cashmere|mitten)/i,
    query: "something warm for the rainy commute",
  },
  {
    test: /\b(cookware|skillet|frying pan|saucepan|stockpot|dutch oven|wok|griddle|bakeware|nonstick|non-stick|cast iron|cutting board|chef'?s knife|paring knife|oven mitt|colander|spatula|whisk)/i,
    query: "something nonstick for weeknight dinners",
  },
  {
    test: /\b(serum|moisturi[sz]er|cleanser|sunscreen|spf|retinol|hyaluronic|toner|exfoliant|lip balm|face mask|shampoo|conditioner|skincare)/i,
    query: "something gentle for dry, sensitive skin",
  },
  {
    test: /\b(gummies|gummy|seltzer|tonic|kava|kratom|mitragynine|tincture|capsules?|supplement|adaptogen|nootropic|melatonin|magnesium|elixir|infusions?)/i,
    query: "something to help me wind down in the evening",
  },
];

/**
 * Used whenever the catalogue does not say clearly enough what it is.
 *
 * Deliberately carries no currency. This phrase is typed into the merchant's
 * own search box and printed back to them, and it used to say "under $50" —
 * which we showed to boat-lifestyle.com, an Indian store pricing everything in
 * rupees. A budget the shopper cannot have meant is a keyword-search problem
 * we invented, not one we solve, and it reads as though we never looked at the
 * store. A budget stated in words is the same unanswerable-by-keywords
 * constraint without naming a unit we do not know.
 *
 * No apostrophe, either. The phrase is typed into the merchant's search box and
 * echoed back on their own results page, and sugarcosmetics.com double-escapes
 * it: "isn't" rendered as "isn&#039;t" in the screenshot we show them. Their
 * bug, but it lands in our evidence and reads as ours.
 */
const FALLBACK = "a thoughtful gift for someone on a budget";

export function pickQuery(products: PreviewProduct[]): string {
  const titles = products.map((product) => product.title);
  if (titles.length === 0) return FALLBACK;

  let best = FALLBACK;
  let bestCount = 0;

  for (const bucket of BUCKETS) {
    const count = titles.filter((title) => bucket.test.test(title)).length;
    /* Strictly greater, so the earliest bucket wins a tie. */
    if (count > bestCount) {
      bestCount = count;
      best = bucket.query;
    }
  }

  return best;
}
