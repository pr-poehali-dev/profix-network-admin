ALTER TABLE t_p83689144_profix_network_admin.posts
  ADD COLUMN IF NOT EXISTS comments_mode varchar(20) NOT NULL DEFAULT 'users';
