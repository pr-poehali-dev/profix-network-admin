-- Клиенты (регистрация по телефону)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  email VARCHAR(150),
  telegram_id BIGINT,
  telegram_username VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Сессии клиентов
CREATE TABLE IF NOT EXISTS client_sessions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);

-- Коды верификации (email или telegram)
CREATE TABLE IF NOT EXISTS verify_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  method VARCHAR(10) NOT NULL CHECK (method IN ('email', 'telegram')),
  contact VARCHAR(200) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Менеджеры (вход по логин/пароль)
CREATE TABLE IF NOT EXISTS managers (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'manager' CHECK (role IN ('manager', 'admin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Сессии менеджеров
CREATE TABLE IF NOT EXISTS manager_sessions (
  id SERIAL PRIMARY KEY,
  manager_id INTEGER NOT NULL REFERENCES managers(id),
  token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '8 hours'
);

-- Заявки/обращения
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  manager_id INTEGER REFERENCES managers(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','in_progress','waiting','done','cancelled')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  source VARCHAR(20) DEFAULT 'cabinet' CHECK (source IN ('cabinet','site','phone','manual')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Комментарии к заявкам
CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  author_type VARCHAR(10) NOT NULL CHECK (author_type IN ('client','manager')),
  author_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_tickets_client ON tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_tickets_manager ON tickets(manager_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_client_sessions_token ON client_sessions(token);
CREATE INDEX IF NOT EXISTS idx_manager_sessions_token ON manager_sessions(token);
CREATE INDEX IF NOT EXISTS idx_verify_codes_phone ON verify_codes(phone);
