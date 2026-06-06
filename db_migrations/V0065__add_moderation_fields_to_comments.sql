ALTER TABLE t_p83689144_profix_network_admin.post_comments
  ADD COLUMN IF NOT EXISTS edited_by varchar(100) NULL,
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_by varchar(100) NULL;
