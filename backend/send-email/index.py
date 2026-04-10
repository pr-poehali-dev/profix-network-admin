import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """Отправляет заявку с сайта ProFiX на почту компании."""

    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers, "body": ""}

    body = json.loads(event.get("body") or "{}")
    name = body.get("name", "").strip()
    phone = body.get("phone", "").strip()
    email = body.get("email", "").strip()
    topic = body.get("topic", "").strip()
    problem = body.get("problem", "").strip()

    if not name or not phone or not problem:
        return {
            "statusCode": 400,
            "headers": cors_headers,
            "body": json.dumps({"error": "Заполните обязательные поля"}, ensure_ascii=False),
        }

    smtp_host = os.environ["SMTP_HOST"]
    smtp_port = int(os.environ["SMTP_PORT"])
    smtp_user = os.environ["SMTP_USER"]
    smtp_password = os.environ["SMTP_PASSWORD"]
    to_email = "727187@it-profix.ru"

    msg = MIMEMultipart("alternative")
    subject_topic = f" — {topic}" if topic else ""
    msg["Subject"] = f"Новая заявка с сайта от {name}{subject_topic}"
    msg["From"] = smtp_user
    msg["To"] = to_email

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1565C0; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Новая заявка с сайта ProFiX</h1>
        </div>
        <div style="background: #f7f9fc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; width: 120px;">Имя</td>
                    <td style="padding: 10px 0; font-weight: 600; font-size: 15px;">{name}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Телефон</td>
                    <td style="padding: 10px 0; font-weight: 600; font-size: 15px;">
                        <a href="tel:{phone}" style="color: #1565C0; text-decoration: none;">{phone}</a>
                    </td>
                </tr>
                {"" if not email else f'''<tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Email</td>
                    <td style="padding: 10px 0; font-size: 15px;">{email}</td>
                </tr>'''}
                {"" if not topic else f'''<tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">Тема</td>
                    <td style="padding: 10px 0; font-size: 15px;">
                        <span style="background: #edf7e8; color: #2d8a10; font-weight: 600; padding: 3px 10px; border-radius: 20px;">{topic}</span>
                    </td>
                </tr>'''}
                <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 10px 0; color: #6b7280; font-size: 13px; vertical-align: top;">Проблема</td>
                    <td style="padding: 10px 0; font-size: 15px; line-height: 1.5;">{problem}</td>
                </tr>
            </table>
            <div style="margin-top: 20px; padding: 12px 16px; background: #EBF3FF; border-radius: 8px; font-size: 13px; color: #374151;">
                Письмо отправлено автоматически с сайта it-profix.ru
            </div>
        </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(html, "html", "utf-8"))

    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"ok": True}, ensure_ascii=False),
    }