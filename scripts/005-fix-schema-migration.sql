-- ============================================================
-- FIX SCHEMA MIGRATION
-- This script updates the existing database to the new schema
-- Run this script to fix column name mismatches
-- ============================================================

-- First, let's drop the old custom auth tables if they exist
-- We're migrating to Supabase Auth
DROP TABLE IF EXISTS user_sessions CASCADE;

-- ============================================================
-- CREATE PROFILES TABLE (for Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPDATE GIFT_CARDS TABLE
-- Add missing columns and rename as needed
-- ============================================================

-- Add 'code' column if it doesn't exist (copy from secret_code)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'code') THEN
    ALTER TABLE gift_cards ADD COLUMN code TEXT;
  END IF;
END $$;

-- Copy data from secret_code to code if secret_code exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'secret_code') THEN
    UPDATE gift_cards SET code = secret_code WHERE code IS NULL;
  END IF;
END $$;

-- Add created_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'created_by') THEN
    ALTER TABLE gift_cards ADD COLUMN created_by UUID;
  END IF;
END $$;

-- Copy from buyer_id to created_by
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'buyer_id') THEN
    UPDATE gift_cards SET created_by = buyer_id WHERE created_by IS NULL;
  END IF;
END $$;

-- Add design column if doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'gift_cards' AND column_name = 'design') THEN
    ALTER TABLE gift_cards ADD COLUMN design TEXT DEFAULT 'obsidian';
    UPDATE gift_cards SET design = COALESCE(design_variant, 'obsidian') WHERE design IS NULL;
  END IF;
END $$;

-- Add unique constraint to code if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gift_cards_code_key') THEN
    ALTER TABLE gift_cards ADD CONSTRAINT gift_cards_code_key UNIQUE (code);
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- Ignore if constraint already exists
END $$;

-- ============================================================
-- CREATE ADMIN_WALLETS TABLE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset TEXT NOT NULL,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(asset, network)
);

-- ============================================================
-- UPDATE ADMIN_SETTINGS TABLE STRUCTURE
-- ============================================================
-- Add 'key' and 'value' columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'key') THEN
    ALTER TABLE admin_settings ADD COLUMN key TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'value') THEN
    ALTER TABLE admin_settings ADD COLUMN value JSONB;
  END IF;
END $$;

-- Migrate from setting_key/setting_value to key/value
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'admin_settings' AND column_name = 'setting_key') THEN
    UPDATE admin_settings SET key = setting_key WHERE key IS NULL;
    UPDATE admin_settings SET value = to_jsonb(setting_value) WHERE value IS NULL;
  END IF;
END $$;

-- Add unique constraint to key
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admin_settings_key_key') THEN
    ALTER TABLE admin_settings ADD CONSTRAINT admin_settings_key_key UNIQUE (key);
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ============================================================
-- UPDATE REDEMPTIONS TABLE STRUCTURE
-- ============================================================
-- Add missing columns to redemptions if they don't exist
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
-- CREATE TRANSACTIONS TABLE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('purchase', 'redemption')),
  gift_card_id UUID REFERENCES gift_cards(id),
  sideshift_id TEXT,
  quote_id TEXT,
  deposit_coin TEXT,
  deposit_network TEXT,
  deposit_amount DECIMAL(20,10),
  settle_coin TEXT,
  settle_network TEXT,
  settle_amount DECIMAL(20,10),
  status TEXT NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CREATE AUDIT_LOG TABLE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    -- Auto-promote specific admin email
    CASE WHEN NEW.email = 'ighanghangodspower@gmail.com' THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers (drop first if exists)
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
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view active gift cards by code" ON gift_cards;
DROP POLICY IF EXISTS "Authenticated users can create gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Users can view own gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Admins can view all gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Admins can update gift cards" ON gift_cards;
DROP POLICY IF EXISTS "Anyone can create redemptions" ON redemptions;
DROP POLICY IF EXISTS "Admins can view all redemptions" ON redemptions;
DROP POLICY IF EXISTS "Admins can update redemptions" ON redemptions;
DROP POLICY IF EXISTS "Admins can manage wallets" ON admin_wallets;
DROP POLICY IF EXISTS "Admins can manage settings" ON admin_settings;
DROP POLICY IF EXISTS "Admins can view transactions" ON transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
DROP POLICY IF EXISTS "System can insert audit log" ON audit_log;

-- ============================================================
-- CREATE RLS POLICIES
-- ============================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles insert for auth trigger" ON profiles
  FOR INSERT WITH CHECK (true);

-- Gift cards policies
CREATE POLICY "Anyone can view gift cards" ON gift_cards
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create gift cards" ON gift_cards
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update gift cards" ON gift_cards
  FOR UPDATE USING (true);

-- Redemptions policies
CREATE POLICY "Anyone can view redemptions" ON redemptions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create redemptions" ON redemptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update redemptions" ON redemptions
  FOR UPDATE USING (true);

-- Admin wallets policies
CREATE POLICY "Anyone can view wallets" ON admin_wallets
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage wallets" ON admin_wallets
  FOR ALL USING (true);

-- Admin settings policies
CREATE POLICY "Anyone can view settings" ON admin_settings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can manage settings" ON admin_settings
  FOR ALL USING (true);

-- Transactions policies
CREATE POLICY "Anyone can view transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update transactions" ON transactions
  FOR UPDATE USING (true);

-- Audit log policies
CREATE POLICY "Anyone can view audit log" ON audit_log
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON gift_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_redemptions_gift_card_id ON redemptions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON redemptions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_gift_card_id ON transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================
-- DONE!
-- ============================================================
SELECT 'Schema migration complete!' as status;
