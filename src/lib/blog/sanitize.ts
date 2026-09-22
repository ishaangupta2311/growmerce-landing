import "server-only";

import sanitizeHtml from "sanitize-html";

/**
 * The allowlist for post HTML.
 *
 * Post content is rendered with `dangerouslySetInnerHTML`, so this is the
 * line between "an admin wrote a post" and "someone ran script on every
 * reader". It runs when a post is saved and again when it is rendered: the
 * second pass costs a millisecond and means a row edited directly in the
 * database still cannot inject anything.
 *
 * Everything the editor can produce is allowed; nothing else is. No inline
 * event handlers, no `style` beyond alignment and table widths, no iframes,
 * no `javascript:` or `data:` URLs, no protocol-relative URLs.
 */

const ALIGN = [/^(left|right|center|justify)$/];
const PIXELS = [/^\d{1,5}(\.\d+)?px$/];
const ALIGNABLE = ["p", "h2", "h3", "h4"];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...ALIGNABLE,
    "br",
    "hr",
    "strong",
    "em",
    "u",
    "s",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "table",
    "colgroup",
    "col",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "sub",
    "sup",
    "mark",
  ],
  allowedAttributes: {
    ...Object.fromEntries(ALIGNABLE.map((tag) => [tag, ["style"]])),
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    table: ["style"],
    col: ["style", "span"],
    th: ["colspan", "rowspan", "colwidth", "style"],
    td: ["colspan", "rowspan", "colwidth", "style"],
    ol: ["start", "type"],
    code: ["class"],
    pre: ["class"],
  },
  allowedStyles: {
    "*": { "text-align": ALIGN },
    table: { "min-width": PIXELS, width: PIXELS },
    col: { "min-width": PIXELS, width: PIXELS },
  },
  allowedClasses: {
    code: ["language-*"],
    pre: ["language-*"],
  },
  allowedSchemes: ["https", "http", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https", "http"] },
  allowedSchemesAppliedToAttributes: ["href", "src"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    /* The page title is the only h1; a pasted h1 becomes a section heading. */
    h1: "h2",
    h5: "h4",
    h6: "h4",
    b: "strong",
    i: "em",
    strike: "s",
    del: "s",
    a: (tagName, attribs) => {
      const next = { ...attribs };
      if (next.target === "_blank") next.rel = "noopener noreferrer";
      else delete next.target;
      return { tagName, attribs: next };
    },
  },
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
};

export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

/** Plain text of some HTML, for word counts and fallback excerpts. */
export function htmlToText(html: string): string {
  /* Block boundaries become spaces first, or "<p>end</p><p>Start" reads as
     one word "endStart". */
  const spaced = html.replace(/<\/(p|h[1-6]|li|blockquote|pre|td|th|tr)>|<br\s*\/?>/gi, " ");
  return sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
