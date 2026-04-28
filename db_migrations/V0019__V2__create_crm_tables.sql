CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(30) UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    telegram_chat_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_otp (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(30),
    code VARCHAR(10),
    channel VARCHAR(20) DEFAULT 'email',
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_sessions (
    id SERIAL PRIMARY KEY,
    client_id INTEGER,
    token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manager_sessions (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER,
    token VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    client_id INTEGER,
    manager_id INTEGER,
    subject VARCHAR(500),
    status VARCHAR(50) DEFAULT 'new',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER,
    sender_type VARCHAR(20),
    sender_id INTEGER,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
