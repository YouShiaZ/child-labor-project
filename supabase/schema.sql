-- ============================================================================
-- Child Labor Project — Supabase schema (Phase 2 backend)
-- ============================================================================
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- It creates the tables, row-level-security (RLS) policies that mirror the
-- frontend permission rules, and the storage buckets for photos/cards/reports.
--
-- Roles (stored on app_users.role):
--   super_admin  — both offices, manages accounts, edits everything
--   office_admin — one office: full edit + approves forms
--   editor       — one office: create/edit (records start pending)
--   viewer       — read-only everywhere; can download files
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Enums ----------------------------------------------------------------------
do $$ begin
  create type user_role       as enum ('super_admin','office_admin','editor','viewer');
  create type beneficiary_status as enum ('entry','priority','sponsored','leaving');
  create type approval_status  as enum ('pending','approved');
  create type gender_t         as enum ('male','female');
  create type health_t         as enum ('good','average','poor');
  create type report_type_t    as enum ('quarterly','semi_annual','annual');
  create type season_t         as enum ('christmas','easter');
  create type office_report_file_t as enum ('word','pdf');
  create type leaving_reason_t as enum ('change_of_residence','death','joined_another_project','improved_living_standard');
exception when duplicate_object then null; end $$;

-- ============================================================================
-- Tables
-- ============================================================================

create table if not exists offices (
  id          text primary key,          -- 'office-cairo', 'office-minya'
  name        text not null,
  city        text not null,
  governorate text not null,
  created_at  timestamptz not null default now()
);

-- App users mirror auth.users (1:1). id = auth.users.id.
create table if not exists app_users (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  email      text not null unique,
  role       user_role not null default 'viewer',
  office_id  text references offices(id),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id           text primary key,
  project_name text not null,
  country_name text not null,
  responsible_project_manager         text,
  responsible_sponsorship_officer_io  text,
  responsible_country_director        text,
  created_at   timestamptz not null default now()
);

create table if not exists beneficiaries (
  id                 uuid primary key default gen_random_uuid(),
  project_id         text references projects(id),
  office_id          text not null references offices(id),
  beneficiary_number text not null unique,
  status             beneficiary_status not null default 'entry',

  approval_status    approval_status not null default 'pending',
  submitted_by       uuid references app_users(id),
  approved_by        uuid references app_users(id),
  approved_at        date,

  -- General
  first_name    text not null,
  last_name     text not null,
  date_of_birth date not null,
  gender        gender_t not null default 'male',
  photo_url     text,
  language      text default 'Arabic',
  village       text,

  -- Health
  health_situation health_t not null default 'good',

  -- Social
  hobbies        text[] not null default '{}',
  favorite_color text,
  character      text[] not null default '{}',

  -- Family
  parents_alive          text not null default 'both',
  live_with_both_parents boolean not null default true,
  live_with              text not null default 'both',
  has_siblings           boolean not null default false,
  siblings_count         int,
  type_of_house          text not null default 'mud_brick',
  guardian_name          text,
  relation_to_child      text,

  -- Education
  school_name        text,
  school_level       text,
  school_performance text not null default 'good',
  favorite_subject   text,
  future_plans       text,

  -- Scholarship
  tuition_fees       numeric,
  amount_sponsored   numeric,
  additional_aid     text,
  scholarship_reason text,
  scholarship_impact text,

  created_at timestamptz not null default now()
);
create index if not exists idx_beneficiaries_office on beneficiaries(office_id);
create index if not exists idx_beneficiaries_status on beneficiaries(status);

-- Seasonal thank-you cards — full history kept (many per beneficiary).
create table if not exists seasonal_cards (
  id             uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references beneficiaries(id) on delete cascade,
  season         season_t not null,
  year           int not null,
  url            text not null,       -- image path/URL in the 'cards' bucket
  uploaded_at    date not null default current_date,
  created_at     timestamptz not null default now()
);
create index if not exists idx_cards_beneficiary on seasonal_cards(beneficiary_id);

create table if not exists progress_reports (
  id             uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references beneficiaries(id) on delete cascade,
  report_type    report_type_t not null,
  period         text not null,        -- Q1..Q4 | H1/H2 | Full Year
  cycle_year     int not null,         -- 1..3
  date           date not null,
  update_photo_url  text,
  message_to_sponsor text,
  beneficiary_update text,
  author_id      uuid references app_users(id),
  created_at     timestamptz not null default now()
);
create index if not exists idx_reports_beneficiary on progress_reports(beneficiary_id);

-- Annual office reports (Word / PDF documents), one per office per year.
create table if not exists office_reports (
  id          uuid primary key default gen_random_uuid(),
  office_id   text not null references offices(id),
  year        int not null,
  title       text not null,
  file_name   text not null,
  file_type   office_report_file_t not null,
  file_url    text not null,           -- storage path/URL in the 'reports' bucket
  uploaded_by uuid references app_users(id),
  uploaded_at timestamptz not null default now()
);
create index if not exists idx_office_reports_office on office_reports(office_id);

create table if not exists leaving_records (
  id             uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references beneficiaries(id) on delete cascade,
  reason         leaving_reason_t not null,
  explanation    text,
  date           date not null,
  author_id      uuid references app_users(id),
  created_at     timestamptz not null default now()
);

