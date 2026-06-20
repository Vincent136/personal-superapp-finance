-- =============================================
-- HEALTH TABLES
-- Flexible JSONB data column so all record fields
-- are preserved without schema changes per activity type.
-- =============================================

CREATE TABLE IF NOT EXISTS health_cardio (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_cardio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cardio"
  ON health_cardio FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS health_sleep (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_sleep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sleep"
  ON health_sleep FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS health_body (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_body ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own body metrics"
  ON health_body FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS health_journal (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journal"
  ON health_journal FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());


-- =============================================
-- TRIPS TABLE
-- title and status are top-level columns for sorting/filtering.
-- Everything else (expenses, places, itinerary, images,
-- budget, dates, etc.) lives in the JSONB data column.
-- =============================================

CREATE TABLE IF NOT EXISTS trips (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  title      text NOT NULL DEFAULT '',
  status     text NOT NULL DEFAULT 'planning',
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own trips"
  ON trips FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Shared updated_at trigger function (safe to re-create)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================
-- WALLET CONFIG
-- One row per user; stores exchange rates and
-- per-currency cash balances as JSONB.
-- IDR is always the base (rate = 1).
-- =============================================

CREATE TABLE IF NOT EXISTS wallet_config (
  user_id    uuid PRIMARY KEY REFERENCES auth.users,
  rates      jsonb NOT NULL DEFAULT '{"IDR":1,"USD":16000,"SGD":12000,"EUR":17000,"MYR":3500,"JPY":107,"AUD":10500}',
  wallets    jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE wallet_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wallet config"
  ON wallet_config FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER wallet_config_updated_at
  BEFORE UPDATE ON wallet_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================
-- STORAGE BUCKET: trip-images
-- Public bucket; write/delete gated by user_id prefix.
-- Path convention: {user_id}/{trip_id}/{uuid}.jpg
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('trip-images', 'trip-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users upload own trip images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'trip-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete own trip images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'trip-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Trip images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trip-images');
