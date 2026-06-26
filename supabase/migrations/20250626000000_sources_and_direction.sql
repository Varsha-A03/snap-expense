-- Money sources + credit/debit direction on transactions
-- Run in Supabase Dashboard → SQL Editor

-- ── Sources table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS sources_user_id_idx ON sources(user_id);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sources" ON sources;
DROP POLICY IF EXISTS "Users can insert own sources" ON sources;
DROP POLICY IF EXISTS "Users can update own sources" ON sources;
DROP POLICY IF EXISTS "Users can delete own sources" ON sources;

CREATE POLICY "Users can view own sources"
  ON sources FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sources"
  ON sources FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sources"
  ON sources FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sources"
  ON sources FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── Transaction direction + source link ────────────────────────

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'debit'
  CHECK (direction IN ('credit', 'debit'));

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS source_id UUID REFERENCES sources(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS transactions_source_id_idx ON transactions(source_id);
CREATE INDEX IF NOT EXISTS transactions_direction_idx ON transactions(direction);
