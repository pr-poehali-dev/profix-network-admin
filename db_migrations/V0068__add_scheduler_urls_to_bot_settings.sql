INSERT INTO t_p83689144_profix_network_admin.bot_settings (key, value) VALUES
  ('scheduler.news_bot_url',  'https://functions.poehali.dev/f98afafa-f9ce-4f95-9591-d03491a9464b'),
  ('scheduler.video_bot_url', 'https://functions.poehali.dev/117bd984-7421-4cf4-85fd-d89c13262bb7'),
  ('scheduler.url',           'https://functions.poehali.dev/b90ff9cb-6325-4674-871c-e6dda8138725')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
