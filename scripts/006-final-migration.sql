-- ============================================================
-- FINAL MIGRATION SCRIPT
-- This script ensures all tables and columns exist correctly
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CREATE PROFILES TABLE FOR SUPABASE AUTH
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ENSURE GIFT_CARDS HAS ALL REQUIRED COLUMNS
-- ============================================================
DO $$
BEGIN
  -- Add code column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'code') THEN
    ALTER TABLE gift_cards ADD COLUMN code TEXT;
  END IF;
  
  -- Add created_by column if missing  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'created_by') THEN
    ALTER TABLE gift_cards ADD COLUMN created_by UUID;
  END IF;
  
  -- Add design column if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'design') THEN
    ALTER TABLE gift_cards ADD COLUMN design TEXT DEFAULT 'obsidian';
  END IF;

  -- Add payment columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'payment_shift_id') THEN
    ALTER TABLE gift_cards ADD COLUMN payment_shift_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'payment_tx_hash') THEN
    ALTER TABLE gift_cards ADD COLUMN payment_tx_hash TEXT;
  END IF;
END $$;

-- Copy data between columns if needed
UPDATE gift_cards SET code = secret_code WHERE code IS NULL AND secret_code IS NOT NULL;
UPDATE gift_cards SET created_by = buyer_id WHERE created_by IS NULL AND buyer_id IS NOT NULL;
UPDATE gift_cards SET design = COALESCE(design_variant, 'obsidian') WHERE design IS NULL;
UPDATE gift_cards SET payment_shift_id = sideshift_shift_id WHERE payment_shift_id IS NULL AND sideshift_shift_id IS NOT NULL;

-- ============================================================
-- 3. CREATE ADMIN_WALLETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_wallets_asset_network_key') THEN
    ALTER TABLE admin_wallets ADD CONSTRAINT admin_wallets_asset_network_key UNIQUE (asset, network);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 4. UPDATE ADMIN_SETTINGS STRUCTURE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'key') THEN
    ALTER TABLE admin_settings ADD COLUMN key TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'value') THEN
    ALTER TABLE admin_settings ADD COLUMN value JSONB;
  END IF;
END $$;

-- Migrate data if old columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'setting_key') THEN
    UPDATE admin_settings SET key = setting_key WHERE key IS NULL;
    UPDATE admin_settings SET value = to_jsonb(setting_value) WHERE value IS NULL;
  END IF;
END $$;

-- ============================================================
-- 5. ENSURE REDEMPTIONS TABLE HAS ALL COLUMNS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'gift_card_code') THEN
    ALTER TABLE redemptions ADD COLUMN gift_card_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'estimated_amount') THEN
    ALTER TABLE redemptions ADD COLUMN estimated_amount DECIMAL(20,10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'quote_id') THEN
    ALTER TABLE redemptions ADD COLUMN quote_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'shift_id') THEN
    ALTER TABLE redemptions ADD COLUMN shift_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'deposit_coin') THEN
    ALTER TABLE redemptions ADD COLUMN deposit_coin TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'deposit_network') THEN
    ALTER TABLE redemptions ADD COLUMN deposit_network TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'deposit_address') THEN
    ALTER TABLE redemptions ADD COLUMN deposit_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'deposit_amount') THEN
    ALTER TABLE redemptions ADD COLUMN deposit_amount DECIMAL(20,10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'error_message') THEN
    ALTER TABLE redemptions ADD COLUMN error_message TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'actual_amount') THEN
    ALTER TABLE redemptions ADD COLUMN actual_amount DECIMAL(20,10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'redemptions' AND column_name = 'completed_at') THEN
    ALTER TABLE redemptions ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================
-- 6. CREATE TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption')),
  sideshift_id TEXT,
  quote_id TEXT,
  deposit_coin TEXT,
  deposit_network TEXT,
  deposit_address TEXT,
  deposit_amount DECIMAL(20,10),
  settle_coin TEXT,
  settle_network TEXT,
  settle_address TEXT,
  settle_amount DECIMAL(20,10),
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. CREATE AUDIT_LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. CREATE FUNCTIONS
-- ============================================================

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'ighanghangodspower@gmail.com' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    is_admin = CASE WHEN EXCLUDED.email = 'ighanghangodspower@gmail.com' THEN true ELSE profiles.is_admin END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. CREATE TRIGGERS
-- ============================================================

-- Auth user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_admin_wallets_updated_at ON admin_wallets;
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
DROP TRIGGER IF EXISTS update_gift_cards_updated_at ON gift_cards;
DROP TRIGGER IF EXISTS update_redemptions_updated_at ON redemptions;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_wallets_updated_at BEFORE UPDATE ON admin_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_redemptions_updated_at BEFORE UPDATE ON redemptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 10. ENABLE RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. CREATE PERMISSIVE POLICIES (for API access via service role)
-- ============================================================

-- Drop existing policies first
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

-- Admin wallets
CREATE POLICY "admin_wallets_all" ON admin_wallets FOR ALL USING (true);

-- Admin settings
CREATE POLICY "admin_settings_all" ON admin_settings FOR ALL USING (true);

-- Gift cards
CREATE POLICY "gift_cards_all" ON gift_cards FOR ALL USING (true);

-- Redemptions
CREATE POLICY "redemptions_all" ON redemptions FOR ALL USING (true);

-- Transactions
CREATE POLICY "transactions_all" ON transactions FOR ALL USING (true);

-- Audit log
CREATE POLICY "audit_log_all" ON audit_log FOR ALL USING (true);

-- ============================================================
-- 12. CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_secret_code ON gift_cards(secret_code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_buyer_id ON gift_cards(buyer_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_payment_shift_id ON gift_cards(payment_shift_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_gift_card_id ON redemptions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_gift_card_id ON transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_transactions_sideshift_id ON transactions(sideshift_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================
-- DONE
-- ============================================================
SELECT 'Migration complete!' as status;
