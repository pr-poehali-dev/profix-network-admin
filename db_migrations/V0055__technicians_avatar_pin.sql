ALTER TABLE t_p83689144_profix_network_admin.technicians
    ADD COLUMN IF NOT EXISTS avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS pin VARCHAR(64);
