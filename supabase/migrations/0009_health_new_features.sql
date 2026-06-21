-- Noon sleep / nap tracking
CREATE TABLE IF NOT EXISTS health_noon_sleep (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_noon_sleep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own noon sleep"
  ON health_noon_sleep FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Bowel movement / poop tracking
CREATE TABLE IF NOT EXISTS health_poop (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_poop ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own poop"
  ON health_poop FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Cycling session tracking
CREATE TABLE IF NOT EXISTS health_cycling (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE health_cycling ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cycling"
  ON health_cycling FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
