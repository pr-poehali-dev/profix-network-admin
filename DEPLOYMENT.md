# 🚀 ProFiX — Инструкция по развёртке на своём сервере

## Обзор архитектуры

```
[Клиент / Браузер]
        │
        ▼
[Nginx / Apache] ──► [React SPA (статика)]
        │
        ▼
[Backend API] ──► Python 3.11 (FastAPI / Flask / bare WSGI)
        │
        ├──► [PostgreSQL] — БД
        ├──► [S3 / MinIO] — хранилище файлов
        └──► [SMTP] — почта
```

---

## Требования к серверу

| Компонент | Минимум | Рекомендуется |
|-----------|---------|---------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Диск | 20 GB SSD | 40 GB SSD |
| ОС | Ubuntu 20.04+ | Ubuntu 22.04 LTS |
| Python | 3.11 | 3.11 |
| Node.js | 18+ | 20 LTS |
| PostgreSQL | 14+ | 15 |

---

## Шаг 1 — Подготовка сервера

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем зависимости
sudo apt install -y nginx python3.11 python3.11-venv python3-pip \
  postgresql postgresql-contrib curl git unzip

# Устанавливаем Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Устанавливаем bun (быстрый пакетный менеджер)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

---

## Шаг 2 — База данных (PostgreSQL)

```bash
# Переходим в postgres пользователя
sudo -u postgres psql

-- Создаём пользователя и БД
CREATE USER profix WITH PASSWORD 'ВАШ_ПАРОЛЬ';
CREATE DATABASE profix_db OWNER profix;
GRANT ALL PRIVILEGES ON DATABASE profix_db TO profix;
\q
```

**Строка подключения:**
```
postgresql://profix:ВАШ_ПАРОЛЬ@localhost:5432/profix_db
```

### Применение миграций

```bash
# Клонируем репо
git clone https://github.com/ВАШ_РЕПО/profix.git /opt/profix
cd /opt/profix

# Создаём виртуальное окружение для миграций
python3.11 -m venv /opt/profix/venv
source /opt/profix/venv/bin/activate
pip install psycopg2-binary

# Применяем все миграции по порядку
cd db_migrations
for f in $(ls V*.sql | sort); do
  echo "Applying: $f"
  psql "postgresql://profix:ВАШ_ПАРОЛЬ@localhost:5432/profix_db" -f "$f"
done
```

> **Важно:** Схема называется `public`. В коде бэкенда схема задаётся через переменную окружения `MAIN_DB_SCHEMA`. По умолчанию используется схема из миграций.

---

## Шаг 3 — Хранилище файлов (MinIO / S3)

### Вариант A: MinIO (локально)

```bash
# Устанавливаем MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio
sudo mv minio /usr/local/bin/

# Создаём директорию
sudo mkdir -p /data/minio
sudo useradd -r minio-user -s /sbin/nologin
sudo chown minio-user:minio-user /data/minio

# Systemd сервис
sudo tee /etc/systemd/system/minio.service > /dev/null <<EOF
[Unit]
Description=MinIO
After=network.target

[Service]
User=minio-user
Environment="MINIO_ROOT_USER=minioadmin"
Environment="MINIO_ROOT_PASSWORD=ВАШ_ПАРОЛЬ_MINIO"
ExecStart=/usr/local/bin/minio server /data/minio --console-address :9001
Restart=always
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable minio
sudo systemctl start minio
```

После запуска:
- Откройте http://ВАШ_IP:9001
- Создайте bucket с именем `files`
- Создайте Access Key + Secret Key

### Вариант B: Yandex Cloud S3 / AWS S3

Просто получите `AWS_ACCESS_KEY_ID` и `AWS_SECRET_ACCESS_KEY` в консоли провайдера.

---

## Шаг 4 — Бэкенд (Python API)

Каждая функция из `backend/` — это отдельный HTTP-эндпоинт. Мы объединяем их в одно Flask-приложение.

```bash
cd /opt/profix

# Устанавливаем зависимости
source venv/bin/activate
pip install flask flask-cors psycopg2-binary boto3 gunicorn
```

### Создаём единый сервер

