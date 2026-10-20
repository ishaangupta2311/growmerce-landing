import "server-only";

import { renderLayout, type RenderedEmail } from "./layout";

/**
 * The invitation to join the Growmerce admin team. The link is the only copy
 * of the invite's token (the database keeps a hash), so it is the whole
 * credential for accepting: whoever opens it can join as this address.
 */
export function renderTeamInviteEmail(input: {
  name: string;
  invitedBy: string;
  roleName: string;
  link: string;
  expiresInDays: number;
}): RenderedEmail {
  return renderLayout({
    subject: `${input.invitedBy} invited you to the Growmerce admin`,
    preview: `Join as ${input.roleName}. The link works for ${input.expiresInDays} days.`,
    heading: "You've been invited to the Growmerce admin",
    paragraphs: [
      `${input.invitedBy} added you to the Growmerce team as ${input.roleName}.`,
      `Accept the invitation to choose a password and sign in. The link works once, for ${input.expiresInDays} days.`,
    ],
    cta: "Accept the invitation",
    footnote: "If you weren't expecting this, you can ignore this email. Nothing happens until the link is used.",
    name: input.name,
    link: input.link,
  });
}
