-- Create notifications table for user activity feed
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'purchase', 'redemption', 'card_activated', 'card_expired', 'system'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread', -- 'unread', 'read'
  
  -- Related entity
  entity_type TEXT, -- 'gift_card', 'deposit', 'redemption', 'transaction'
  entity_id UUID,
  
  -- Additional data for display
  amount_usd NUMERIC,
  crypto_amount NUMERIC,
  crypto_coin TEXT,
  crypto_network TEXT,
  card_code TEXT,
  card_design TEXT,
  tx_status TEXT, -- 'pending', 'confirmed', 'failed', 'cancelled'
  tx_hash TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
