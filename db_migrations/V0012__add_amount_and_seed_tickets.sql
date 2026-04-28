ALTER TABLE tickets ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE;

INSERT INTO tickets (client_id, title, description, status, priority, amount, source)
SELECT id, 'Внедрение 1С:Розница', 'Клиент открывает новый магазин. Нужно установить и настроить 1С:Розница с подключением кассы АТОЛ.', 'new', 'high', 15000, 'manual'
FROM clients WHERE phone = '+79145551111' LIMIT 1;

INSERT INTO tickets (client_id, title, description, status, priority, amount, source)
SELECT id, 'Регистрация онлайн-кассы в ФНС', 'ИП Иванов купил кассу Дримкас, нужно зарегистрировать в ФНС и подключить к ОФД Яндекс.', 'in_progress', 'normal', 3500, 'manual'
FROM clients WHERE phone = '+79145552222' LIMIT 1;

INSERT INTO tickets (client_id, title, description, status, priority, amount, source)
SELECT id, 'Монтаж видеонаблюдения', 'Установить 4 камеры наружного наблюдения + регистратор. Адрес: ул. Ленина 12.', 'waiting', 'urgent', 28000, 'manual'
FROM clients WHERE phone = '+79145553333' LIMIT 1;

INSERT INTO tickets (client_id, title, description, status, priority, amount, paid, source)
SELECT id, 'Заправка картриджей (5 шт)', 'Заправить 5 картриджей HP LaserJet. 3 штуки уже привезли в офис.', 'done', 'low', 2500, TRUE, 'manual'
FROM clients WHERE phone = '+79145551111' LIMIT 1;
