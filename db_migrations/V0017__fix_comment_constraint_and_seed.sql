ALTER TABLE ticket_comments DROP CONSTRAINT IF EXISTS ticket_comments_author_type_check;
ALTER TABLE ticket_comments ADD CONSTRAINT ticket_comments_author_type_check
  CHECK (author_type IN ('client', 'manager', 'technician'));

INSERT INTO ticket_comments (ticket_id, author_type, author_id, text) VALUES
  (5, 'manager', 1, 'Клиент звонил — проблема после автообновления вчера в 23:00. Касса АТОЛ 30Ф, прошивка 3.9.'),
  (5, 'technician', 1, 'Выезжаю в 9:45. Предварительно — сброшу настройки обмена и перенастрою. Возможно нужно обновить драйвер кассы.'),
  (5, 'manager', 1, 'Хорошо, клиент предупреждён. Ждут с 10:00.'),
  (8, 'manager', 1, 'Клиент просит успеть до 13:00 — после обед, склад закроют.'),
  (8, 'technician', 2, 'Понял. DataMobile скачан, лицензии активированы. Буду в 11:00.'),
  (11, 'manager', 1, 'Клиент оплатил аванс 15 000 руб. Остаток 20 000 — по завершению работ.'),
  (11, 'technician', 3, 'Приехал на объект. Начинаю разметку под камеры. Кабеля хватает, лестница на месте.'),
  (11, 'manager', 1, 'Отлично, держи в курсе!');
