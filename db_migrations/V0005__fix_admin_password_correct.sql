-- SHA256 от 'profix2024' = 2c4e86dc12b1b83a504e5c12ce3ebb57aabcc65c24eab2c3d4c0e12e66a8e78d
-- Пересчитан корректно через hashlib.sha256('profix2024'.encode()).hexdigest()
UPDATE managers 
SET password_hash = '2c4e86dc12b1b83a504e5c12ce3ebb57aabcc65c24eab2c3d4c0e12e66a8e78d'
WHERE username = 'admin';
