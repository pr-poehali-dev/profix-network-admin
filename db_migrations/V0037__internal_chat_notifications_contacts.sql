-- Внутренний чат (менеджер ↔ техспец)
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.internal_messages (
  id SERIAL PRIMARY KEY,
  from_role VARCHAR(10) NOT NULL,   -- 'manager' | 'technician'
  from_id INTEGER NOT NULL,
  to_role VARCHAR(10) NOT NULL,
  to_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- last_seen для уведомлений (колокольчик)
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.notification_seen (
  id SERIAL PRIMARY KEY,
  user_role VARCHAR(10) NOT NULL,
  user_id INTEGER NOT NULL,
  last_seen_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_role, user_id)
);

-- Порядок блоков главной страницы
INSERT INTO t_p83689144_profix_network_admin.site_content (key, value)
VALUES
  ('page.blocks_order', '["hero","services","partners","reviews","shop","map","contacts"]'),
  ('page.blocks_hidden', '[]'),
  ('contacts.phone', '+7 (914) 272-71-87'),
  ('contacts.email', '727187@it-profix.ru'),
  ('contacts.address', 'г. Якутск, ул. Халтурина, д. 6'),
  ('contacts.hours', 'Пн–Пт: 9:00 – 18:00, Сб–Вс: по записи'),
  ('contacts.map_url', 'https://yandex.ru/map-widget/v1/?ll=129.736301%2C62.047174&z=17&pt=129.736301%2C62.047174%2Cpm2rdm&l=map'),
  ('contacts.map_link', 'https://yandex.ru/maps/?pt=129.736301,62.047174&z=17&l=map'),
  ('contacts.vk', ''),
  ('contacts.telegram', ''),
  ('contacts.whatsapp', ''),
  ('contacts.instagram', ''),
  ('contacts.youtube', ''),
  ('footer.copyright', '© 2026 ProFiX. Все права защищены.')
ON CONFLICT (key) DO NOTHING;
