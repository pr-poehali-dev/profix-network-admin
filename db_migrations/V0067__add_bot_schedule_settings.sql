INSERT INTO t_p83689144_profix_network_admin.bot_settings (key, value) VALUES
  ('news_bot.schedule_enabled', 'true'),
  ('news_bot.schedule_hour',    '9'),
  ('news_bot.schedule_days',    '1,2,3,4,5'),
  ('news_bot.last_run_at',      ''),
  ('video_bot.schedule_enabled','true'),
  ('video_bot.schedule_hour',   '11'),
  ('video_bot.schedule_days',   '1,3,5'),
  ('video_bot.last_run_at',     '')
ON CONFLICT (key) DO NOTHING;
