CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.site_content (
  key VARCHAR(200) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);