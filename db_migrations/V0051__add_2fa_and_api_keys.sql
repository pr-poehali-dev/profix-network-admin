-- 2FA коды для менеджеров
ALTER TABLE t_p83689144_profix_network_admin.managers
  ADD COLUMN IF NOT EXISTS tfa_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS tfa_expires_at TIMESTAMP;

-- API ключи для партнёров
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(64) UNIQUE NOT NULL,
  permissions JSONB DEFAULT '["tickets:read","tickets:create"]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);