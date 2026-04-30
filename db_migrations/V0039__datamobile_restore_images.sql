-- Восстанавливаем image в main_products DataMobile
UPDATE t_p83689144_profix_network_admin.site_content
SET value = '[
  {"id":"standart","name":"DataMobile Стандарт","price":"от 936 ₽","badge":null,"image":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/datamobile/dm_standart.png","description":"Начальная версия для терминалов сбора данных и мобильных устройств. Автоматизирует учёт товаров на складе, в магазине и организациях разного профиля.","features":["Приём и отгрузка товаров","Инвентаризация","Перемещение","Поддержка ТСД на Android"]},
  {"id":"standart_pro","name":"DataMobile Стандарт Pro","price":"от 1 716 ₽","badge":"Популярный","image":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/datamobile/dm_standart_pro.png","description":"Расширяет функционал Стандарта: работа по заданию, загрузка шаблонов этикеток и печать на мобильном принтере.","features":["Всё из Стандарта","Работа по заданию","Печать этикеток","Модули: Маркировка, RFID"]},
  {"id":"online_lite","name":"DataMobile Online Lite","price":"2 496 ₽","badge":null,"image":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/datamobile/dm_online_lite.png","description":"Работа в режиме реального времени с защитой от потери связи. Широкие возможности для работы на складе и в торговом зале.","features":["Онлайн-режим","Защита от потери связи","Модули: Маркировка, RFID","Работа в торговом зале"]},
  {"id":"online","name":"DataMobile Online","price":"от 3 120 ₽","badge":"Максимум","image":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/datamobile/dm_online.png","description":"Полноценный онлайн-режим, генерация новых штрихкодов на ТСД, отображение картинок из товароучётной системы.","features":["Полный онлайн-режим","Генерация штрихкодов","Картинки товаров из 1С","Все складские операции"]}
]'
WHERE key = 'partner.datamobile.main_products';

-- Восстанавливаем image в modules DataMobile
UPDATE t_p83689144_profix_network_admin.site_content
SET value = '[
  {"name":"Модуль Маркировка","price":"от 1 500 ₽","image":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/datamobile/dm_marking.png","description":"Готовое решение для работы с товарами обязательной маркировки (Честный Знак, ЕГАИС): табак, алкоголь, обувь, одежда, лекарства."},
  {"name":"Модуль RFID","price":"от 1 500 ₽","image":"https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/datamobile/dm_rfid.png","description":"Работа с RFID-метками: инвентаризация, приём и отгрузка. Поддержка считывателей RFID на Android-устройствах."}
]'
WHERE key = 'partner.datamobile.modules';
