-- Восстанавливаем правильный SHA256 от "Profix2026!"
UPDATE t_p83689144_profix_network_admin.managers
SET password_hash = encode(sha256('Profix2026!'::bytea), 'hex')
WHERE login = 'admin';

-- Синхронизируем пароль для alt-аккаунта
UPDATE t_p83689144_profix_network_admin.managers
SET password_hash = encode(sha256('Profix2026!'::bytea), 'hex')
WHERE login = 'admin_alt';
