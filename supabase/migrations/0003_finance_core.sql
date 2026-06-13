-- Core finance schema: initial capital, categories, monthly budget plans, and transactions.
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query),
-- after 0001_create_profiles.sql and 0002_email_whitelist.sql.

-- Starting balance, editable from the Profile page.
alter table public.profiles
  add column if not exists initial_capital numeric(14, 2) not null default 0;

-- Income / expense categories, owned by each user.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users manage their own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- One row per category per month = that category's planned budget for the month.
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, category_id, month)
);

alter table public.budget_items enable row level security;

create policy "Users manage their own budget items"
  on public.budget_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index budget_items_user_month_idx on public.budget_items (user_id, month);

-- Actual income / expense entries.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users manage their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on);
