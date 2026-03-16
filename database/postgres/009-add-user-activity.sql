
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_activity_userid_occurred_at_desc ON user_activity(user_account_id, occurred_at DESC);

-- Optional materialized view or function for day-based streaks can be added later
