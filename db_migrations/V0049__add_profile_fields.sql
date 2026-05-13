-- Расширяем профиль клиентов
ALTER TABLE t_p83689144_profix_network_admin.clients
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS socials JSONB NULL,
  ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100) NULL;

-- Расширяем профиль менеджеров
ALTER TABLE t_p83689144_profix_network_admin.managers
  ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS address TEXT NULL,
  ADD COLUMN IF NOT EXISTS socials JSONB NULL;
