-- The contact page became a lead form: it now asks for a company and a phone
-- number, no longer asks for a store, and the message became an optional
-- "any growth challenge".
--
-- Older rows have no company or phone, so both columns stay nullable here and
-- the API is what requires them on new submissions. `store` is kept for those
-- older rows.

alter table marketing.contact_submission add column if not exists company text;
alter table marketing.contact_submission add column if not exists phone   text;
alter table marketing.contact_submission alter column message drop not null;
