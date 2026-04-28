-- Добавляем алиасы колонок в managers для совместимости с новым кодом
ALTER TABLE managers ADD COLUMN IF NOT EXISTS login VARCHAR(50);
ALTER TABLE managers ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Копируем данные из старых колонок
UPDATE managers SET login = username, name = full_name WHERE login IS NULL;

-- Добавляем уникальность на login
CREATE UNIQUE INDEX IF NOT EXISTS idx_managers_login ON managers(login);
