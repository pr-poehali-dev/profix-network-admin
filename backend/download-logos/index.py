"""Скачивает логотипы партнёров с рабочих URL и сохраняет их в S3"""
import os
import json
import boto3
import urllib.request

LOGOS = [
    ("datamobile", "https://data-mobile.ru/wp-content/uploads/logo-dm.png", "image/png"),
    ("poscenter", "https://pos-center.ru/img/logo.png", "image/png"),
    ("1c", "https://1c.ru/fav.svg", "image/svg+xml"),
    ("dreamkas", "https://dreamkas.ru/favicon.svg", "image/svg+xml"),
    ("atol", "https://atol.ru/local/templates/main_new/images/logo.svg", "image/svg+xml"),
    ("saby", "https://online.sbis.ru/shared/disk/f2bc2e3d-b9ab-4a32-94a5-4c3be7d8de7e", "image/png"),
    ("ofd-yandex", "https://ofd.yandex.ru/favicon.ico", "image/x-icon"),
    ("platformaofd", "https://platformaofd.ru/wp-content/uploads/2024/09/logo-ofd-1200-675.png", "image/png"),
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}, "body": ""}

    s3 = boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

    key_id = os.environ["AWS_ACCESS_KEY_ID"]
    results = []

    for name, url, content_type in LOGOS:
        ext = "png" if "png" in content_type else "svg"
        s3_key = f"partners/{name}.{ext}"

        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()

            s3.put_object(
                Bucket="files",
                Key=s3_key,
                Body=data,
                ContentType=content_type,
            )
            cdn_url = f"https://cdn.poehali.dev/projects/{key_id}/bucket/{s3_key}"
            results.append({"name": name, "url": cdn_url, "status": "ok"})
        except Exception as e:
            results.append({"name": name, "error": str(e), "status": "fail"})

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        "body": json.dumps({"results": results}),
    }