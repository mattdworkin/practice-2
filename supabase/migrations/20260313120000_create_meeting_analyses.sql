create extension if not exists pgcrypto;

create table if not exists public.meeting_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  original_notes text not null,
  summary text not null,
  key_points jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb,
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative')),
  created_at timestamptz not null default now()
);

create index if not exists meeting_analyses_user_created_at_idx
  on public.meeting_analyses (user_id, created_at desc);

grant usage on schema public to authenticated;
grant select, insert on public.meeting_analyses to authenticated;

alter table public.meeting_analyses enable row level security;

drop policy if exists "Users can read their own meeting analyses" on public.meeting_analyses;
create policy "Users can read their own meeting analyses"
  on public.meeting_analyses
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own meeting analyses" on public.meeting_analyses;
create policy "Users can insert their own meeting analyses"
  on public.meeting_analyses
  for insert
  to authenticated
  with check (auth.uid() = user_id);
