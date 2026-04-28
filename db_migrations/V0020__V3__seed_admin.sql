INSERT INTO managers (login, username, password_hash, full_name, name, role)
VALUES ('admin', 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'Администратор', 'Администратор', 'admin')
ON CONFLICT (login) DO NOTHING;
