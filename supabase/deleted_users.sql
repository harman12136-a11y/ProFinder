-- Run this in Supabase → SQL Editor (copy all, click Run)
-- Fixes: "Could not find the table 'public.deleted_users'"

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
