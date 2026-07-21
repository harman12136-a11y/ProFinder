-- Run this in Supabase → SQL Editor if signup fails with
-- "column profiles.username does not exist" or tables are missing.
-- Safe to re-run.

-- ── Upgrade profiles table (Vercel starter may be missing columns) ───────────
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists phone text default '';
alter table public.profiles add column if not exists dob text default '';
alter table public.profiles add column if not exists avatar text default '';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists skills jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists portfolio jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists survey jsonb;
alter table public.profiles add column if not exists provider text not null default 'email';
alter table public.profiles add column if not exists verified jsonb not null default '{"email":false,"phone":false,"github":false}'::jsonb;
alter table public.profiles add column if not exists github_username text;
alter table public.profiles add column if not exists subscription_expires_at timestamptz;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists last_login_at timestamptz;

create unique index if not exists profiles_username_unique on public.profiles (username)
  where username is not null and username <> '';

-- ── Marketplace tables ────────────────────────────────────────────────────────
create table if not exists public.software_listings (
  id text primary key,
  seller_id uuid references public.profiles(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  from_user_id uuid references public.profiles(id) on delete set null,
  to_user_id uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id text primary key,
  product_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bundles (
  id text primary key,
  seller_id uuid references public.profiles(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id text primary key,
  poster_id uuid references public.profiles(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id text primary key,
  job_id text not null,
  freelancer_id uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  product_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.saved_products (
  user_id uuid references public.profiles(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id)
);

create table if not exists public.feedback (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_flags (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  submitted_at timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.software_listings enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.bundles enable row level security;
alter table public.services enable row level security;
alter table public.jobs enable row level security;
alter table public.proposals enable row level security;
alter table public.purchases enable row level security;
alter table public.saved_products enable row level security;
alter table public.follows enable row level security;
alter table public.feedback enable row level security;
alter table public.feedback_flags enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile" on public.profiles for delete using (auth.uid() = id);

drop policy if exists "Listings are public" on public.software_listings;
create policy "Listings are public" on public.software_listings for select using (true);
drop policy if exists "Sellers manage listings" on public.software_listings;
create policy "Sellers manage listings" on public.software_listings for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "Messages visible to participants" on public.messages;
create policy "Messages visible to participants" on public.messages for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);
drop policy if exists "Users send messages" on public.messages;
create policy "Users send messages" on public.messages for insert with check (auth.uid() = from_user_id);
drop policy if exists "Recipients mark messages read" on public.messages;
create policy "Recipients mark messages read" on public.messages for update
  using (auth.uid() = to_user_id);

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select using (true);
drop policy if exists "Users add reviews" on public.reviews;
create policy "Users add reviews" on public.reviews for insert with check (auth.uid() = user_id);

drop policy if exists "Bundles are public" on public.bundles;
create policy "Bundles are public" on public.bundles for select using (true);
drop policy if exists "Sellers manage bundles" on public.bundles;
create policy "Sellers manage bundles" on public.bundles for all using (auth.uid() = seller_id) with check (auth.uid() = seller_id);

drop policy if exists "Services are public" on public.services;
create policy "Services are public" on public.services for select using (true);
drop policy if exists "Users manage own service" on public.services;
create policy "Users manage own service" on public.services for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Jobs are public" on public.jobs;
create policy "Jobs are public" on public.jobs for select using (true);
drop policy if exists "Posters manage jobs" on public.jobs;
create policy "Posters manage jobs" on public.jobs for all using (auth.uid() = poster_id) with check (auth.uid() = poster_id);

drop policy if exists "Proposals visible to involved parties" on public.proposals;
create policy "Proposals visible to involved parties" on public.proposals for select using (true);
drop policy if exists "Freelancers manage proposals" on public.proposals;
create policy "Freelancers manage proposals" on public.proposals for all using (auth.uid() = freelancer_id) with check (auth.uid() = freelancer_id);
drop policy if exists "Posters update job proposals" on public.proposals;
create policy "Posters update job proposals" on public.proposals for update
  using (exists (select 1 from public.jobs where jobs.id = proposals.job_id and jobs.poster_id = auth.uid()));

drop policy if exists "Users see own purchases" on public.purchases;
create policy "Users see own purchases" on public.purchases for select using (auth.uid() = user_id);
drop policy if exists "Users manage own purchases" on public.purchases;
create policy "Users manage own purchases" on public.purchases for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage saved products" on public.saved_products;
create policy "Users manage saved products" on public.saved_products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage follows" on public.follows;
create policy "Users manage follows" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
drop policy if exists "Follows are public" on public.follows;
create policy "Follows are public" on public.follows for select using (true);

drop policy if exists "Anyone submits feedback" on public.feedback;
create policy "Anyone submits feedback" on public.feedback for insert with check (true);
drop policy if exists "Feedback readable by submitter" on public.feedback;
create policy "Feedback readable by submitter" on public.feedback for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "Users manage feedback flags" on public.feedback_flags;
create policy "Users manage feedback flags" on public.feedback_flags for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auth trigger for new signups
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'username', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
