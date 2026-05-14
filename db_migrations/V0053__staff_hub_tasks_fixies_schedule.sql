CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.staff_tasks (
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    assigned_to     INTEGER REFERENCES t_p83689144_profix_network_admin.technicians(id),
    created_by      INTEGER REFERENCES t_p83689144_profix_network_admin.managers(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'open',
    priority        VARCHAR(10) NOT NULL DEFAULT 'normal',
    due_at          TIMESTAMPTZ,
    done_at         TIMESTAMPTZ,
    fixies_reward   INTEGER NOT NULL DEFAULT 0,
    penalty_fixies  INTEGER NOT NULL DEFAULT 0,
    close_comment   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.staff_task_logs (
    id          SERIAL PRIMARY KEY,
    task_id     INTEGER REFERENCES t_p83689144_profix_network_admin.staff_tasks(id),
    author_role VARCHAR(20) NOT NULL,
    author_id   INTEGER NOT NULL,
    text        TEXT NOT NULL,
    action      VARCHAR(30) DEFAULT 'comment',
    new_due_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.fixie_transactions (
    id          SERIAL PRIMARY KEY,
    tech_id     INTEGER REFERENCES t_p83689144_profix_network_admin.technicians(id),
    amount      INTEGER NOT NULL,
    reason      VARCHAR(200) NOT NULL,
    task_id     INTEGER REFERENCES t_p83689144_profix_network_admin.staff_tasks(id),
    created_by  INTEGER REFERENCES t_p83689144_profix_network_admin.managers(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE t_p83689144_profix_network_admin.technicians
    ADD COLUMN IF NOT EXISTS fixies_balance INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.staff_schedule (
    id          SERIAL PRIMARY KEY,
    tech_id     INTEGER REFERENCES t_p83689144_profix_network_admin.technicians(id),
    date        DATE NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'work',
    note        TEXT,
    created_by  INTEGER REFERENCES t_p83689144_profix_network_admin.managers(id),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tech_id, date)
);

CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.staff_contacts (
    id          SERIAL PRIMARY KEY,
    tech_id     INTEGER REFERENCES t_p83689144_profix_network_admin.technicians(id) UNIQUE,
    department  VARCHAR(100),
    position    VARCHAR(100),
    email       VARCHAR(200),
    tg_username VARCHAR(100),
    vk_url      TEXT,
    notes       TEXT,
    sort_order  INTEGER DEFAULT 0,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE t_p83689144_profix_network_admin.tg_staff_messages
    ADD COLUMN IF NOT EXISTS file_url   TEXT,
    ADD COLUMN IF NOT EXISTS file_type  VARCHAR(20),
    ADD COLUMN IF NOT EXISTS file_name  TEXT;

CREATE INDEX IF NOT EXISTS idx_staff_tasks_tech ON t_p83689144_profix_network_admin.staff_tasks(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_fixie_tx_tech    ON t_p83689144_profix_network_admin.fixie_transactions(tech_id, created_at);
CREATE INDEX IF NOT EXISTS idx_schedule_date    ON t_p83689144_profix_network_admin.staff_schedule(tech_id, date);
