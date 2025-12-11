-- Add platform fee tracking columns to gift_cards table
-- These store the fee charged and total amount paid by buyer

ALTER TABLE gift_cards 
ADD COLUMN IF NOT EXISTS platform_fee_usd NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_paid_usd NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Add fee settings to admin_settings if not exists
INSERT INTO admin_settings (key, value) 
VALUES 
  ('fee_percentage', '2.5'),
  ('fee_minimum', '0.50')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_created_by ON gift_cards(created_by);
CREATE INDEX IF NOT EXISTS idx_gift_cards_expires_at ON gift_cards(expires_at);
