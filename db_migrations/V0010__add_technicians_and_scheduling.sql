CREATE TABLE IF NOT EXISTS technicians (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  specialization VARCHAR(200),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS technician_id INTEGER REFERENCES technicians(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS scheduled_hour INTEGER;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tech_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_tickets_technician ON tickets(technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_scheduled ON tickets(scheduled_date);
