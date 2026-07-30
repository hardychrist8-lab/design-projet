-- =====================================================================
-- DesignCV — Schéma Supabase (Phase 4, Modules 2-3-4)
-- ---------------------------------------------------------------------
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- Crée les tables, les politiques RLS, et un trigger updated_at.
-- =====================================================================

-- 1. Table profiles (étend auth.users avec un nom d'affichage)
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  display_name text,
  created_at  timestamptz default now()
);

-- 2. Table saved_cvs (CVs sauvegardés dans le cloud)
create table public.saved_cvs (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  name        text not null default 'Mon CV',
  data        jsonb not null,
  is_default  boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 3. Activer RLS
alter table public.profiles  enable row level security;
alter table public.saved_cvs enable row level security;

-- 4. Politiques profiles
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Politiques saved_cvs
create policy "Users can read own CVs"
  on public.saved_cvs for select
  using (auth.uid() = user_id);

create policy "Users can insert own CVs"
  on public.saved_cvs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own CVs"
  on public.saved_cvs for update
  using (auth.uid() = user_id);

create policy "Users can delete own CVs"
  on public.saved_cvs for delete
  using (auth.uid() = user_id);

-- 6. Trigger updated_at automatique
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_saved_cvs_updated
  before update on public.saved_cvs
  for each row execute function public.handle_updated_at();

-- 7. Trigger auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
