/**
 * An end-to-end check of the affiliate ledger, against the real database.
 *
 *   npm run smoke:affiliate
 *
 * The flags in that script are both load-bearing. `--env-file` reads
 * DATABASE_URL, which Next.js would supply but tsx does not. `--conditions`
 * picks the `react-server` entry of the `server-only` package: its default
 * entry throws on import, which is exactly what it is for, and this script is
 * server code borrowing server modules rather than a client sneaking in.
 *
 * It creates two scratch partners — one agency, one influencer — feeds the
 * ingest the events the Growsearch app will send, and asserts that the money
 * comes out right. Everything it makes is prefixed `smoke-` and deleted again
 * at the end, including on failure.
 *
 * Why this exists rather than a unit test of `applyCharge`: the rules in
 * `commission.ts` are pure and easy to be confident about. What is *not* easy
 * to be confident about is whether the constraints, the transaction and the
 * event log actually enforce them — whether replaying a charge really is a
 * no-op, whether the partial unique index really does stop an influencer being
 * paid twice. Those only fail against Postgres, so the check has to run there.
 *
 * Requires `DATABASE_URL` and the `affiliate` schema from
 * `migrations/0002_affiliate.sql`. It writes to the live database, so it is a
 * developer tool and not something to point at production casually — though it
 * touches nothing outside the rows it creates.
 */

import { randomUUID } from "node:crypto";

import { db } from "../src/lib/db";
import {
  amountsDue,
  recordPayout,
  replaySkippedCharges,
  setCommissionRate,
  setPartnerStatus,
} from "../src/lib/affiliate/admin-store";
import { clearMaturedCommissions, ingest, parseEvent } from "../src/lib/affiliate/ingest";
import {
  commissionCountFor,
  commissionsFor,
  createPartner,
  payoutsFor,
  referralCountFor,
  referralsFor,
  totalsFor,
} from "../src/lib/affiliate/store";

const sql = db();
if (!sql) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

/** Unique per run, so two people can run this at once without colliding. */
const RUN = randomUUID().slice(0, 8);
const AGENCY_CODE = `SMOKEAG${RUN.slice(0, 4)}`.toUpperCase();
const CREATOR_CODE = `SMOKEIN${RUN.slice(0, 4)}`.toUpperCase();
const HELD_CODE = `SMOKEHD${RUN.slice(0, 4)}`.toUpperCase();
const AGENCY_SHOP = `smoke-agency-${RUN}.myshopify.com`;
const CREATOR_SHOP = `smoke-creator-${RUN}.myshopify.com`;
const HELD_SHOP = `smoke-held-${RUN}.myshopify.com`;
const REFUND_CODE = `SMOKERF${RUN.slice(0, 4)}`.toUpperCase();
const CHURN_CODE = `SMOKECH${RUN.slice(0, 4)}`.toUpperCase();
const REFUND_SHOP = `smoke-refund-${RUN}.myshopify.com`;
const CHURN_SHOP = `smoke-churn-${RUN}.myshopify.com`;
const ORDER_CODE = `SMOKEOD${RUN.slice(0, 4)}`.toUpperCase();
const ORDER_SHOP = `smoke-order-${RUN}.myshopify.com`;

let failures = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? "  ok  " : "  FAIL"}  ${label}`);
  if (!ok) console.log(`        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

/** One event, with a fresh id unless we are deliberately testing a replay. */
async function send(event: Record<string, unknown>, id = randomUUID()) {
  return ingest(parseEvent({ id, ...event }));
}

const userIds: string[] = [];

