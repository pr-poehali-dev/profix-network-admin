-- Тарифные планы для фиксиков
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.tariff_plans (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'tech', -- tech | manager
    -- Базовое начисление за закрытую заявку
    base_fixies     INTEGER NOT NULL DEFAULT 10,
    -- Штраф за просроченную заявку (отрицательный или положительный для удержания)
    overdue_penalty INTEGER NOT NULL DEFAULT 0,
    -- Бонус менеджеру за скорость: если закрыта за X часов
    speed_bonus_hours INTEGER NULL,   -- если заявка закрыта быстрее этого — бонус
    speed_bonus_fixies INTEGER NOT NULL DEFAULT 0,
    -- Дополнительные пороги скорости (JSON: [{hours, fixies}])
    speed_tiers     JSONB NULL,
    -- Штраф менеджеру если заявка не закрыта за X часов
    slow_penalty_hours INTEGER NULL,
    slow_penalty_fixies INTEGER NOT NULL DEFAULT 0,
    -- Коэффициент по приоритету (JSON: {low, normal, high, urgent} → float)
    priority_multiplier JSONB NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Привязка тарифа к специалисту
ALTER TABLE t_p83689144_profix_network_admin.technicians
    ADD COLUMN IF NOT EXISTS tariff_plan_id INTEGER REFERENCES t_p83689144_profix_network_admin.tariff_plans(id);

-- Привязка тарифа к менеджеру
ALTER TABLE t_p83689144_profix_network_admin.managers
    ADD COLUMN IF NOT EXISTS tariff_plan_id INTEGER REFERENCES t_p83689144_profix_network_admin.tariff_plans(id),
    ADD COLUMN IF NOT EXISTS fixies_balance INTEGER NOT NULL DEFAULT 0;

-- История фиксиков менеджеров (отдельная т.к. у спецов уже есть fixie_transactions)
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.manager_fixie_transactions (
    id          SERIAL PRIMARY KEY,
    manager_id  INTEGER REFERENCES t_p83689144_profix_network_admin.managers(id),
    amount      INTEGER NOT NULL,
    reason      VARCHAR(300) NOT NULL,
    ticket_id   INTEGER REFERENCES t_p83689144_profix_network_admin.tickets(id),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Дефолтные тарифы
INSERT INTO t_p83689144_profix_network_admin.tariff_plans
    (name, role, base_fixies, overdue_penalty, speed_bonus_hours, speed_bonus_fixies, speed_tiers, slow_penalty_hours, slow_penalty_fixies, priority_multiplier)
VALUES
    ('Стандарт (спец)', 'tech', 15, 5, NULL, 0, NULL, NULL, 0,
     '{"low": 0.8, "normal": 1.0, "high": 1.3, "urgent": 1.5}'),
    ('Стандарт (менеджер)', 'manager', 10, 3,
     4, 10,
     '[{"hours": 1, "fixies": 20}, {"hours": 4, "fixies": 10}, {"hours": 24, "fixies": 0}]',
     48, 5,
     '{"low": 0.8, "normal": 1.0, "high": 1.5, "urgent": 2.0}');

CREATE INDEX IF NOT EXISTS idx_tariff_role ON t_p83689144_profix_network_admin.tariff_plans(role);
CREATE INDEX IF NOT EXISTS idx_mgr_fixie_tx ON t_p83689144_profix_network_admin.manager_fixie_transactions(manager_id, created_at);
