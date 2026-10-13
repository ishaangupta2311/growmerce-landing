import "server-only";

import { formatCode } from "@/lib/affiliate/codes";
import type { PartnerKind } from "@/lib/affiliate/types";
import { renderLayout, type RenderedEmail } from "./layout";

/**
 * The email a new partner gets the moment their account exists.
 *
 * One job: put the onboarding tutorial in front of them before their first
 * client asks how this works. The dashboard carries the same video, but the
 * dashboard is somewhere they have to remember to go, and an email is
 * something they can find again by searching their inbox in a month.
 *
 * The button goes to the public programme page, not the dashboard, so it plays
 * for whoever opens it: forwarded to a colleague, or on a phone that is not
 * signed in.
 */

/** The heading above the player on `src/app/affiliates/page.tsx`. */
export const TUTORIAL_ANCHOR = "tutorial";

export function renderWelcomeEmail(input: {
  /** This deployment's origin, so a preview mails links back to itself. */
  origin: string;
  name: string;
  kind: PartnerKind;
  /** Null if the code could not be read; the email is still worth sending. */
  code: string | null;
}): RenderedEmail {
  const who = input.kind === "agency" ? "client" : "store";
  const them = input.kind === "agency" ? "Your client" : "The store owner";

  return renderLayout({
    subject: `How to onboard your first ${who} onto Growsearch`,
    preview: "A 90-second video, from your code to their first search.",
    heading: `How to onboard a ${who}`,
    paragraphs: ["Welcome to the Growmerce affiliate program. Here is all there is to it:"],
    bullets: [
      input.code ? `Your code is ${formatCode(input.code)}` : "Your code is on your dashboard",
      `${them} installs Growsearch from the Shopify App Store`,
      "They enter your code on the plan page",
      "They start the free trial and switch search on",
      "The store then shows up on your dashboard",
    ],
    cta: "Watch the 90-second video",
    footnote: "Questions? Write to admin@growmerce.ai.",
    name: input.name,
    link: `${input.origin}/affiliates#${TUTORIAL_ANCHOR}`,
  });
}
