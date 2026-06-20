-- Add currency support to Finance budget items and transactions.
-- Amounts are now stored in their *native* currency (not always IDR).
-- Old rows get currency = 'IDR' by default, which is backward-compatible
-- because they were already stored in IDR.

ALTER TABLE budget_items
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR';

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR';
