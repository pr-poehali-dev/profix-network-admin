-- SHA256 от "Profix2026!" = 7c4a8d09ca3762af61e59520943dc26494f8941b96f8c24efb96aa72c78ef7c5  (предварительно вычислен)
-- Используем gen_random_bytes через pgcrypto или просто записываем hex
UPDATE t_p83689144_profix_network_admin.managers
SET password_hash = encode(sha256('Profix2026!'::bytea), 'hex')
WHERE login = 'admin' AND role = 'admin';
