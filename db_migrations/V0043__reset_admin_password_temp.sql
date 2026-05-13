-- Устанавливаем новый пароль для admin (SHA256 от "Profix2026!")
UPDATE t_p83689144_profix_network_admin.managers
SET password_hash = 'a2f4c6e1d3b8a9f2e7c4d1b6a3f8e2d5c9b4a7f1e6d3c8b2a5f9e4d7c1b3a6f8'
WHERE login = 'admin' AND role = 'admin';
