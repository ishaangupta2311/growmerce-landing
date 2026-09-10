/**
 * Affiliate codes: how one is made, and what counts as the same code.
 *
 * A code is typed by hand more often than it is pasted — an agency enters it
 * into the Growsearch app while setting a client up, an influencer reads it off
 * a screen into a video description. So the random half is drawn from an
 * alphabet with the characters that are misread at a glance left out (no O
 * against 0, no I against 1), and `normaliseCode` is forgiving about everything
 * that does not change which code was meant: case, surrounding space, and the
 * dashes people add or drop.
 *
 * Both sides of a comparison must go through `normaliseCode`. The column is
 * unique on the stored form, so a code that skipped normalisation on the way in
 * is a code nobody will ever match.
 */

/** No O, I, 0 or 1: nothing in here is confusable with anything else in here. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** How many random characters a generated code ends with. */
const SUFFIX_LENGTH = 5;

const MIN_LENGTH = 3;
const MAX_LENGTH = 32;

/**
 * The canonical form of a code: upper case, letters and digits only.
 *
 * Separators are stripped rather than preserved, so `ACME-7K2M`, `acme7k2m` and
 * `ACME 7K2M` are one code. They are only ever *displayed* with a dash — see
 * `formatCode` — which keeps the readable form a presentation concern instead
 * of something the unique index has to be careful about.
 *
 * No character substitutions. It is tempting to fold a typed `0` onto `O` since
 * the generator emits neither, but that guesses at intent: the mistyped
 * character could equally have been a `D` or an `8`, and quietly attributing a
 * store to whichever partner the guess happens to land on is worse than telling
 * the person their code was not found.
 *
 * Returns null when there is nothing usable left, which is the caller's signal
 * to reject rather than to store an empty string.
 */
export function normaliseCode(input: string): string | null {
  if (typeof input !== "string") return null;

  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < MIN_LENGTH || cleaned.length > MAX_LENGTH) return null;
  return cleaned;
}

/**
 * The code as a human should see it: the name half, a dash, the random half.
 *
 * Presentation only — never store this, and never compare against it.
 */
export function formatCode(code: string): string {
  if (code.length <= SUFFIX_LENGTH + 1) return code;
  const split = code.length - SUFFIX_LENGTH;
  return `${code.slice(0, split)}-${code.slice(split)}`;
}

/**
 * A random suffix from the unambiguous alphabet.
 *
 * `crypto.getRandomValues` rather than `Math.random`, not because a code is a
 * secret — it is the opposite, it is meant to be shared — but because a
 * predictable generator makes it possible to enumerate the codes issued around
 * a given moment, and a code is all it takes to attribute somebody else's
 * client to your account.
 *
 * The modulo is unbiased because 32 divides 256 exactly.
 */
function randomSuffix(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const byte of bytes) out += ALPHABET[byte % ALPHABET.length];
  return out;
}

/**
 * A first code for a new partner, seeded from their name so it means something
 * to the person sharing it.
 *
 * The name part is capped at four characters: long enough that `ACME-7K2M9` is
 * recognisably Acme's, short enough to still fit in a video description and a
 * support email. A name that yields nothing usable — one written entirely in a
 * non-Latin script, say — gets the house prefix rather than an awkward
 * transliteration.
 *
 * Uniqueness is not this function's job. The column is unique and the caller
 * retries; see `createPartner` in `store.ts`.
 */
export function suggestCode(name: string): string {
  const stem = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 4);

  return `${stem.length >= 2 ? stem : "GROW"}${randomSuffix(SUFFIX_LENGTH)}`;
}

/** Whether a string could be a code at all, before any database lookup. */
export function isCodeShaped(input: string): boolean {
  return normaliseCode(input) !== null;
}