async function makePartner(
  kind: "agency" | "influencer",
  code: string,
  rateBps: number,
  status: "pending" | "approved" = "approved",
) {
  /* The partner table has a foreign key to Supabase's own `auth.users`, so a
     scratch partner needs a scratch login to hang off. Inserted directly
     because the alternative is driving the sign-up API from a script. */
  const userId = randomUUID();
  userIds.push(userId);
  await sql!`
    insert into auth.users (id, email, instance_id, aud, role)
    values (${userId}, ${`smoke-${RUN}-${code}@example.invalid`},
            '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  `;

  const [partner] = await sql!<{ id: string }[]>`
    insert into affiliate.partner
      (user_id, kind, name, company, email, status, commission_rate_bps, approved_at)
    values (${userId}, ${kind}, ${`Smoke ${kind}`}, ${`Smoke ${code} Co`},
            ${`smoke-${RUN}-${code}@example.invalid`}, ${status}, ${rateBps},
            ${status === "approved" ? new Date() : null})
    returning id
  `;
  await sql!`
    insert into affiliate.code (partner_id, code, label) values (${Number(partner.id)}, ${code}, 'smoke')
  `;
  return Number(partner.id);
}

async function cleanup() {
  /* Partners cascade to codes, referrals, commissions and payouts; deleting the
     auth user cascades to the partner. Events have no owner, so they go by the
     shops they name. */
  await sql!`
    delete from affiliate.event
    where shop in (${AGENCY_SHOP}, ${CREATOR_SHOP}, ${HELD_SHOP}, ${REFUND_SHOP}, ${CHURN_SHOP},
                   ${ORDER_SHOP})
  `;
  if (userIds.length > 0) await sql!`delete from auth.users where id in ${sql!(userIds)}`;
}

