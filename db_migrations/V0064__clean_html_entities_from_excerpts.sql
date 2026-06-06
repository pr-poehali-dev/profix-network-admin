-- Чистим HTML-entities и теги из excerpt в уже опубликованных новостях
UPDATE t_p83689144_profix_network_admin.posts
SET excerpt = trim(regexp_replace(
    regexp_replace(
        regexp_replace(excerpt, '&lt;', '<', 'g'),
        '&gt;', '>', 'g'),
    '<[^>]+>', ' ', 'g'))
WHERE excerpt IS NOT NULL AND (excerpt ~ '<[^>]+>' OR excerpt ~ '&lt;');

UPDATE t_p83689144_profix_network_admin.posts
SET excerpt = trim(regexp_replace(excerpt, '\s+', ' ', 'g'))
WHERE excerpt IS NOT NULL AND excerpt ~ '\s{2,}';
