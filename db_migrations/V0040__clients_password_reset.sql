-- Добавляем поля для входа по паролю для клиентов
ALTER TABLE t_p83689144_profix_network_admin.clients
  ADD COLUMN IF NOT EXISTS password_hash varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS reset_token varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS reset_expires_at timestamp NULL;
