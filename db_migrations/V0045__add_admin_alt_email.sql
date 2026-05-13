-- Добавляем второй email для смены логина/пароля admin
-- Создаём запись с альтернативным email (если нет — добавим как доп. менеджера-себя)
-- Обновляем admin: добавляем запись о втором email через отдельную таблицу не нужно,
-- просто обновим: admin может войти и по crash16@mail.ru через manager_login_email
-- Для этого достаточно разрешить оба email в бэкенде (уже сделано)
-- Дополнительно: создадим второй manager-аккаунт с этим email (shadow), чтобы reset работал
INSERT INTO t_p83689144_profix_network_admin.managers 
  (username, login, password_hash, full_name, name, role, email)
SELECT 'admin_alt', 'admin_alt', 
  (SELECT password_hash FROM t_p83689144_profix_network_admin.managers WHERE login='admin'),
  'Администратор', 'Администратор', 'admin', 'crash16@mail.ru'
WHERE NOT EXISTS (
  SELECT 1 FROM t_p83689144_profix_network_admin.managers WHERE email='crash16@mail.ru'
);
