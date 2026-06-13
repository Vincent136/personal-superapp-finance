-- Restricts sign-up to a whitelist of email addresses, managed by admins.
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- after 0001_create_profiles.sql.

create table if not exists public.email_whitelist (
  email text primary key,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.email_whitelist enable row level security;

-- Keep emails normalized (trimmed + lowercase) regardless of how they're inserted.
create or replace function public.normalize_whitelist_email()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists normalize_email_whitelist on public.email_whitelist;

create trigger normalize_email_whitelist
  before insert or update on public.email_whitelist
  for each row execute function public.normalize_whitelist_email();

-- Seed the owner's email as the first whitelisted + admin account.
insert into public.email_whitelist (email, is_admin)
values ('vincentchristian541@gmail.com', true)
on conflict (email) do update set is_admin = true;

-- True if the currently authenticated user is an admin.
-- security definer so it can read email_whitelist regardless of RLS
-- (and so the RLS policies below don't recurse into themselves).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.email_whitelist w
    where w.is_admin = true
      and w.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Lets the sign-up form check whether an email is allowed before calling
-- supabase.auth.signUp, without exposing the whole whitelist to anon users.
create or replace function public.is_email_allowed(check_email text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.email_whitelist
    where email = lower(trim(check_email))
  );
$$;

grant execute on function public.is_email_allowed(text) to anon, authenticated;

-- Only admins can view or manage the whitelist itself.
create policy "Admins can view whitelist"
  on public.email_whitelist for select
  using (public.is_admin());

create policy "Admins can add to whitelist"
  on public.email_whitelist for insert
  with check (public.is_admin());

create policy "Admins can update whitelist"
  on public.email_whitelist for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can remove from whitelist"
  on public.email_whitelist for delete
  using (public.is_admin());

-- Hard enforcement: block account creation for any email not on the
-- whitelist, even if someone calls the Auth API directly (bypassing the UI).
create or replace function public.enforce_email_whitelist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.email_whitelist
    where email = lower(coalesce(new.email, ''))
  ) then
    raise exception 'Email % is not authorized to register', new.email
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_email_whitelist on auth.users;

create trigger enforce_email_whitelist
  before insert on auth.users
  for each row execute function public.enforce_email_whitelist();
