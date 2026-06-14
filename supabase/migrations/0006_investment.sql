-- Investment app: multi-currency wallets, plan sheets, instruments, and PDF reports.
-- Run this once in the Supabase SQL Editor, after 0001-0005.

-- Add USD support to the shared exchange-rate singleton.
alter table public.currency_rates
  add column if not exists usd_to_idr numeric(14, 4) not null default 16000 check (usd_to_idr > 0);

-- One row per user per currency = that wallet's capital balance.
create table public.investment_wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  currency text not null check (currency in ('IDR', 'SGD', 'USD')),
  balance numeric(14, 2) not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, currency)
);

alter table public.investment_wallets enable row level security;

create policy "Users manage their own wallets"
  on public.investment_wallets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A named portfolio plan; user can have many, each in its own currency.
create table public.investment_plan_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  currency text not null check (currency in ('IDR', 'SGD', 'USD')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investment_plan_sheets enable row level security;

create policy "Users manage their own plan sheets"
  on public.investment_plan_sheets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Instrument rows within a plan sheet.
create table public.investment_instruments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  plan_sheet_id uuid not null references public.investment_plan_sheets (id) on delete cascade,
  code text not null,
  amount_invested numeric(14, 2) not null default 0 check (amount_invested >= 0),
  target_in numeric(14, 4),
  target_out numeric(14, 4),
  actual_in numeric(14, 4),
  actual_out numeric(14, 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.investment_instruments enable row level security;

create policy "Users manage their own instruments"
  on public.investment_instruments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index investment_instruments_sheet_idx on public.investment_instruments (plan_sheet_id);

-- General reports library (PDF metadata; files live in Storage).
create table public.investment_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

alter table public.investment_reports enable row level security;

create policy "Users manage their own reports"
  on public.investment_reports for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Private storage bucket for uploaded PDFs, one folder per user (folder name = user id).
insert into storage.buckets (id, name, public)
values ('investment-reports', 'investment-reports', false)
on conflict (id) do nothing;

create policy "Users manage their own report files"
  on storage.objects for all
  using (bucket_id = 'investment-reports' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'investment-reports' and (storage.foldername(name))[1] = auth.uid()::text);
