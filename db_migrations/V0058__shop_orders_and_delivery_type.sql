-- Тип доставки в товарах: digital (электронный), physical (физический), service (услуга)
ALTER TABLE t_p83689144_profix_network_admin.shop_products
  ADD COLUMN IF NOT EXISTS delivery_type varchar(20) DEFAULT 'physical';

-- Расширяем клиентов: тип лица, реквизиты юрлица
ALTER TABLE t_p83689144_profix_network_admin.clients
  ADD COLUMN IF NOT EXISTS client_type varchar(10) DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS company_name varchar(200) NULL,
  ADD COLUMN IF NOT EXISTS company_inn varchar(20) NULL,
  ADD COLUMN IF NOT EXISTS company_kpp varchar(20) NULL,
  ADD COLUMN IF NOT EXISTS company_address text NULL;

-- Таблица заказов магазина
CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.shop_orders (
  id              serial PRIMARY KEY,
  ticket_id       integer REFERENCES t_p83689144_profix_network_admin.tickets(id),
  client_id       integer REFERENCES t_p83689144_profix_network_admin.clients(id),
  name            varchar(200) NOT NULL,
  phone           varchar(30) NOT NULL,
  email           varchar(200) NULL,
  delivery_type   varchar(20) NOT NULL DEFAULT 'physical',
  delivery_address text NULL,
  client_type     varchar(10) DEFAULT 'individual',
  company_name    varchar(200) NULL,
  company_inn     varchar(20) NULL,
  payment_method  varchar(30) NULL,
  payment_status  varchar(30) DEFAULT 'pending',
  status          varchar(30) DEFAULT 'new',
  total           numeric(12,2) NOT NULL,
  items           jsonb NOT NULL DEFAULT '[]',
  invoice_number  varchar(50) NULL,
  comment         text NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);