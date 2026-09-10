-- The agency name or channel is required.
--
-- It was optional in 0002, and that was wrong. `company` is the only field
-- that says what a partner *is*: which agency an approval covers, which
-- channel a creator brings an audience from. Approving an application without
-- it means approving a name and an email address, and a payout made out to
-- "Priya Raman" with no idea which studio she is is a support ticket waiting
-- to happen.
--
-- Not null rather than merely required in the form, because the form is one of
-- three ways a row gets written and the only one a person sees.
--
-- Safe to re-run.

-- Anything already null takes the partner's own name — a sole trader's agency
-- name genuinely is their name, and it is what the dashboard header fell back
-- to displaying anyway. There is nothing better to invent here, and the
-- alternative is a migration that refuses to run.
update affiliate.partner
  set company = name
  where company is null or btrim(company) = '';

alter table affiliate.partner alter column company set not null;

-- `not null` alone would accept a single space, which is what an empty input
-- becomes on the way through a form that only checks for `null`.
alter table affiliate.partner drop constraint if exists partner_company_not_blank;
alter table affiliate.partner add constraint partner_company_not_blank
  check (btrim(company) <> '');