-- ============================================================================
-- Helper functions (used by RLS) — SECURITY DEFINER to read app_users safely
-- ============================================================================
create or replace function auth_role() returns user_role
  language sql stable security definer set search_path = public as $$
  select role from app_users where id = auth.uid() and active = true
$$;

create or replace function auth_office() returns text
  language sql stable security definer set search_path = public as $$
  select office_id from app_users where id = auth.uid() and active = true
$$;

-- Can the current user edit records in :oid ?
create or replace function can_edit_office(oid text) returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case
       when role = 'super_admin' then true
       when role in ('office_admin','editor') then office_id = oid
       else false end
     from app_users where id = auth.uid() and active = true),
    false)
$$;

-- Can the current user approve forms in :oid ?
create or replace function can_approve_office(oid text) returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce(
    (select case
       when role = 'super_admin' then true
       when role = 'office_admin' then office_id = oid
       else false end
     from app_users where id = auth.uid() and active = true),
    false)
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table offices          enable row level security;
alter table app_users        enable row level security;
alter table projects         enable row level security;
alter table beneficiaries    enable row level security;
alter table seasonal_cards   enable row level security;
alter table progress_reports enable row level security;
alter table office_reports   enable row level security;
alter table leaving_records  enable row level security;

-- Everyone signed in can READ reference data ---------------------------------
create policy read_offices  on offices          for select using (auth.uid() is not null);
create policy read_projects on projects         for select using (auth.uid() is not null);

-- app_users: everyone reads (to render names/offices); only super_admin writes
create policy read_users    on app_users        for select using (auth.uid() is not null);
create policy manage_users  on app_users        for all
  using (auth_role() = 'super_admin')
  with check (auth_role() = 'super_admin');

-- Beneficiaries: read all; write only own office ----------------------------
create policy read_beneficiaries   on beneficiaries for select using (auth.uid() is not null);
create policy insert_beneficiaries on beneficiaries for insert with check (can_edit_office(office_id));
create policy update_beneficiaries on beneficiaries for update
  using (can_edit_office(office_id)) with check (can_edit_office(office_id));
create policy delete_beneficiaries on beneficiaries for delete using (can_edit_office(office_id));

-- Seasonal cards: read all; write if you can edit the child's office -------
create policy read_cards  on seasonal_cards for select using (auth.uid() is not null);
create policy write_cards on seasonal_cards for all
  using (can_edit_office((select office_id from beneficiaries b where b.id = beneficiary_id)))
  with check (can_edit_office((select office_id from beneficiaries b where b.id = beneficiary_id)));

-- Progress reports: read all; write if you can edit the child's office ------
create policy read_reports   on progress_reports for select using (auth.uid() is not null);
create policy write_reports  on progress_reports for all
  using (can_edit_office((select office_id from beneficiaries b where b.id = beneficiary_id)))
  with check (can_edit_office((select office_id from beneficiaries b where b.id = beneficiary_id)));

-- Office reports: read all; write own office --------------------------------
create policy read_office_reports  on office_reports for select using (auth.uid() is not null);
create policy write_office_reports on office_reports for all
  using (can_edit_office(office_id)) with check (can_edit_office(office_id));

-- Leaving records -----------------------------------------------------------
create policy read_leaving  on leaving_records for select using (auth.uid() is not null);
create policy write_leaving on leaving_records for all
  using (can_edit_office((select office_id from beneficiaries b where b.id = beneficiary_id)))
  with check (can_edit_office((select office_id from beneficiaries b where b.id = beneficiary_id)));

-- ============================================================================
-- Storage buckets  (photos + cards are public-read; reports are private)
-- ============================================================================
insert into storage.buckets (id, name, public) values
  ('photos','photos', true),
  ('cards','cards',   true),
  ('reports','reports', false)
on conflict (id) do nothing;

-- Anyone signed in can read; only office-editors can write to their office's
-- folder. Convention: object path starts with '<office_id>/...'.
create policy storage_read on storage.objects for select
  using (bucket_id in ('photos','cards','reports') and auth.uid() is not null);

create policy storage_write on storage.objects for insert
  with check (
    bucket_id in ('photos','cards','reports')
    and can_edit_office(split_part(name, '/', 1))
  );

create policy storage_delete on storage.objects for delete
  using (
    bucket_id in ('photos','cards','reports')
    and can_edit_office(split_part(name, '/', 1))
  );

-- ============================================================================
-- Seed the two offices + the program row
-- ============================================================================
insert into offices (id, name, city, governorate) values
  ('office-cairo','Cairo Office','Cairo','Cairo'),
  ('office-minya','Minya Office','Minya','Minya')
on conflict (id) do nothing;

insert into projects (id, project_name, country_name,
  responsible_project_manager, responsible_sponsorship_officer_io, responsible_country_director)
values ('p-1','Child Labor Project','Egypt','Karim Mostafa','Sara Ibrahim','David Okoro')
on conflict (id) do nothing;

-- NOTE: create the 1 super admin + 2 office admins + 4 editors + 1 viewer as
-- Supabase Auth users first (Authentication → Users), then insert matching
-- app_users rows with their auth uid, role and office_id.
