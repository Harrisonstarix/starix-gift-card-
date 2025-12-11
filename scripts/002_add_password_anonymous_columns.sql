-- Add password protection and anonymous sender columns to gift_cards table
-- Run this migration to enable these features

-- Add password_hash column for password-protected gift cards
ALTER TABLE gift_cards 
ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL;

-- Add is_anonymous column for anonymous senders
ALTER TABLE gift_cards 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Add platform_fee column to track fees
ALTER TABLE gift_cards 
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10, 2) DEFAULT 0;

-- Add total_paid column to track total amount paid including fees
ALTER TABLE gift_cards 
ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10, 2) DEFAULT 0;

-- Add index for faster lookups on code columns
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_secret_code ON gift_cards(secret_code);

-- Comment on columns for documentation
COMMENT ON COLUMN gift_cards.password_hash IS 'Hashed password for password-protected gift cards (optional)';
COMMENT ON COLUMN gift_cards.is_anonymous IS 'Whether the sender wishes to remain anonymous';
COMMENT ON COLUMN gift_cards.platform_fee IS 'Platform fee charged for this gift card in USD';
COMMENT ON COLUMN gift_cards.total_paid IS 'Total amount paid including card value and fees';
