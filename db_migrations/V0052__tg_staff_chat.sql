CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.tg_staff_messages (
    id            SERIAL PRIMARY KEY,
    tech_id       INTEGER REFERENCES t_p83689144_profix_network_admin.technicians(id),
    tg_chat_id    BIGINT NOT NULL,
    from_role     VARCHAR(20) NOT NULL DEFAULT 'tech',
    text          TEXT NOT NULL,
    tg_message_id BIGINT,
    read_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tg_staff_msg_tech ON t_p83689144_profix_network_admin.tg_staff_messages(tech_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tg_staff_msg_chat ON t_p83689144_profix_network_admin.tg_staff_messages(tg_chat_id, created_at);

ALTER TABLE t_p83689144_profix_network_admin.technicians
    ADD COLUMN IF NOT EXISTS tg_chat_id BIGINT,
    ADD COLUMN IF NOT EXISTS tg_username VARCHAR(100);
