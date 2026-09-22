-- affiliate.event.payload was written double-encoded.
--
-- `ingest` bound the payload as `${JSON.stringify(event)}::jsonb`. postgres.js
-- sees a string bound to a jsonb parameter and JSON-encodes it again, so what
-- reached the column was a jsonb *string* holding the object's text, and
-- `payload->>'chargeId'` was null on every row. Nothing that read the column
-- through `json()` noticed, because that helper parsed the string back; the
-- first thing to ask Postgres for a key directly was the check that stops a
-- refunded charge being paid on approval, and it found nothing.
--
-- Unwrap the rows written that way, then make the shape a rule. Both
-- statements are re-runnable: the update matches nothing the second time, and
-- the constraint is dropped before it is added.

update affiliate.event
   set payload = (payload #>> '{}')::jsonb
 where jsonb_typeof(payload) = 'string';

alter table affiliate.event drop constraint if exists event_payload_is_object;
alter table affiliate.event add constraint event_payload_is_object
  check (jsonb_typeof(payload) = 'object');
