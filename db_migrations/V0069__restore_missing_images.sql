UPDATE t_p83689144_profix_network_admin.site_content
SET value = '[{"icon":"MessageCircle","title":"Консультации по 1С","desc":"Обучаем сотрудников, отвечаем на вопросы по работе с 1С, помогаем разобраться с учётом и отчётностью.","img":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/e16550dc-509c-4fd9-96fb-c4c0207f02db.jpg"},{"icon":"Code","title":"Разработка в 1С","desc":"Дорабатываем типовые конфигурации и создаём новые модули под ваши задачи. Автоматизируем любые бизнес-процессы.","img":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/b7f3a191-b260-448e-ada8-a6797fa382ea.jpg"},{"icon":"ClipboardList","title":"Решение задач по учёту","desc":"Помогаем наладить бухгалтерский, складской и управленческий учёт. Решаем любые нестандартные ситуации.","img":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/725ba446-1ed9-4b83-8f8b-e88f54863a9b.jpg"},{"icon":"ShoppingCart","title":"Продажа программ 1С","desc":"Официальная продажа лицензионных продуктов 1С: Бухгалтерия, Торговля, Зарплата и другие конфигурации.","img":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/84861997-f7f0-4d57-b2b4-1fc35e2624c9.jpg"},{"icon":"its","title":"1С:ИТС","desc":"","img":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/686a1153-fccf-4bd9-93ab-d671fdf32fb6.jpg"},{"icon":"Star","title":"Внедрение 1с","desc":"Установка и запуск программ 1С с нуля. Настраиваем под специфику вашего бизнеса, переносим данные из старых систем.","img":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/17b64986-527e-4f3b-b669-7333f9fd8f96.jpg"}]'
WHERE key = 'onec.items';

UPDATE t_p83689144_profix_network_admin.site_content
SET value = 'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/a998ecb6-729f-40eb-8290-b6ea2718207a.jpg'
WHERE key = 'about.image';

UPDATE t_p83689144_profix_network_admin.shop_products
SET image_url = 'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/f30168ab-f0e3-47cc-ad04-2b83909e779c.jpg'
WHERE id = 8;

UPDATE t_p83689144_profix_network_admin.shop_products
SET image_url = 'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/23d1377b-f3ed-46bc-9d10-4ed228082b63.jpg'
WHERE id IN (5, 6);

UPDATE t_p83689144_profix_network_admin.shop_products
SET image_url = 'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/840b9228-1da7-4b02-99f3-3bd8cdf4c39a.jpg'
WHERE id = 7;