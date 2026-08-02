-- ============================================================================
-- Migration 003 — Per-office beneficiary codes
-- Run ONCE in the Supabase SQL Editor.
--
-- Each office gets its own sequence and a prefix, so a code tells you the office
-- at a glance:  Cairo → CAI-0001, CAI-0002…   Minya → MIN-0001, MIN-0002…
-- The number is assigned by the DATABASE on insert, so it stays unique even if
-- several editors add beneficiaries offline at the same time.
--
-- NOTE: this also RE-CODES existing beneficiaries into the new per-office scheme
-- (ordered by entry date). If you have already printed/shared old codes, remove
-- the "Re-code existing" block before running.
-- ============================================================================

-- 1) Office prefix
alter table offices add column if not exists code text;
update offices set code = 'CAI' where id = 'office-cairo' and (code is null or code = '');
update offices set code = 'MIN' where id = 'office-minya' and (code is null or code = '');

-- 2) Per-office counter (client can't touch it; the trigger updates it)
create table if not exists office_counters (
  office_id text primary key references offices(id),
  last_seq  int  not null default 0
);
alter table office_counters enable row level security;  -- no policies = clients denied

-- 3) Trigger: assign the next per-office number on every insert
create or replace function assign_beneficiary_number() returns trigger
language plpgsql security definer set search_path = public as $$
declare seq int; pfx text;
begin
  insert into office_counters(office_id, last_seq) values (new.office_id, 0)
    on conflict (office_id) do nothing;
  update office_counters set last_seq = last_seq + 1
    where office_id = new.office_id
    returning last_seq into seq;
  select coalesce(code, 'CLP') into pfx from offices where id = new.office_id;
  new.beneficiary_number := pfx || '-' || lpad(seq::text, 4, '0');
  return new;
end $$;

drop trigger if exists trg_assign_number on beneficiaries;
create trigger trg_assign_number
  before insert on beneficiaries
  for each row execute function assign_beneficiary_number();

-- 4) Re-code existing beneficiaries per office (ordered by entry date)
with ordered as (
  select id, office_id,
         row_number() over (partition by office_id order by created_at, beneficiary_number) as rn
  from beneficiaries
)
update beneficiaries b
set beneficiary_number =
      (select coalesce(o.code, 'CLP') from offices o where o.id = b.office_id)
      || '-' || lpad(ord.rn::text, 4, '0')
from ordered ord
where ord.id = b.id;

-- 5) Set each counter to the current count so new inserts continue the sequence
insert into office_counters (office_id, last_seq)
select office_id, count(*) from beneficiaries group by office_id
on conflict (office_id) do update set last_seq = excluded.last_seq;
