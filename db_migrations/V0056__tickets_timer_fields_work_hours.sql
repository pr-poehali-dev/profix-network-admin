ALTER TABLE t_p83689144_profix_network_admin.tickets
  ADD COLUMN IF NOT EXISTS started_at   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP,
  ADD COLUMN IF NOT EXISTS work_hours   NUMERIC(5,2);

-- Таблица рабочей недели (шаблон часов по типу дня)
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.tech_work_hours (
  id          SERIAL PRIMARY KEY,
  tech_id     INTEGER NOT NULL REFERENCES t_p83689144_profix_network_admin.technicians(id),
  date        DATE NOT NULL,
  hours_start TIME,
  hours_end   TIME,
  UNIQUE(tech_id, date)
);
