CREATE TABLE IF NOT EXISTS t_p83689144_profix_network_admin.bot_settings (
  key   varchar(100) NOT NULL PRIMARY KEY,
  value text         NOT NULL DEFAULT ''
);

-- Настройки новостного бота (defaults)
INSERT INTO t_p83689144_profix_network_admin.bot_settings (key, value) VALUES
  ('news_bot.enabled',       'true'),
  ('news_bot.max_per_run',   '1'),
  ('news_bot.sources',       'all'),
  ('news_bot.keywords',      ''),
  ('news_bot.require_image', 'true'),
  ('video_bot.enabled',      'true'),
  ('video_bot.max_per_run',  '2'),
  ('video_bot.youtube',      'true'),
  ('video_bot.rutube',       'true'),
  ('video_bot.vk',           'false'),
  ('video_bot.topics',       'ккт,1с,тсд,datamobile,ремонт кассовых аппаратов,кассовый аппарат')
ON CONFLICT (key) DO NOTHING;
