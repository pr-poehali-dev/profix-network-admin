import json
import os
import smtplib
import psycopg2
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from urllib.request import urlopen, Request

SC = os.environ.get("MAIN_DB_SCHEMA") or "t_p83689144_profix_network_admin"

def get_requisites() -> dict:
    try:
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        cur = conn.cursor()
        cur.execute(f"SELECT key, value FROM {SC}.site_content WHERE key LIKE 'requisites.%%'")
        rows = cur.fetchall()
        cur.close(); conn.close()
        return {r[0].replace("requisites.", ""): r[1] for r in rows}
    except Exception:
        return {}


def send_telegram(token: str, chat_id: str, text: str) -> None:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = json.dumps({"chat_id": chat_id, "text": text, "parse_mode": "HTML"}).encode()
    req = Request(url, data=data, headers={"Content-Type": "application/json"})
    urlopen(req, timeout=5)


def handler(event: dict, context) -> dict:
    """Отправляет заявку с сайта ProFiX на почту и в Telegram."""

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

    req_data = get_requisites()
    company  = req_data.get("company_short", "ООО «ПРОФИКС»")
    inn      = req_data.get("inn", "1435253577")
    ogrn     = req_data.get("ogrn", "1121435005790")
    address  = req_data.get("legal_address", "677009, г. Якутск, ул. Халтурина, 6")
    bank     = req_data.get("bank_name", "")
    account  = req_data.get("account", "")
    bik      = req_data.get("bik", "")
    director = req_data.get("director", "")

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
                Письмо отправлено автоматически с сайта pfx.su
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

    tg_token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    tg_chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if tg_token and tg_chat_id:
        topic_line = f"\n🏷 <b>Тема:</b> {topic}" if topic else ""
        email_line = f"\n📧 <b>Email:</b> {email}" if email else ""
        tg_text = (
            f"📩 <b>Новая заявка с сайта ProFiX</b>\n"
            f"👤 <b>Имя:</b> {name}\n"
            f"📞 <b>Телефон:</b> {phone}"
            f"{email_line}"
            f"{topic_line}\n"
            f"💬 <b>Сообщение:</b> {problem}"
        )
        try:
            send_telegram(tg_token, tg_chat_id, tg_text)
        except Exception:
            pass

    # ── Подтверждение клиенту (если указан email) ────────────────────────────
    if email:
        req_rows = ""
        if inn:
            req_rows += f"<tr><td style='padding:6px 0;color:#6b7280;font-size:12px;width:160px'>ИНН</td><td style='padding:6px 0;font-size:13px'>{inn}</td></tr>"
        if ogrn:
            req_rows += f"<tr style='border-top:1px solid #e5e7eb'><td style='padding:6px 0;color:#6b7280;font-size:12px'>ОГРН</td><td style='padding:6px 0;font-size:13px'>{ogrn}</td></tr>"
        if address:
            req_rows += f"<tr style='border-top:1px solid #e5e7eb'><td style='padding:6px 0;color:#6b7280;font-size:12px'>Адрес</td><td style='padding:6px 0;font-size:13px'>{address}</td></tr>"
        if bank:
            req_rows += f"<tr style='border-top:1px solid #e5e7eb'><td style='padding:6px 0;color:#6b7280;font-size:12px'>Банк</td><td style='padding:6px 0;font-size:13px'>{bank}</td></tr>"
        if account:
            req_rows += f"<tr style='border-top:1px solid #e5e7eb'><td style='padding:6px 0;color:#6b7280;font-size:12px'>Расчётный счёт</td><td style='padding:6px 0;font-size:13px'>{account}</td></tr>"
        if bik:
            req_rows += f"<tr style='border-top:1px solid #e5e7eb'><td style='padding:6px 0;color:#6b7280;font-size:12px'>БИК</td><td style='padding:6px 0;font-size:13px'>{bik}</td></tr>"
        if director:
            req_rows += f"<tr style='border-top:1px solid #e5e7eb'><td style='padding:6px 0;color:#6b7280;font-size:12px'>Руководитель</td><td style='padding:6px 0;font-size:13px'>{director}</td></tr>"

        req_block = ""
        if req_rows:
            req_block = f"""
            <div style="margin-top:24px;">
              <h3 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 12px">Реквизиты {company}</h3>
              <table style="width:100%;border-collapse:collapse;">{req_rows}</table>
              <p style="margin-top:12px;font-size:12px;color:#9ca3af">
                Полные реквизиты: <a href="https://pfx.su/requisites" style="color:#3ca615">pfx.su/requisites</a>
              </p>
            </div>"""

        client_html = f"""
        <html><body style="font-family:Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#3ca615;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="color:white;margin:0;font-size:20px;">Заявка принята!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">{company}</p>
          </div>
          <div style="background:#f7f9fc;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;">
            <p style="font-size:15px;color:#374151;">Здравствуйте, <b>{name}</b>!</p>
            <p style="font-size:14px;color:#6b7280;line-height:1.6;">
              Ваша заявка принята. Наш специалист свяжется с вами по номеру <b>{phone}</b> в ближайшее время.
            </p>
            {"" if not topic else f"<p style='font-size:13px;color:#374151;'><b>Тема:</b> {topic}</p>"}
            {req_block}
            <div style="margin-top:20px;padding:12px 16px;background:#edf7e8;border-radius:8px;font-size:13px;color:#374151;">
              По всем вопросам: <a href="mailto:727187@it-profix.ru" style="color:#3ca615">727187@it-profix.ru</a> · <a href="https://pfx.su" style="color:#3ca615">pfx.su</a>
            </div>
          </div>
        </body></html>"""

        try:
            cmsg = MIMEMultipart("alternative")
            cmsg["Subject"] = f"Заявка принята — {company}"
            cmsg["From"] = smtp_host and os.environ["SMTP_USER"]
            cmsg["To"] = email
            cmsg.attach(MIMEText(client_html, "html", "utf-8"))
            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port) as srv:
                    srv.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
                    srv.sendmail(os.environ["SMTP_USER"], email, cmsg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port) as srv:
                    srv.starttls()
                    srv.login(os.environ["SMTP_USER"], os.environ["SMTP_PASSWORD"])
                    srv.sendmail(os.environ["SMTP_USER"], email, cmsg.as_string())
        except Exception:
            pass  # не блокируем успех если клиентское письмо не ушло

    return {
        "statusCode": 200,
        "headers": cors_headers,
        "body": json.dumps({"ok": True}, ensure_ascii=False),
    }