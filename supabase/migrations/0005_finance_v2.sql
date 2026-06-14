-- Finance v2: drop the unused initial-capital/balance concept and let users
-- flag which expense categories count toward the daily budget.
-- Run this once in the Supabase SQL Editor, after 0001-0004.

alter table public.profiles drop column if exists initial_capital;

alter table public.categories
  add column if not exists is_daily_budget boolean not null default false;

-- Seed: assume food/groceries/transport-like categories are daily-budget
-- categories. Adjust per-category afterwards on the Categories page.
update public.categories
set is_daily_budget = true
where type = 'expense'
  and (name ilike '%food%' or name ilike '%grocer%' or name ilike '%transport%');
