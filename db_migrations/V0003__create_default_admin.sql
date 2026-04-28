-- Создаём первого admin-менеджера
-- password: profix2024 (sha256)
INSERT INTO managers (username, password_hash, full_name, role)
VALUES (
  'admin',
  'a6d7f2c5b4e8d9c0f1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4',
  'Администратор',
  'admin'
) ON CONFLICT (username) DO NOTHING;