async function main() {
  console.log(`affiliate smoke — run ${RUN}\n`);

  const agencyId = await makePartner("agency", AGENCY_CODE, 2000);
  const creatorId = await makePartner("influencer", CREATOR_CODE, 3000);

  console.log("attribution");
  check(
    "an unknown code is ignored rather than applied",
    (await send({ type: "referral.linked", shop: AGENCY_SHOP, code: "NOSUCHCODE" })).detail,
    "unknown_code",
  );
  check(
    "a known code attributes the store",
    (await send({ type: "referral.linked", shop: AGENCY_SHOP, code: AGENCY_CODE, shopName: "Smoke Agency Co" })).status,
    "applied",
  );
  check(
    "a second code cannot take a store that already belongs to someone",
    (await send({ type: "referral.linked", shop: AGENCY_SHOP, code: CREATOR_CODE })).detail,
    "shop_already_referred",
  );

  const replayId = randomUUID();
  await send({ type: "referral.linked", shop: CREATOR_SHOP, code: CREATOR_CODE }, replayId);
  check(
    "replaying an event id is a no-op",
    (await send({ type: "referral.linked", shop: CREATOR_SHOP, code: CREATOR_CODE }, replayId)).status,
    "duplicate",
  );

  console.log("\nthe agency rule — every charge, every month");
  await send({
    type: "charge.succeeded", shop: AGENCY_SHOP, chargeId: `smoke-${RUN}-a1`,
    amountCents: 4900, currency: "USD",
  });
  check(
    "the event log holds the payload as an object Postgres can read into",
    (await sql!<{ t: string; cid: string | null }[]>`
      select jsonb_typeof(payload) as t, payload->>'chargeId' as cid
      from affiliate.event
      where shop = ${AGENCY_SHOP} and type = 'charge.succeeded'
      order by received_at limit 1
    `)[0],
    { t: "object", cid: `smoke-${RUN}-a1` },
  );
  await send({
    type: "charge.succeeded", shop: AGENCY_SHOP, chargeId: `smoke-${RUN}-a2`,
    amountCents: 4900, currency: "USD",
  });
  const agencyLedger = await commissionsFor(agencyId);
  check("two charges produce two commissions", agencyLedger.length, 2);
  check("each is 20% of $49.00", agencyLedger.map((c) => c.amountCents), [980, 980]);
  check("both are recurring", agencyLedger.map((c) => c.kind), ["recurring", "recurring"]);

  check(
    "the same charge under a new event id is not paid twice",
    (await send({
      type: "charge.succeeded", shop: AGENCY_SHOP, chargeId: `smoke-${RUN}-a1`,
      amountCents: 4900, currency: "USD",
    })).detail,
    "charge_already_credited",
  );

  console.log("\nthe influencer rule — the first charge only");
  await send({
    type: "charge.succeeded", shop: CREATOR_SHOP, chargeId: `smoke-${RUN}-c1`,
    amountCents: 4900, currency: "USD",
  });
  check(
    "the second month earns nothing",
    (await send({
      type: "charge.succeeded", shop: CREATOR_SHOP, chargeId: `smoke-${RUN}-c2`,
      amountCents: 4900, currency: "USD",
    })).detail,
    "already_paid_once",
  );
  const creatorLedger = await commissionsFor(creatorId);
  check("exactly one commission", creatorLedger.length, 1);
  check("worth 30% of the first charge", creatorLedger[0]?.amountCents, 1470);
  check("recorded as one-time", creatorLedger[0]?.kind, "one_time");

  console.log("\nrefunds");
  await send({ type: "charge.refunded", shop: AGENCY_SHOP, chargeId: `smoke-${RUN}-a2` });
  const afterRefund = await commissionsFor(agencyId);
  check(
    "the reversed row is kept, not deleted",
    afterRefund.filter((c) => c.status === "reversed").length,
    1,
  );
  const agencyTotals = await totalsFor(agencyId);
  check("a reversal leaves the balance the other charge earned", agencyTotals[0]?.lifetimeCents, 980);

  console.log("\nthe dashboard's view");
  const referrals = await referralsFor(agencyId, "USD");
  check("the store is listed once", referrals.length, 1);
  check("its name came through the event", referrals[0]?.shopName, "Smoke Agency Co");
  check("a charge marks it subscribed without a separate event", referrals[0]?.status, "active");
  check("earnings shown are net of the reversal", referrals[0]?.earnedCents, 980);

  console.log("\nthe admin side — approving, replaying, paying");

  /* A partner still in the queue. Their store pays us before anybody gets
     round to the application, which is the case that used to lose money
     silently: `applyCharge` refuses outright and only the event log remembers. */
  const heldId = await makePartner("agency", HELD_CODE, 2000, "pending");
  await send({ type: "referral.linked", shop: HELD_SHOP, code: HELD_CODE });
  check(
    "a charge for an unapproved partner earns nothing",
    (await send({
      type: "charge.succeeded", shop: HELD_SHOP, chargeId: `smoke-${RUN}-h1`,
      amountCents: 9900, currency: "USD",
    })).detail,
    "partner_not_approved",
  );
  check("and writes no commission", (await commissionsFor(heldId)).length, 0);

  await setPartnerStatus(heldId, "approved");
  check("approving replays the held charge", await replaySkippedCharges(heldId), {
    replayed: 1,
    earned: 1,
  });
  check("which is now worth 20% of $99.00", (await commissionsFor(heldId))[0]?.amountCents, 1980);
  check(
    "replaying again pays nothing more",
    (await replaySkippedCharges(heldId)).earned,
    0,
  );

  /* Age the commission past the refund window and run the same sweep the cron
     runs, so there is something genuinely owed to pay. Scoped to this partner:
     the global sweep would also approve any real commission that had matured,
     on a database this script shares with the real program. */
  await sql!`
    update affiliate.commission set created_at = now() - interval '40 days'
    where partner_id = ${heldId} and status = 'pending'
  `;
  await clearMaturedCommissions({ partnerId: heldId });

  const due = (await amountsDue()).find((row) => row.partnerId === heldId);
  check("it shows up as owed", due?.owedCents, 1980);
  check("as one commission", due?.commissionCount, 1);

  check(
    "a payout for a figure that has moved is refused",
    (await recordPayout({
      partnerId: heldId, currency: "USD", method: "bank",
      reference: null, note: null, expectedCents: 1234,
    })),
    { ok: false, reason: "amount_moved", actualCents: 1980 },
  );

  const paid = await recordPayout({
    partnerId: heldId, currency: "USD", method: "bank",
    reference: `SMOKE-${RUN}`, note: null, expectedCents: 1980,
  });
  check("a payout for the real figure settles it", paid.ok && paid.amountCents, 1980);
  check("covering one commission", paid.ok && paid.commissionCount, 1);
  check("recorded against the partner", (await payoutsFor(heldId)).length, 1);
  check(
    "the same payout cannot be recorded twice",
    await recordPayout({
      partnerId: heldId, currency: "USD", method: "bank",
      reference: null, note: null, expectedCents: 1980,
    }),
    { ok: false, reason: "nothing_owed" },
  );

  const settled = await commissionsFor(heldId);
  check("the commission is now paid", settled[0]?.status, "paid");
  check("and counts as paid, not owed", (await totalsFor(heldId))[0]?.approvedCents, 0);

  await setCommissionRate(heldId, 1000);
  check(
    "changing the rate does not rewrite what was already earned",
    (await commissionsFor(heldId))[0]?.rateBps,
    2000,
  );

  console.log("\ncancellation");
  await send({ type: "subscription.cancelled", shop: AGENCY_SHOP });
  check(
    "a charge after cancellation earns nothing",
    (await send({
      type: "charge.succeeded", shop: AGENCY_SHOP, chargeId: `smoke-${RUN}-a3`,
      amountCents: 4900, currency: "USD",
    })).detail,
    "referral_cancelled",
  );

  /* Both of the following are ledger defects found in review, kept as checks
     because each pays real money out on a path that looks correct from every
     screen in the admin. */

  console.log("\na charge refunded before the application was approved");

  /* The sequence: the store pays while the partner is still in the queue, so
     no commission is written; the charge is then refunded, and the refund
     finds no commission to reverse. Only `affiliate.event` knows either thing
     happened. Approving the partner replays the payment — and used to pay
     commission on money we had already given back. */
  const refundId = await makePartner("agency", REFUND_CODE, 2000, "pending");
  await send({ type: "referral.linked", shop: REFUND_SHOP, code: REFUND_CODE });
  await send({
    type: "charge.succeeded", shop: REFUND_SHOP, chargeId: `smoke-${RUN}-r1`,
    amountCents: 9900, currency: "USD",
  });
  check(
    "the refund finds no commission to reverse",
    (await send({ type: "charge.refunded", shop: REFUND_SHOP, chargeId: `smoke-${RUN}-r1` })).detail,
    "no_commission_for_charge",
  );

  await setPartnerStatus(refundId, "approved");
  check("approving replays the charge but it earns nothing", await replaySkippedCharges(refundId), {
    replayed: 1,
    earned: 0,
  });
  check("and no commission exists for refunded money", (await commissionsFor(refundId)).length, 0);

  console.log("\na store that cancels before the application is approved");

  /* The mirror image, and the more expensive way round: the payment was good
     when it was taken and the partner earned it. The store churning later does
     not unearn it, but approval used to judge the old charge against the
     store's status today, reject it, and mark the event replayed — so the
     money left the recovery queue without ever being paid. */
  const churnId = await makePartner("agency", CHURN_CODE, 2000, "pending");
  await send({ type: "referral.linked", shop: CHURN_SHOP, code: CHURN_CODE });
  await send({
    type: "charge.succeeded", shop: CHURN_SHOP, chargeId: `smoke-${RUN}-x1`,
    amountCents: 9900, currency: "USD",
  });

  /* Deliberately sent without `occurredAt`, then aged here: senders are not
     required to supply one, and this is what proves the replay falls back to
     when we received the event rather than treating a ten-day-old charge as
     though it were collected after the cancellation below. */
  await sql!`
    update affiliate.event set received_at = now() - interval '10 days'
    where shop = ${CHURN_SHOP} and type = 'charge.succeeded'
  `;

  await send({ type: "subscription.cancelled", shop: CHURN_SHOP });
  await setPartnerStatus(churnId, "approved");
  check("approving still pays the charge the store made while subscribed", await replaySkippedCharges(churnId), {
    replayed: 1,
    earned: 1,
  });
  check("worth 20% of $99.00", (await commissionsFor(churnId))[0]?.amountCents, 1980);
  check("and the store stays cancelled", (await referralsFor(churnId, "USD"))[0]?.status, "cancelled");
  check(
    "while a charge taken after the cancellation still earns nothing",
    (await send({
      type: "charge.succeeded", shop: CHURN_SHOP, chargeId: `smoke-${RUN}-x2`,
      amountCents: 4900, currency: "USD",
    })).detail,
    "referral_cancelled",
  );

  console.log("\nheld charges replayed in the order the charges were taken");

  /* The queue is drained by the charge's own date, not by the order the app
     got round to telling us about it. It decides real money for exactly one
     partner kind: an influencer earns a single one-time fee, priced off
     whichever held charge is replayed first. A store that paid $49.00 in
     January and $99.00 in March, delivered the wrong way round, used to earn
     30% of March. */
  const orderId = await makePartner("influencer", ORDER_CODE, 3000, "pending");
  await send({ type: "referral.linked", shop: ORDER_SHOP, code: ORDER_CODE });
  check(
    "March's $99.00 is held, and is delivered first",
    (await send({
      type: "charge.succeeded", shop: ORDER_SHOP, chargeId: `smoke-${RUN}-o2`,
      amountCents: 9900, currency: "USD", occurredAt: "2026-03-09T10:00:00.000Z",
    })).detail,
    "partner_not_approved",
  );
  check(
    "January's $49.00 is held too, and is delivered second",
    (await send({
      type: "charge.succeeded", shop: ORDER_SHOP, chargeId: `smoke-${RUN}-o1`,
      amountCents: 4900, currency: "USD", occurredAt: "2026-01-09T10:00:00.000Z",
    })).detail,
    "partner_not_approved",
  );

  await setPartnerStatus(orderId, "approved");
  check("approving replays both held charges", await replaySkippedCharges(orderId), {
    replayed: 2,
    earned: 1,
  });
  const orderLedger = await commissionsFor(orderId);
  check("an influencer still earns once", orderLedger.length, 1);
  check(
    "worth 30% of January's charge, not of the one that arrived first",
    orderLedger[0]?.amountCents,
    1470,
  );

  console.log("\nsign-up");

  /* The one transaction nothing above reaches: the partners in this file are
     inserted directly. `createPartner` is what the sign-up form calls, and it
     writes the account and its first code together or not at all. */
  const signupUser = randomUUID();
  userIds.push(signupUser);
  await sql!`
    insert into auth.users (id, email, instance_id, aud, role)
    values (${signupUser}, ${`smoke-${RUN}-signup@example.invalid`},
            '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated')
  `;
  const created = await createPartner({
    userId: signupUser, kind: "influencer", name: "Smoke Signup",
    company: `Smoke Signup ${RUN}`, email: `smoke-${RUN}-signup@example.invalid`, website: null,
  });
  check("creates the partner as pending", created.status, "pending");
  check("at the influencer rate", created.commissionRateBps, 3000);
  check(
    "with exactly one code",
    (await sql!<{ n: number }[]>`select count(*)::int as n from affiliate.code where partner_id = ${created.id}`)[0].n,
    1,
  );

  console.log("\npaging");

  /* The agency has two commission rows by now — one live, one reversed — and
     one store. The counts are what the dashboard's page numbers come from, and
     a page of one is the smallest thing that proves `offset` actually moves. */
  const all = await commissionsFor(agencyId);
  check("the count includes reversed rows", await commissionCountFor(agencyId), all.length);
  check("and there are two of them", all.length, 2);
  const [first] = await commissionsFor(agencyId, 1, 0);
  const [second] = await commissionsFor(agencyId, 1, 1);
  check("a page of one, then the next, walks the same order", [first?.id, second?.id], all.map((c) => c.id));
  check("stores are counted the same way", await referralCountFor(agencyId), 1);
}

/* Wrapped rather than awaited at the top level: tsx compiles these scripts to
   CommonJS, which has no top-level await. */
async function run() {
  try {
    await main();
  } catch (err) {
    failures++;
    console.error("\nthrew:", err);
  } finally {
    await cleanup();
    await sql!.end();
  }

  console.log(failures === 0 ? "\nall checks passed" : `\n${failures} check(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

void run();
