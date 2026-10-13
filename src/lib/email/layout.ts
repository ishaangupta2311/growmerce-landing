import "server-only";

import { SITE_ORIGIN } from "@/lib/site-urls";

/**
 * How every email this site sends is drawn.
 *
 * An email is a subject, a heading, some paragraphs and one button, and the
 * HTML and plain-text bodies are both built from that so the two cannot drift
 * apart. The markup is tables and inline styles because that is what mail
 * clients render: no stylesheet, no web font, nothing that needs a `<head>`.
 */

/**
 * Production, whatever deployment is sending. A mail client fetches this from
 * the open internet, so a preview or localhost origin would show a broken image.
 *
 * A PNG because Gmail and Outlook do not draw SVG. It is
 * `public/brand/logo-black.svg` rendered at three times the size it is shown
 * at, and has to be rendered again when that file changes.
 */
const LOGO_URL = `${SITE_ORIGIN}/brand/logo-black.png`;

/* The site's palette, from `src/app/globals.css`. */
const BRAND = "#ff5a1f";
const CHARCOAL = "#171717";
const CREAM = "#fff4ee";
const BODY = "#4a4a4a";
const MUTED = "#8a8a8a";
const LINE = "#e5e5e5";

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export type EmailCopy = {
  subject: string;
  /** The line an inbox shows after the subject. */
  preview: string;
  heading: string;
  paragraphs: string[];
  /** A short list under the paragraphs, for steps that read better apart. */
  bullets?: string[];
  cta: string;
  /** The last, quieter line: what to do if this email was not asked for. */
  footnote: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * A first name to greet, or nothing.
 *
 * It is whatever was typed into the sign-up form by somebody who has not yet
 * proved the address is theirs, so it is cut to one short word and escaped
 * before it goes anywhere near the HTML.
 */
function firstName(name: string | null): string | null {
  const word = name?.split(/\s+/)[0]?.replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, 40);
  return word || null;
}

export type RenderedEmail = { subject: string; html: string; text: string };

export function renderLayout(
  copy: EmailCopy & {
    /** Whoever the email greets. Untrusted: cut to a first name and escaped. */
    name: string | null;
    /** Where the button goes. */
    link: string;
  },
): RenderedEmail {
  const { link } = copy;
  const name = firstName(copy.name);
  const greeting = name ? `Hi ${name},` : "Hi,";
  const href = escapeHtml(link);

  const text = [
    greeting,
    ...copy.paragraphs,
    ...(copy.bullets?.length ? [copy.bullets.map((line) => `- ${line}`).join("\n")] : []),
    `${copy.cta}: ${link}`,
    copy.footnote,
    `The Growmerce team\n${SITE_ORIGIN}`,
  ].join("\n\n");

  const paragraph = (line: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:${BODY}">${escapeHtml(line)}</p>`;

  /* Empty when there is no list, so an email without one is exactly the markup
     it was before lists existed. */
  const bullets = copy.bullets?.length
    ? `\n<ul style="margin:0 0 16px;padding:0 0 0 22px;font-size:16px;line-height:26px;color:${BODY}">\n${copy.bullets
        .map((line) => `<li style="margin:0 0 6px">${escapeHtml(line)}</li>`)
        .join("\n")}\n</ul>`
    : "";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CREAM}">${escapeHtml(copy.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM}">
<tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
<tr><td style="padding:0 8px 24px">
<a href="${SITE_ORIGIN}" style="text-decoration:none"><img src="${LOGO_URL}" width="167" height="32" alt="Growmerce" style="display:block;border:0;height:32px;width:167px"></a>
</td></tr>
<tr><td style="background:#ffffff;border:1px solid ${LINE};border-radius:16px;padding:40px 36px;font-family:${FONT}">
<h1 style="margin:0 0 20px;font-size:24px;line-height:32px;font-weight:700;letter-spacing:-0.01em;color:${CHARCOAL}">${escapeHtml(copy.heading)}</h1>
${paragraph(greeting)}
${copy.paragraphs.map(paragraph).join("\n")}${bullets}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0">
<tr><td bgcolor="${BRAND}" style="border-radius:999px">
<a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${escapeHtml(copy.cta)}</a>
</td></tr>
</table>
<p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${MUTED}">If the button does not work, copy this link into your browser:</p>
<p style="margin:0;font-size:13px;line-height:20px;word-break:break-all"><a href="${href}" style="color:${BRAND}">${href}</a></p>
<hr style="border:none;border-top:1px solid ${LINE};margin:28px 0 20px">
<p style="margin:0;font-size:13px;line-height:20px;color:${MUTED}">${escapeHtml(copy.footnote)}</p>
</td></tr>
<tr><td style="padding:24px 8px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${MUTED}">
The Growmerce team &middot; <a href="${SITE_ORIGIN}" style="color:${MUTED}">growmerce.ai</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: copy.subject, html, text };
}
