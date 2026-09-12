create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text check (role in ('dcpc_officer','dcpc_chair','pnp_supervisor','oversight_member')) not null,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  is_anonymous boolean not null default true,
  reporter_contact text,
  description text not null,
  people_involved text,
  incident_datetime text,
  urgency text check (urgency in ('emergency','soon','general')) not null,
  status text check (status in ('new','under_review','referred','resolved','closed')) default 'new',
  source text check (source in ('digital','physical_dropbox')) default 'digital',
  escalated_to_pnp boolean default false,
  assigned_officer uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  storage_path text not null,
  uploaded_at timestamptz default now()
);

create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  author_id uuid references public.profiles(id),
  note text not null,
  visible_to_pnp boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id),
  actor_id uuid references public.profiles(id),
  action text not null,
  created_at timestamptz default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  comfort_rating int check (comfort_rating between 1 and 5),
  comments text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_attachments enable row level security;
alter table public.case_notes enable row level security;
alter table public.audit_log enable row level security;
alter table public.feedback enable row level security;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create policy "public can create reports"
on public.reports for insert to anon, authenticated
with check (true);

create policy "dcpc can read reports"
on public.reports for select to authenticated
using (public.current_role() in ('dcpc_officer', 'dcpc_chair'));

create policy "pnp can read escalated reports"
on public.reports for select to authenticated
using (public.current_role() = 'pnp_supervisor' and escalated_to_pnp = true);

create policy "dcpc can update reports"
on public.reports for update to authenticated
using (public.current_role() in ('dcpc_officer', 'dcpc_chair'))
with check (public.current_role() in ('dcpc_officer', 'dcpc_chair'));

create policy "chair can delete reports"
on public.reports for delete to authenticated
using (public.current_role() = 'dcpc_chair');

create policy "dcpc can manage notes"
on public.case_notes for all to authenticated
using (public.current_role() in ('dcpc_officer', 'dcpc_chair'))
with check (public.current_role() in ('dcpc_officer', 'dcpc_chair'));

create policy "pnp can read visible notes"
on public.case_notes for select to authenticated
using (
  public.current_role() = 'pnp_supervisor'
  and visible_to_pnp = true
  and exists (
    select 1 from public.reports r
    where r.id = report_id and r.escalated_to_pnp = true
  )
);

create policy "chair can read audit log"
on public.audit_log for select to authenticated
using (public.current_role() = 'dcpc_chair');

create policy "authenticated can insert audit log"
on public.audit_log for insert to authenticated
with check (actor_id = auth.uid());

create policy "public can send feedback"
on public.feedback for insert to anon, authenticated
with check (true);

create or replace view public.oversight_stats as
select
  date_trunc('month', created_at)::date as month,
  count(*)::int as report_count,
  count(*) filter (where status in ('resolved', 'closed'))::int as resolved_count,
  count(*) filter (where urgency in ('emergency', 'soon'))::int as urgent_count
from public.reports
group by 1
order by 1 desc;

grant select on public.oversight_stats to authenticated;

insert into storage.buckets (id, name, public)
values ('report-evidence', 'report-evidence', false)
on conflict (id) do update set public = false;