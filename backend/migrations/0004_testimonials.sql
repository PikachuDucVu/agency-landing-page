-- ═══════════════════════════════════════════════════════
--  Testimonials — Client reviews/comments
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS testimonials (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  author_role TEXT DEFAULT '',
  content     TEXT NOT NULL,
  lang        TEXT NOT NULL DEFAULT 'en',
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_testimonials_lang ON testimonials(lang);
CREATE INDEX IF NOT EXISTS idx_testimonials_active ON testimonials(is_active);

-- Seed default testimonials (EN)
INSERT INTO testimonials (author_name, author_role, content, lang, sort_order) VALUES
  ('Alex T.', 'E-commerce, Shopify', 'Scaled from $5K to $80K/month in 3 months with zero downtime. When my account got banned, Roman Agency replaced it in 2 hours. Game changer.', 'en', 1),
  ('Maria S.', 'Digital Agency Owner', 'The 24/7 support is real. I had an issue at 3AM and their technician fixed it in 15 minutes. Best agency infrastructure I''ve used.', 'en', 2),
  ('David K.', 'Affiliate Marketer', 'Transparent spending reports, no hidden fees. I can see exactly where every dollar goes. The 8% fee is worth every penny for the peace of mind.', 'en', 3);

-- Seed default testimonials (ZH)
INSERT INTO testimonials (author_name, author_role, content, lang, sort_order) VALUES
  ('Alex T.', '电商，Shopify', '3个月内从每月 $5K 扩展到 $80K，零停机。当我的账户被封禁时，Roman 在2小时内就完成了更换。改变了游戏规则。', 'zh', 1),
  ('Maria S.', '数字营销公司负责人', '24/7 支持是真实的。凌晨3点我遇到问题，他们的技术人员15分钟就解决了。我用过的最好的代理基础设施。', 'zh', 2),
  ('David K.', '联盟营销人员', '透明的消费报告，没有隐藏费用。我可以清楚地看到每一美元的去向。8% 的费用对于安心来说物超所值。', 'zh', 3);

-- Seed default testimonials (RU)
INSERT INTO testimonials (author_name, author_role, content, lang, sort_order) VALUES
  ('Алекс Т.', 'E-commerce, Shopify', 'За 3 месяца масштабировал с $5K до $80K/месяц без простоев. Когда мой аккаунт заблокировали, Roman заменил его за 2 часа. Настоящий прорыв.', 'ru', 1),
  ('Мария С.', 'Владелец digital-агентства', 'Поддержка 24/7 — это реальность. В 3 часа ночи у меня возникла проблема, и их техник решил её за 15 минут. Лучшая инфраструктура.', 'ru', 2),
  ('Давид К.', 'Арбитражник', 'Прозрачные отчёты, никаких скрытых платежей. Я вижу, куда уходит каждый доллар. 8% комиссии — это стоит каждого цента за спокойствие.', 'ru', 3);
