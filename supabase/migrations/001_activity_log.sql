-- ============================================================================
-- Migration 001 — Activity log (audit trail: who did what)
-- Run this ONCE in the Supabase SQL Editor on an existing project.
-- (Fresh installs already get this table from schema.sql.)
-- ============================================================================

create table if not exists activity_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references app_users(id) on delete set null,
  actor_name text not null,
  office_id  text references offices(id),
  action     text not null,   -- create | update | approve | delete | leave
  entity     text not null,   -- beneficiary | report | office_report | card
  entity_id  text,
  summary    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_created on activity_log(created_at desc);
create index if not exists idx_activity_office  on activity_log(office_id);

alter table activity_log enable row level security;

-- Everyone signed in can read the log; a user can only write entries as themselves.
drop policy if exists read_activity on activity_log;
create policy read_activity on activity_log
  for select using (auth.uid() is not null);

drop policy if exists insert_activity on activity_log;
create policy insert_activity on activity_log
  for insert with check (actor_id = auth.uid());
