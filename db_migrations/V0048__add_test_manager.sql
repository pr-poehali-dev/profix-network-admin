INSERT INTO t_p83689144_profix_network_admin.managers 
  (username, login, password_hash, full_name, name, role, email)
SELECT 'manager_test', 'manager_test',
  encode(sha256('Test1234!'::bytea), 'hex'),
  'Тестовый менеджер', 'Тестовый менеджер', 'manager', 'manager_test@profix.ru'
WHERE NOT EXISTS (
  SELECT 1 FROM t_p83689144_profix_network_admin.managers WHERE login = 'manager_test'
);
