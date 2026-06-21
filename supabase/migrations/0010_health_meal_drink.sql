-- Meal tracking
CREATE TABLE IF NOT EXISTS health_meals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE health_meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own meals"
  ON health_meals FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drink tracking
CREATE TABLE IF NOT EXISTS health_drinks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       date NOT NULL,
  data       jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE health_drinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own drinks"
  ON health_drinks FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
