-- Поля пароля и сброса для техников
ALTER TABLE t_p83689144_profix_network_admin.technicians
  ADD COLUMN IF NOT EXISTS password_hash character varying(64),
  ADD COLUMN IF NOT EXISTS reset_token character varying(64),
  ADD COLUMN IF NOT EXISTS reset_expires_at timestamp without time zone;

-- Поля сброса пароля для менеджеров
ALTER TABLE t_p83689144_profix_network_admin.managers
  ADD COLUMN IF NOT EXISTS email character varying(150),
  ADD COLUMN IF NOT EXISTS reset_token character varying(64),
  ADD COLUMN IF NOT EXISTS reset_expires_at timestamp without time zone;