```bash
cat > /opt/profix/server.py << 'PYEOF'
import importlib.util, os, sys
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Загружаем все backend-модули
MODULES = {}
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
for name in os.listdir(backend_dir):
    init_file = os.path.join(backend_dir, name, "index.py")
    if os.path.exists(init_file):
        spec = importlib.util.spec_from_file_location(f"backend.{name}", init_file)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        MODULES[name] = mod

def make_event(req):
    body = req.get_data(as_text=True) or ""
    return {
        "httpMethod": req.method,
        "path": req.path,
        "headers": dict(req.headers),
        "queryStringParameters": dict(req.args),
        "body": body,
    }

class FakeContext:
    request_id = "local"

@app.route("/api/<module>", methods=["GET","POST","PUT","DELETE","OPTIONS"])
@app.route("/api/<module>/<path:subpath>", methods=["GET","POST","PUT","DELETE","OPTIONS"])
def handle(module, subpath=""):
    mod = MODULES.get(module)
    if not mod:
        return jsonify({"error": f"Module '{module}' not found"}), 404
    event = make_event(request)
    result = mod.handler(event, FakeContext())
    body = result.get("body", "")
    headers = result.get("headers", {})
    status = result.get("statusCode", 200)
    resp = app.response_class(response=body, status=status,
                               mimetype=headers.get("Content-Type","application/json"))
    for k, v in headers.items():
        resp.headers[k] = v
    return resp

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=False)
PYEOF
```

### Переменные окружения

```bash
cat > /opt/profix/.env << 'EOF'
# База данных
DATABASE_URL=postgresql://profix:ВАШ_ПАРОЛЬ@localhost:5432/profix_db
MAIN_DB_SCHEMA=public

# S3 / MinIO
AWS_ACCESS_KEY_ID=ваш_access_key
AWS_SECRET_ACCESS_KEY=ваш_secret_key
# Для MinIO локально:
S3_ENDPOINT=http://localhost:9000
# Для Yandex Cloud:
# S3_ENDPOINT=https://storage.yandexcloud.net

# SMTP (для email уведомлений)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@gmail.com
SMTP_PASSWORD=ваш_app_пароль

# Telegram бот (опционально)
TELEGRAM_BOT_TOKEN=ваш_токен
EOF
```

> **Важно:** В коде бэкенда S3 endpoint захардкожен как `https://bucket.poehali.dev`. При развёртке нужно заменить на свой. Ищите в файлах `backend/*/index.py` строку `endpoint_url='https://bucket.poehali.dev'` и замените на `os.environ.get('S3_ENDPOINT', 'http://localhost:9000')`.

### Systemd сервис

```bash
sudo tee /etc/systemd/system/profix-api.service > /dev/null << EOF
[Unit]
Description=ProFiX API Server
After=network.target postgresql.service

[Service]
User=www-data
WorkingDirectory=/opt/profix
EnvironmentFile=/opt/profix/.env
ExecStart=/opt/profix/venv/bin/gunicorn --workers 4 --bind 0.0.0.0:8080 server:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable profix-api
sudo systemctl start profix-api
```

---

## Шаг 5 — Фронтенд (React)

### Замена URL бэкенда

Перед сборкой нужно заменить все URL функций на ваши. Самый простой способ — создать env файл:

```bash
cat > /opt/profix/.env.production << 'EOF'
VITE_API_BASE=https://ВАШ_ДОМЕН/api
EOF
```

Затем в `src/lib/crm-api.ts`, `src/lib/shop-api.ts`, `src/lib/content-api.ts`, `src/lib/pages-api.ts` замените хардкоженные URL на:
```typescript
const BASE = import.meta.env.VITE_API_BASE || "https://functions.poehali.dev"
const AUTH_URL = `${BASE}/crm-auth`
```

### Сборка

```bash
cd /opt/profix
bun install
bun run build
# Статика окажется в dist/
```

---

## Шаг 6 — Nginx

```bash
sudo tee /etc/nginx/sites-available/profix << 'EOF'
server {
    listen 80;
    server_name ВАШ_ДОМЕН www.ВАШ_ДОМЕН;

    # Редирект на HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ВАШ_ДОМЕН www.ВАШ_ДОМЕН;

    ssl_certificate /etc/letsencrypt/live/ВАШ_ДОМЕН/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ВАШ_ДОМЕН/privkey.pem;

    root /opt/profix/dist;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # API → Python backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
        proxy_read_timeout 30s;
    }

    # SPA — всё остальное на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэш статики
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/profix /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL сертификат (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d ВАШ_ДОМЕН -d www.ВАШ_ДОМЕН
```

---

## Шаг 7 — Первый запуск (Setup)

После развёртки нужно создать первого администратора. Вызовите эндпоинт setup:

```bash
curl -X POST https://ВАШ_ДОМЕН/api/crm-setup \
  -H "Content-Type: application/json" \
  -d '{"action":"setup","login":"admin","password":"ваш_пароль","name":"Администратор"}'
```

Ответ должен быть `{"ok": true, "created": true}`.

---

## Шаг 8 — Адаптация S3 URL в коде

При локальном MinIO URL файлов будет вида `http://localhost:9000/files/...`. Нужно настроить CDN или проксировать через Nginx:

