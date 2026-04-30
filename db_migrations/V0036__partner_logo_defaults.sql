-- Дефолтные логотипы партнёров в site_content
INSERT INTO t_p83689144_profix_network_admin.site_content (key, value) VALUES
  ('partner.datamobile.logo',    'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/datamobile_1.svg'),
  ('partner.poscenter.logo',     'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/poscenter.png'),
  ('partner.1c.logo',            'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/1c.svg'),
  ('partner.dreamkas.logo',      'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/dreamkas.svg'),
  ('partner.atol.logo',          'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/atol.png'),
  ('partner.sbis.logo',          'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/saby.png'),
  ('partner.ofd_yandex.logo',    'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/ofdyandex.svg'),
  ('partner.platforma_ofd.logo', 'https://cdn.poehali.dev/projects/16dea1b8-f4a6-4881-9a41-93285e290dcb/bucket/partners/platformaofd.png')
ON CONFLICT (key) DO NOTHING;
