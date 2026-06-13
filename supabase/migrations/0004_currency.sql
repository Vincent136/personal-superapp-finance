-- Multi-currency display: amounts stay stored in IDR (the base currency);
-- each user picks a display currency and a shared admin-managed rate
-- converts between the two for display and input.
-- Run this once in the Supabase SQL Editor, after 0001-0003.

-- User's preferred display currency.
alter table public.profiles
  add column if not exists currency text not null default 'IDR' check (currency in ('IDR', 'SGD'));

-- Singleton table holding the SGD <-> IDR exchange rate.
create table public.currency_rates (
  id smallint primary key default 1 check (id = 1),
  sgd_to_idr numeric(14, 4) not null default 12000 check (sgd_to_idr > 0),
  updated_at timestamptz not null default now()
);

insert into public.currency_rates (id, sgd_to_idr) values (1, 12000);

alter table public.currency_rates enable row level security;

create policy "Authenticated users can view currency rates"
  on public.currency_rates for select
  to authenticated
  using (true);

create policy "Admins can update currency rates"
  on public.currency_rates for update
  using (public.is_admin())
  with check (public.is_admin());
