INSERT INTO t_p83689144_profix_network_admin.site_content (key, value) VALUES
('navbar.section_home', 'Главная'),
('navbar.section_services', 'Услуги'),
('navbar.section_1c', '1С'),
('navbar.section_about', 'О компании'),
('navbar.section_contacts', 'Контакты')
ON CONFLICT (key) DO NOTHING;