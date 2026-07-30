-- ============================================================================
-- Migration 002 — Approval queue + editor write hardening
-- Run ONCE in the Supabase SQL Editor on the existing project.
--
-- Effect: editors can NO LONGER change approved data directly. Everything an
-- editor does (edit / leave / report / card) becomes a pending change request
-- that an office admin (or super admin) approves before it takes effect.
-- Editors may still freely edit a beneficiary while it is still `pending`.
-- ============================================================================

-- 1) Change-requests table --------------------------------------------------
create table if not exists change_requests (
  id                uuid primary key default gen_random_uuid(),
  office_id         text not null references offices(id),
  beneficiary_id    uuid references beneficiaries(id) on delete cascade,
  kind              text not null,          -- update | leave | report | card_add | card_remove
  payload           jsonb not null default '{}',
  summary           text not null,
  status            text not null default 'pending',   -- pending | approved | rejected
  requested_by      uuid references app_users(id),
  requested_by_name text,
  created_at        timestamptz not null default now(),
  reviewed_by       uuid references app_users(id),
  reviewed_at       timestamptz
);
create index if not exists idx_changes_office on change_requests(office_id);
create index if not exists idx_changes_status on change_requests(status);

alter table change_requests enable row level security;

drop policy if exists read_changes   on change_requests;
drop policy if exists insert_changes on change_requests;
drop policy if exists review_changes on change_requests;

create policy read_changes on change_requests
  for select using (auth.uid() is not null);

-- Any office member can create a request for their office, as themselves.
create policy insert_changes on change_requests
  for insert with check (can_edit_office(office_id) and requested_by = auth.uid());

-- Only an office admin (or super admin) can approve/reject.
create policy review_changes on change_requests
  for update using (can_approve_office(office_id))
  with check (can_approve_office(office_id));

-- 2) Beneficiaries: editors may only insert/edit PENDING rows ---------------
drop policy if exists insert_beneficiaries on beneficiaries;
create policy insert_beneficiaries on beneficiaries
  for insert with check (
    can_edit_office(office_id)
    and (can_approve_office(office_id) or approval_status = 'pending')
  );

drop policy if exists update_beneficiaries on beneficiaries;
create policy update_beneficiaries on beneficiaries
  for update
  using (
    can_approve_office(office_id)
    or (can_edit_office(office_id) and approval_status = 'pending')
  )
  with check (
    can_approve_office(office_id)
    or (can_edit_office(office_id) and approval_status = 'pending')
  );

-- Deleting beneficiaries stays admin-only.
drop policy if exists delete_beneficiaries on beneficiaries;
create policy delete_beneficiaries on beneficiaries
  for delete using (can_approve_office(office_id));

-- 3) Reports / cards / leaving: direct writes are ADMIN-ONLY ----------------
--    (editors' additions go through change_requests, applied by an admin)
drop policy if exists write_reports on progress_reports;
create policy write_reports on progress_reports for all
  using (can_approve_office((select office_id from beneficiaries b where b.id = beneficiary_id)))
  with check (can_approve_office((select office_id from beneficiaries b where b.id = beneficiary_id)));

drop policy if exists write_cards on seasonal_cards;
create policy write_cards on seasonal_cards for all
  using (can_approve_office((select office_id from beneficiaries b where b.id = beneficiary_id)))
  with check (can_approve_office((select office_id from beneficiaries b where b.id = beneficiary_id)));

drop policy if exists write_leaving on leaving_records;
create policy write_leaving on leaving_records for all
  using (can_approve_office((select office_id from beneficiaries b where b.id = beneficiary_id)))
  with check (can_approve_office((select office_id from beneficiaries b where b.id = beneficiary_id)));

-- 4) Office (annual) reports: admin-only upload/delete ----------------------
drop policy if exists write_office_reports on office_reports;
create policy write_office_reports on office_reports for all
  using (can_approve_office(office_id))
  with check (can_approve_office(office_id));
