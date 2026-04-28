-- Устанавливаем PIN 1111 для Ивана Петрова, 2222 для Алексея Сидорова, 3333 для Дмитрия Козлова
UPDATE technicians SET pin_code = '1111' WHERE name = 'Иван Петров';
UPDATE technicians SET pin_code = '2222' WHERE name = 'Алексей Сидоров';
UPDATE technicians SET pin_code = '3333' WHERE name = 'Дмитрий Козлов';
