  -- Profinds full database schema
-- Run in Supabase SQL Editor (safe to re-run with IF NOT EXISTS)

-- ── Profiles (extends existing) ──────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  name text not null default '',
  email text not null default '',
  phone text default '',
  dob text default '',
  avatar text default '',
  bio text default '',
  skills jsonb not null default '[]'::jsonb,
  portfolio jsonb not null default '[]'::jsonb,
  survey jsonb,
  provider text not null default 'email',
  verified jsonb not null default '{"email":false,"phone":false,"github":false}'::jsonb,
  github_username text,
  subscription_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

-- ── Software listings ────────────────────────────────────────────────────────
create table if not exists public.software_listings (
  id text primary key,
  seller_id uuid references public.profiles(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Messages ─────────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id text primary key,
  from_user_id uuid references public.profiles(id) on delete set null,
  to_user_id uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Reviews ──────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id text primary key,
  product_id text not null,
  user_id uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Bundles ──────────────────────────────────────────────────────────────────
create table if not exists public.bundles (
  id text primary key,
  seller_id uuid references public.profiles(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Professional services ────────────────────────────────────────────────────
create table if not exists public.services (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Jobs ─────────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id text primary key,
  poster_id uuid references public.profiles(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Proposals ────────────────────────────────────────────────────────────────
create table if not exists public.proposals (
  id text primary key,
  job_id text not null,
  freelancer_id uuid references public.profiles(id) on delete set null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Purchases ────────────────────────────────────────────────────────────────
create table if not exists public.purchases (
  id text primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  product_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- ── Saved products (library bookmarks) ───────────────────────────────────────
create table if not exists public.saved_products (
  user_id uuid references public.profiles(id) on delete cascade,
  product_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── Follows ──────────────────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, creator_id)
);

-- ── Feedback ─────────────────────────────────────────────────────────────────
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

-- Profiles
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Users can delete their own profile" on public.profiles;
create policy "Users can delete their own profile" on public.profiles for delete using (auth.uid() = id);

-- Public read, authenticated write for marketplace data
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

-- ── Deleted accounts blocklist ────────────────────────────────────────────────
create table if not exists public.deleted_users (
  id uuid primary key,
  username text,
  deleted_at timestamptz not null default now()
);

alter table public.deleted_users enable row level security;

drop policy if exists "Deleted users readable" on public.deleted_users;
create policy "Deleted users readable" on public.deleted_users for select using (true);
drop policy if exists "Users mark self deleted" on public.deleted_users;
create policy "Users mark self deleted" on public.deleted_users for insert with check (auth.uid() = id);
drop policy if exists "Users update own deletion" on public.deleted_users;
create policy "Users update own deletion" on public.deleted_users for update using (auth.uid() = id);

-- Auth trigger for profiles
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.deleted_users where id = new.id) then
    return new;
  end if;
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

-- ── Cascade: deleting a profile removes their listings, jobs, services, bundles ─
-- Safe to re-run on existing projects
do $$
begin
  alter table public.software_listings drop constraint if exists software_listings_seller_id_fkey;
  alter table public.software_listings
    add constraint software_listings_seller_id_fkey
    foreign key (seller_id) references public.profiles(id) on delete cascade;

  alter table public.bundles drop constraint if exists bundles_seller_id_fkey;
  alter table public.bundles
    add constraint bundles_seller_id_fkey
    foreign key (seller_id) references public.profiles(id) on delete cascade;

  alter table public.jobs drop constraint if exists jobs_poster_id_fkey;
  alter table public.jobs
    add constraint jobs_poster_id_fkey
    foreign key (poster_id) references public.profiles(id) on delete cascade;

  -- services already cascade; ensure it
  alter table public.services drop constraint if exists services_user_id_fkey;
  alter table public.services
    add constraint services_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;
end $$;

-- Realtime (run separately if this errors on re-run)
-- alter publication supabase_realtime add table public.messages;

-- ── Delete account: removes user from Supabase Auth ───────────────────────────
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  uname text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select username into uname from public.profiles where id = uid;
  if uname is null then
    select coalesce(raw_user_meta_data->>'username', '') into uname from auth.users where id = uid;
  end if;

  insert into public.deleted_users (id, username, deleted_at)
  values (uid, nullif(uname, ''), now())
  on conflict (id) do update set deleted_at = now();

  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
