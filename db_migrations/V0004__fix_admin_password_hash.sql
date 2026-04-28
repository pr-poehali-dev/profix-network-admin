-- Обновляем хэш пароля для admin (profix2024 → sha256)
UPDATE managers 
SET password_hash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
WHERE username = 'admin';
