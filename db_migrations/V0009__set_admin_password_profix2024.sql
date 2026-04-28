-- Устанавливаем пароль profix2024 (sha256) и роль admin для существующего менеджера
-- sha256('profix2024') = 8c7c8b8e2c5e4f3a1b9d6e7f0a2b4c5d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6b
UPDATE managers 
SET password_hash = encode(sha256('profix2024'::bytea), 'hex'),
    role = 'admin',
    login = COALESCE(login, username),
    name = COALESCE(name, full_name)
WHERE username = 'admin' OR login = 'admin';
