-- Новые ключи контактов: соцсети, телефон href, футер
INSERT INTO t_p83689144_profix_network_admin.site_content (key, value) VALUES
  ('contacts.phone_href', 'tel:+79142727187'),
  ('contacts.vk',         ''),
  ('contacts.telegram',   ''),
  ('contacts.whatsapp',   ''),
  ('contacts.instagram',  ''),
  ('footer.copyright',    ''),
  ('footer.logo',         '')
ON CONFLICT (key) DO NOTHING;
