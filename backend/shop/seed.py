"""
Сидер тестовых данных магазина. Запускается вручную один раз.
"""
import os
import psycopg2

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

CATEGORIES = [
    ("Кассовое оборудование", "kassy", "ККТ, кассовые аппараты и сопутствующее оборудование", 1),
    ("Фискальные накопители", "fn", "ФН на 15 и 36 месяцев для онлайн-касс", 2),
    ("ОФД", "ofd", "Коды активации операторов фискальных данных", 3),
    ("Расходные материалы", "rashodni", "Картриджи, тонеры и расходники для принтеров", 4),
    ("Принтеры", "printery", "Лазерные и струйные принтеры", 5),
]

PRODUCTS = [
    {
        "category_slug": "rashodni",
        "name": "Картридж HP 85A (CE285A)",
        "description": "Оригинальный лазерный картридж HP 85A для принтеров HP LaserJet Pro P1102, P1102w, M1132, M1212nf. Ресурс — 1600 страниц при 5% заполнении. Обеспечивает высокое качество печати и надёжную работу устройства.",
        "price": 3490,
        "price_old": 3990,
        "sku": "CE285A",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/36328b98-8f3b-4cda-9d43-4b29bb1b5bd1.jpg",
        "sort_order": 1,
    },
    {
        "category_slug": "rashodni",
        "name": "Картридж HP 12A (Q2612A)",
        "description": "Оригинальный лазерный картридж HP 12A для принтеров HP LaserJet 1010, 1012, 1015, 1018, 1020, 1022, 3015, 3020, 3030. Ресурс — 2000 страниц при 5% заполнении. Стабильное качество печати на протяжении всего срока службы.",
        "price": 3190,
        "price_old": 3690,
        "sku": "Q2612A",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/d95c5673-4434-4459-85e3-551d040ec4fa.jpg",
        "sort_order": 2,
    },
    {
        "category_slug": "printery",
        "name": "Принтер Samsung Xpress SL-M3400ND",
        "description": "Монохромный лазерный принтер формата A4 со скоростью печати до 35 стр/мин. Поддерживает автоматическую двустороннюю печать и подключение по USB и сети Ethernet. Ресурс картриджа — до 5000 страниц. Идеален для малого и среднего офиса.",
        "price": 18900,
        "price_old": 22500,
        "sku": "SL-M3400ND",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/7b480da4-bcfe-420d-8269-ca3c4a3d9f8e.jpg",
        "sort_order": 1,
    },
    {
        "category_slug": "kassy",
        "name": "ККТ АТОЛ 30Ф",
        "description": "Компактная онлайн-касса АТОЛ 30Ф с термопечатью и встроенным модулем передачи данных в ОФД. Поддерживает все форматы фискальных данных (ФФД 1.05, 1.1, 1.2). Подходит для торговли, услуг, общепита. В комплекте кабель USB и блок питания.",
        "price": 8990,
        "price_old": 10500,
        "sku": "ATOL-30F",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/2ab6eab1-153c-4d9b-86e4-e5c56410d4b4.jpg",
        "sort_order": 1,
    },
    {
        "category_slug": "fn",
        "name": "Фискальный накопитель ФН-1.1М на 15 месяцев",
        "description": "Фискальный накопитель ФН-1.1М сроком действия 15 месяцев. Применяется в онлайн-кассах при сезонном режиме работы, торговле подакцизными товарами или при работе на ОСНО. Совместим со всеми сертифицированными ККТ.",
        "price": 6500,
        "price_old": None,
        "sku": "FN-15",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/79f4245e-3de2-4122-a9e5-333521bfab38.jpg",
        "sort_order": 1,
    },
    {
        "category_slug": "fn",
        "name": "Фискальный накопитель ФН-1.1М на 36 месяцев",
        "description": "Фискальный накопитель ФН-1.1М сроком действия 36 месяцев. Для ИП и организаций на УСН, ЕСХН, ПСН без торговли подакцизными товарами. Позволяет сократить расходы на замену — срок действия 3 года. Совместим со всеми ККТ.",
        "price": 9200,
        "price_old": None,
        "sku": "FN-36",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/79f4245e-3de2-4122-a9e5-333521bfab38.jpg",
        "sort_order": 2,
    },
    {
        "category_slug": "ofd",
        "name": "Код активации ОФД СБИС на 1 год",
        "description": "Код активации для подключения онлайн-кассы к оператору фискальных данных СБИС (Тензор) на 12 месяцев. Передача данных в ФНС в режиме реального времени, личный кабинет с отчётностью и статистикой. Активация в течение 24 часов.",
        "price": 3000,
        "price_old": 3500,
        "sku": "SBIS-OFD-1Y",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/ff4fb0e7-cf8c-4156-bd34-fad3ef40c673.jpg",
        "sort_order": 1,
    },
    {
        "category_slug": "ofd",
        "name": "Код активации ОФД Яндекс на 1 год",
        "description": "Код активации для подключения онлайн-кассы к Яндекс ОФД на 12 месяцев. Надёжная передача фискальных данных в ФНС, удобный личный кабинет, поддержка 24/7. Совместим со всеми сертифицированными ККТ. Активация онлайн.",
        "price": 3000,
        "price_old": 3500,
        "sku": "YANDEX-OFD-1Y",
        "in_stock": True,
        "image_url": "https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/files/dc5625ca-48cc-4e6f-a7a4-5fc57c880ab3.jpg",
        "sort_order": 2,
    },
]


def run():
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # Создаём категории
    slug_to_id = {}
    for name, slug, desc, sort in CATEGORIES:
        cur.execute(
            f"INSERT INTO {SC}.shop_categories (name, slug, description, sort_order) "
            f"VALUES (%s, %s, %s, %s) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name RETURNING id",
            (name, slug, desc, sort)
        )
        row = cur.fetchone()
        slug_to_id[slug] = row[0]

    # Создаём товары
    for p in PRODUCTS:
        cat_id = slug_to_id.get(p["category_slug"])
        cur.execute(
            f"""INSERT INTO {SC}.shop_products
                (category_id, name, description, price, price_old, sku, in_stock, is_active, image_url, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING""",
            (
                cat_id, p["name"], p["description"],
                p["price"], p.get("price_old"),
                p["sku"], p["in_stock"], True,
                p["image_url"], p["sort_order"],
            )
        )

    conn.commit()
    cur.close()
    conn.close()
    print("Seed completed!")


if __name__ == "__main__":
    run()
