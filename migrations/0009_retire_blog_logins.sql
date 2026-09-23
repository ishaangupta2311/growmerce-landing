-- The blog admin's own login, retired. See 0008 for why.
--
-- APPLY ONLY AFTER the code that signs admins in through Supabase is deployed.
-- Before then the running site still reads these for /admin/login, and this
-- file would take that page down underneath it.
--
-- What goes: server-side sessions, the login throttle, and the password hashes
-- — all three existed only to support a password this application checked
-- itself, and nothing checks one any more. What stays: every admin_user row,
-- because posts and media point at them for "created by", and the name, which
-- is the admin's display name and the default for their byline.
--
-- Re-runnable: every statement is guarded.

drop table if exists blog.session;
drop table if exists blog.login_attempt;
alter table blog.admin_user drop column if exists password_hash;
alter table blog.admin_user drop column if exists last_login_at;
