INSERT INTO technicians (name, phone, specialization) VALUES
  ('Иван Петров', '+7 914 100-11-11', '1С, сети, компьютеры'),
  ('Алексей Сидоров', '+7 914 200-22-22', 'Кассы, ТСД, периферия'),
  ('Дмитрий Козлов', '+7 914 300-33-33', 'Видеонаблюдение, сети');

INSERT INTO clients (phone, name, email) VALUES
  ('+79145551111', 'ООО Рога и Копыта', 'rogoikopyta@mail.ru'),
  ('+79145552222', 'ИП Иванов А.А.', 'ivanov@yandex.ru'),
  ('+79145553333', 'Магазин Продукты 24', 'shop24@gmail.com')
ON CONFLICT (phone) DO NOTHING;
