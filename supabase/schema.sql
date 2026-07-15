-- ============================================================
-- Central Geral — schema do Supabase
-- Cole tudo isto no Supabase → SQL Editor → New query → Run.
-- Cria as tabelas, ativa RLS (cada usuário só vê os próprios dados)
-- e semeia os 3 módulos padrão quando um usuário novo se cadastra.
-- ============================================================

-- ---------- Tabelas ----------
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  color text not null default '#6E8BFF',
  icon text not null default 'layers',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  title text not null,
  notes text,
  recurrence text not null default 'fixed' check (recurrence in ('fixed', 'once')),
  days_of_week int[] not null default '{}',
  date date,
  time text,
  duration_min int,
  color text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (activity_id, date)
);

create table if not exists public.bible_reading (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  book_id text not null,
  chapter int not null,
  created_at timestamptz not null default now(),
  unique (user_id, book_id, chapter)
);

create index if not exists activities_module_idx on public.activities (module_id);
create index if not exists activities_user_idx on public.activities (user_id);
create index if not exists completions_date_idx on public.completions (date);
create index if not exists completions_user_idx on public.completions (user_id);
create index if not exists bible_reading_user_idx on public.bible_reading (user_id);

-- ---------- Row Level Security ----------
alter table public.modules enable row level security;
alter table public.activities enable row level security;
alter table public.completions enable row level security;
alter table public.bible_reading enable row level security;

drop policy if exists "own modules" on public.modules;
create policy "own modules" on public.modules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own activities" on public.activities;
create policy "own activities" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own completions" on public.completions;
create policy "own completions" on public.completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own bible" on public.bible_reading;
create policy "own bible" on public.bible_reading
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Semear módulos padrão para cada novo usuário ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.modules (user_id, name, slug, color, icon, sort_order) values
    (new.id, 'Profissional', 'profissional', '#6E8BFF', 'briefcase', 1),
    (new.id, 'Intelectual', 'intelectual', '#C9A961', 'book', 2),
    (new.id, 'Pessoal', 'pessoal', '#4ADE80', 'heart', 3);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