```nginx
# Добавить в nginx конфиг:
location /files/ {
    proxy_pass http://127.0.0.1:9000/files/;
}
```

И заменить в `backend/*/index.py` строку формирования CDN URL:
```python
# Было (Poehali.dev):
cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

# Стало (свой сервер):
cdn_url = f"https://{os.environ['DOMAIN']}/files/{key}"
```

---

## Что нужно заменить в коде

| Файл | Что менять | На что |
|------|------------|--------|
| `backend/*/index.py` | `endpoint_url='https://bucket.poehali.dev'` | Ваш S3 endpoint |
| `backend/*/index.py` | CDN URL формирование | Ваш домен |
| `backend/*/index.py` | `MAIN_DB_SCHEMA` | `public` или ваша схема |
| `src/lib/crm-api.ts` | URL функций | `https://ВАШ_ДОМЕН/api/crm-*` |
| `src/lib/shop-api.ts` | URL функции | `https://ВАШ_ДОМЕН/api/shop` |
| `src/lib/content-api.ts` | URL функции | `https://ВАШ_ДОМЕН/api/content` |
| `src/lib/pages-api.ts` | URL функции | `https://ВАШ_ДОМЕН/api/pages` |
| `src/components/ChatWidget.tsx` | CHAT_SEND_URL, CHAT_POLL_URL | `https://ВАШ_ДОМЕН/api/chat-*` |
| `public/manifest.json` | иконки и start_url | Ваши |
| `public/sw.js` | CDN URL в кэше | Ваши |

---

## Быстрый скрипт замены URL

```bash
#!/bin/bash
YOUR_DOMAIN="profix.example.com"

# Заменяем все URL в frontend
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "functions.poehali.dev" | while read f; do
  echo "Processing: $f"
done

# Для ручной замены используйте IDE (Ctrl+H):
# Найти: https://functions.poehali.dev/
# Заменить: https://${YOUR_DOMAIN}/api/
```

---

## Мониторинг

```bash
# Статус сервисов
sudo systemctl status profix-api
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status minio

# Логи
sudo journalctl -u profix-api -f
sudo tail -f /var/log/nginx/error.log

# Перезапуск после обновления кода
sudo systemctl restart profix-api
```

---

## Структура бэкенд API

| Маршрут | Модуль | Описание |
|---------|--------|----------|
| `/api/crm-auth` | crm-auth | Авторизация (клиент / менеджер / техник) |
| `/api/crm-tickets` | crm-tickets | Заявки, комментарии, расписание |
| `/api/crm-reviews` | crm-reviews | Отзывы клиентов |
| `/api/crm-setup` | crm-setup | Первоначальная настройка |
| `/api/chat` | chat | Чат (создание сессии) |
| `/api/chat-poll` | chat-poll | Получение новых сообщений |
| `/api/chat-send` | chat-send | Отправка ответа оператора |
| `/api/send-email` | send-email | Отправка заявок с сайта |
| `/api/shop` | shop | Интернет-магазин |
| `/api/content` | content | Контент сайта |
| `/api/pages` | pages | Конструктор страниц |
| `/api/tg-webhook` | tg-webhook | Telegram webhook |

---

## Telegram бот (опционально)

```bash
# 1. Создайте бота через @BotFather → получите TOKEN
# 2. Установите webhook:
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://ВАШ_ДОМЕН/api/tg-webhook"
```

---

## Переменные окружения (полный список)

```env
# Обязательные
DATABASE_URL=postgresql://user:pass@host:5432/dbname
MAIN_DB_SCHEMA=public

# S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_ENDPOINT=http://localhost:9000

# SMTP (опционально)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASSWORD=app_password

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...  # куда слать уведомления

# Домен (для формирования URL файлов)
DOMAIN=profix.example.com
```

---

## Обновление проекта

```bash
cd /opt/profix
git pull origin main
bun install
bun run build
sudo systemctl restart profix-api
sudo nginx -s reload
```

---

## Частые проблемы

**Q: API отвечает 502 Bad Gateway**
```bash
sudo systemctl status profix-api
sudo journalctl -u profix-api -n 50
```

**Q: Картинки не загружаются**
- Проверьте MinIO доступен: `curl http://localhost:9000/minio/health/live`
- Проверьте bucket `files` существует

**Q: Email не отправляется**
- Для Gmail нужен "App Password" (не основной пароль)
- Включите 2FA и создайте App Password в настройках Google

**Q: Миграции упали**
```bash
psql "postgresql://profix:pass@localhost/profix_db" -c "\dt public.*"
# Применяйте миграции по одной начиная с упавшей
```

**Q: CORS ошибки**
- Проверьте что nginx проксирует `/api/` правильно
- Убедитесь что backend возвращает `Access-Control-Allow-Origin: *`
