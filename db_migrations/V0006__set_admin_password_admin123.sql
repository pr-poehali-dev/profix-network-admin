-- Сбрасываем пароль admin через временный маркер, чтобы пересоздать через API
-- Устанавливаем пароль 'admin123' (sha256: 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a)
UPDATE managers 
SET password_hash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a'
WHERE username = 'admin';
