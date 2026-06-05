UPDATE t_p83689144_profix_network_admin.posts
SET excerpt = regexp_replace(regexp_replace(excerpt, '<[^>]+>', ' ', 'g'), '\s+', ' ', 'g')
WHERE excerpt IS NOT NULL AND excerpt ~ '<[^>]+>';
