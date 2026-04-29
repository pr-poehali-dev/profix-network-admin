CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.custom_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(200) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  meta_desc TEXT,
  accent_color VARCHAR(20) DEFAULT '#3ca615',
  blocks JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN DEFAULT FALSE,
  show_in_nav BOOLEAN DEFAULT FALSE,
  nav_label VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);