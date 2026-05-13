ALTER TABLE t_p83689144_profix_network_admin.tickets
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30),
  ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(30),
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Генерируем invoice_number для существующих заказов из магазина (source='shop')
UPDATE t_p83689144_profix_network_admin.tickets
SET invoice_number = 'INV-' || LPAD(id::text, 5, '0')
WHERE invoice_number IS NULL;
