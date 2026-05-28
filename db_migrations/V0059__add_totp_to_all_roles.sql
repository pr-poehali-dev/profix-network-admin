ALTER TABLE t_p83689144_profix_network_admin.clients
  ADD COLUMN IF NOT EXISTS totp_secret varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean DEFAULT false;

ALTER TABLE t_p83689144_profix_network_admin.managers
  ADD COLUMN IF NOT EXISTS totp_secret varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean DEFAULT false;

ALTER TABLE t_p83689144_profix_network_admin.technicians
  ADD COLUMN IF NOT EXISTS totp_secret varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS totp_enabled boolean DEFAULT false;