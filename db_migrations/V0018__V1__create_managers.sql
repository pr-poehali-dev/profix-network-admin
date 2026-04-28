CREATE TABLE IF NOT EXISTS managers (
    id SERIAL PRIMARY KEY,
    login VARCHAR(100) UNIQUE,
    username VARCHAR(100),
    password_hash VARCHAR(255),
    name VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'manager',
    created_at TIMESTAMP DEFAULT NOW()
);
