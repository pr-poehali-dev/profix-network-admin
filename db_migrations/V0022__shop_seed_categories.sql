INSERT INTO t_p83689144_profix_network_admin.shop_categories (name, slug, description, sort_order) VALUES
  ('Кассовое оборудование', 'kassy', 'ККТ, кассовые аппараты и сопутствующее оборудование', 1),
  ('Фискальные накопители', 'fn', 'ФН на 15 и 36 месяцев для онлайн-касс', 2),
  ('ОФД', 'ofd', 'Коды активации операторов фискальных данных', 3),
  ('Расходные материалы', 'rashodni', 'Картриджи, тонеры и расходники для принтеров', 4),
  ('Принтеры', 'printery', 'Лазерные и струйные принтеры', 5)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;