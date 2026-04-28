"""Скачивает логотипы партнёров и картинки DataMobile с Яндекс.Диска, сохраняет в S3"""
import os
import json
import boto3
import urllib.request
import urllib.parse

YANDEX_PUBLIC_KEY = "https://disk.yandex.ru/d/oJbmdVgVw_UYSg"

DATAMOBILE_FILES = [
    ("dm_standart",     "/Макеты коробок ПО/Без фона/Коробка DataMobile Стандарт.png",          "image/png"),
    ("dm_standart_pro", "/Макеты коробок ПО/Без фона/Коробка  DataMobile Стандарт Pro.png",      "image/png"),
    ("dm_online_lite",  "/Макеты коробок ПО/Без фона/Коробка DataMobile Online Lite.png",         "image/png"),
    ("dm_online",       "/Макеты коробок ПО/Без фона/Коробка DataMobile Online.png",              "image/png"),
    ("dm_marking",      "/Макеты коробок ПО/Без фона/Коробка DataMobile модуль Маркировка.png",   "image/png"),
    ("dm_rfid",         "/Макеты коробок ПО/Без фона/Коробка DataMobile модуль RFID.png",         "image/png"),
    ("dm_banner",       "/Баннеры/DataMobile_1920х759_1.jpg",                                      "image/jpeg"),
    ("dm_banner2",      "/Баннеры/DataMobile_800х450.jpg",                                         "image/jpeg"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "*/*",
}


def get_yandex_download_url(file_path: str) -> str:
    api_url = (
        "https://cloud-api.yandex.net/v1/disk/public/resources/download"
        f"?public_key={urllib.parse.quote(YANDEX_PUBLIC_KEY)}"
        f"&path={urllib.parse.quote(file_path)}"
    )
    req = urllib.request.Request(api_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    return data["href"]


def handler(event: dict, context) -> dict:
    """Скачивает картинки DataMobile с Яндекс.Диска и сохраняет в S3."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
            "body": "",
        }

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )
    key_id = os.environ["AWS_ACCESS_KEY_ID"]
    results = []

    for s3_name, file_path, content_type in DATAMOBILE_FILES:
        ext = "jpg" if "jpeg" in content_type else "png"
        s3_key = f"datamobile/{s3_name}.{ext}"
        try:
            download_url = get_yandex_download_url(file_path)
            req = urllib.request.Request(download_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = resp.read()
            s3.put_object(Bucket="files", Key=s3_key, Body=data, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{key_id}/bucket/{s3_key}"
            results.append({"name": s3_name, "url": cdn_url, "status": "ok"})
        except Exception as e:
            results.append({"name": s3_name, "file": file_path, "error": str(e), "status": "fail"})

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps({"results": results}, ensure_ascii=False),
    }