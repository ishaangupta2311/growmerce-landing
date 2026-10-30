/**
 * Self-contained checks for the release-announcements API's two pure parts:
 * the signature (src/lib/announcements/signature.ts) and the request bodies
 * (src/lib/announcements/contract.ts). No network, no database, no env.
 *
 *   npm run check:announcements
 *
 * The signing below is written out by hand, the way the Growsearch app's
 * script does it, rather than with `signAnnouncement`: a check that signs with
 * the function it is checking would agree with any bug in it.
 */

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { draftSchema, skipSchema, statusSchema } from "../src/lib/announcements/contract";
import { verifyAnnouncement } from "../src/lib/announcements/signature";

const SECRET = "a".repeat(64);
const PATH = "/api/announcements/draft";
const BODY = JSON.stringify({ hello: "wörld" });
const NOW = 1_800_000_000_000;

function appSignature(timestamp: number, path: string, body: string, secret = SECRET): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${path}.${body}`).digest("hex")}`;
}

function check(overrides: Partial<Parameters<typeof verifyAnnouncement>[0]> = {}) {
  return verifyAnnouncement({
    secret: SECRET,
    timestamp: String(NOW),
    signature: appSignature(NOW, PATH, BODY),
    path: PATH,
    rawBody: BODY,
    now: NOW,
    ...overrides,
  });
}

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test("a correctly signed request passes", () => assert.deepEqual(check(), { ok: true }));

test("upper-case hex passes", () =>
  assert.deepEqual(check({ signature: `sha256=${appSignature(NOW, PATH, BODY).slice("sha256=".length).toUpperCase()}` }), {
    ok: true,
  }));

test("4m59s either side passes", () => {
  assert.deepEqual(check({ now: NOW + 299_000 }), { ok: true });
  assert.deepEqual(check({ now: NOW - 299_000 }), { ok: true });
});

test("over 5 minutes old is stale", () => assert.deepEqual(check({ now: NOW + 300_001 }), { ok: false, reason: "stale" }));
test("over 5 minutes ahead is stale", () => assert.deepEqual(check({ now: NOW - 300_001 }), { ok: false, reason: "stale" }));

test("unset or short secret is not_configured", () => {
  assert.deepEqual(check({ secret: undefined }), { ok: false, reason: "not_configured" });
  assert.deepEqual(check({ secret: "  " }), { ok: false, reason: "not_configured" });
  assert.deepEqual(check({ secret: "short" }), { ok: false, reason: "not_configured" });
});

test("missing headers are missing", () => {
  assert.deepEqual(check({ timestamp: null }), { ok: false, reason: "missing" });
  assert.deepEqual(check({ signature: null }), { ok: false, reason: "missing" });
});

test("malformed headers are malformed", () => {
  assert.deepEqual(check({ timestamp: "12.5" }), { ok: false, reason: "malformed" });
  assert.deepEqual(check({ timestamp: "-1" }), { ok: false, reason: "malformed" });
  assert.deepEqual(check({ signature: appSignature(NOW, PATH, BODY).slice("sha256=".length) }), {
    ok: false,
    reason: "malformed",
  });
  assert.deepEqual(check({ signature: "sha256=zz" }), { ok: false, reason: "malformed" });
});

test("another body, path, timestamp or secret is a mismatch", () => {
  assert.deepEqual(check({ rawBody: `${BODY} ` }), { ok: false, reason: "mismatch" });
  assert.deepEqual(check({ path: "/api/announcements/skip" }), { ok: false, reason: "mismatch" });
  assert.deepEqual(check({ timestamp: String(NOW + 1) }), { ok: false, reason: "mismatch" });
  assert.deepEqual(check({ signature: appSignature(NOW, PATH, BODY, "b".repeat(64)) }), {
    ok: false,
    reason: "mismatch",
  });
});

const draft = {
  sinceRef: "v1.4.0",
  releaseRef: "v1.5.0",
  notes: ["2026-10-20-search-analytics.md"],
  blog: { title: "Search analytics", excerpt: "See what shoppers look for.", html: "<p>Hi</p>", seoDescription: "" },
  email: {
    subject: "New in Growsearch",
    ctaLabel: "",
    announcement: { title: "New", intro: "Hi {{shop_name}}, there is more." },
  },
};

test("a full draft body parses", () => assert.equal(draftSchema.safeParse(draft).success, true));
test("a first-ever draft (sinceRef null) parses", () =>
  assert.equal(draftSchema.safeParse({ ...draft, sinceRef: null }).success, true));
test("a draft without a release or title is refused", () => {
  assert.equal(draftSchema.safeParse({ ...draft, releaseRef: "" }).success, false);
  assert.equal(draftSchema.safeParse({ ...draft, blog: { ...draft.blog, title: " " } }).success, false);
  assert.equal(draftSchema.safeParse({ ...draft, email: undefined }).success, false);
});
test("a draft can use a post already on the blog instead of writing one", () => {
  const withoutBlog = { ...draft, blog: undefined };
  assert.equal(draftSchema.safeParse({ ...withoutBlog, postSlug: "already-live" }).success, true);
  assert.equal(draftSchema.safeParse(withoutBlog).success, false);
  assert.equal(draftSchema.safeParse({ ...draft, postSlug: "already-live" }).success, false);
});
test("an email's picture must be one the layout has", () => {
  const email = (visual: string) => ({
    ...draft,
    email: { ...draft.email, announcement: { ...draft.email.announcement, sections: [{ visual }] } },
  });
  assert.equal(draftSchema.safeParse(email("placements")).success, true);
  assert.equal(draftSchema.safeParse(email("video")).success, false);
});
test("a skip body parses", () =>
  assert.equal(skipSchema.safeParse({ sinceRef: null, releaseRef: "v1.5.1", notes: [], reason: "internal only" }).success, true));
test("status takes {} and nothing else", () => {
  assert.equal(statusSchema.safeParse({}).success, true);
  assert.equal(statusSchema.safeParse({ extra: 1 }).success, false);
});

console.log(`\n${passed} checks passed`);
