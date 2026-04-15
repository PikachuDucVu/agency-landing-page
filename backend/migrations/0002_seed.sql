-- ═══════════════════════════════════════════════════════
--  Seed Data — Initial admin user + FAQ content
-- ═══════════════════════════════════════════════════════

-- ── Admin User ──────────────────────────────────────────
-- Password: roman2026! (hashed with Web Crypto in seed script)
-- NOTE: Run the seed script instead for proper password hashing
-- This is a placeholder — the actual hash is set by the /api/admin/setup endpoint

-- ── FAQ (English) ───────────────────────────────────────
INSERT OR IGNORE INTO faqs (question, answer, sort_order, lang) VALUES
(
  'How is the fee calculated?',
  'You want to spend $1000 and your fee is 8%, then the total amount you need to pay is $1,080. We don''t charge fees if you haven''t worked or spent on the account. You''ll be able to check your spending and fees directly using the smart dashboard.',
  1, 'en'
),
(
  'Can the balance from a banned account be transferred to a new account?',
  'Usually, this depends on the platform''s policies and the nature of the ban. However, we can guarantee the remaining balance in the report will be used for the new account.',
  2, 'en'
),
(
  'What happens if the Facebook advertising account is banned?',
  'In the event an ad account or profile is banned, a replacement account will be provided promptly. The main requirement is to follow the instructions of our technicians to prevent any abuse or damage to the account.',
  3, 'en'
),
(
  'How to access my account?',
  'We will make your account available through an anti-detection browser after sending an email or through a VPS virtual server (RDP). Our technicians will provide you with all the access information. You can log in and find all the resources in there.',
  4, 'en'
);

-- ── FAQ (Chinese) ───────────────────────────────────────
INSERT OR IGNORE INTO faqs (question, answer, sort_order, lang) VALUES
(
  '费用如何计算？',
  '假设您要花费 $1000，费率为 8%，则您需要支付的总金额为 $1,080。如果您未使用账户，我们不会收取任何费用。您可以通过智能仪表板直接查看消费和费用。',
  1, 'zh'
),
(
  '被封禁账户的余额可以转移到新账户吗？',
  '通常，这取决于平台的政策和封禁的性质。不过，我们可以保证报告中的剩余余额将用于新账户。',
  2, 'zh'
),
(
  '如果 Facebook 广告账户被封禁怎么办？',
  '如果广告账户或配置文件被封禁，我们会立即提供替换账户。主要要求是按照我们技术人员的指示操作，以防止任何滥用或损坏。',
  3, 'zh'
),
(
  '如何访问我的账户？',
  '我们会通过反检测浏览器在发送邮件后或通过 VPS 虚拟服务器 (RDP) 让您访问账户。我们的技术人员会为您提供所有访问信息。您可以登录并找到所有资源。',
  4, 'zh'
);

-- ── FAQ (Russian) ───────────────────────────────────────
INSERT OR IGNORE INTO faqs (question, answer, sort_order, lang) VALUES
(
  'Как рассчитывается комиссия?',
  'Вы хотите потратить $1000, комиссия 8%, значит общая сумма — $1,080. Мы не взимаем комиссию, если вы не работали и не тратили на аккаунте. Расходы и комиссии можно проверить через умный дашборд.',
  1, 'ru'
),
(
  'Можно ли перенести баланс заблокированного аккаунта на новый?',
  'Обычно это зависит от политики платформы и характера блокировки. Однако мы гарантируем, что остаток по отчёту будет использован для нового аккаунта.',
  2, 'ru'
),
(
  'Что происходит при блокировке рекламного аккаунта Facebook?',
  'Если аккаунт или профиль заблокирован, замена предоставляется оперативно. Главное — следовать инструкциям наших техников, чтобы предотвратить злоупотребления.',
  3, 'ru'
),
(
  'Как получить доступ к аккаунту?',
  'Мы предоставим доступ через антидетект-браузер после отправки email или через VPS (RDP). Наши техники предоставят всю информацию для входа. Вы сможете войти и найти все ресурсы.',
  4, 'ru'
);

-- ── Default Settings ────────────────────────────────────
INSERT OR IGNORE INTO settings (key, value, lang) VALUES
('stat_spend', '$20M+', 'en'),
('stat_accounts', '50K+', 'en'),
('stat_support', '24/7', 'en'),
('stat_refund', '100%', 'en'),
('contact_email', 'romanagency888@gmail.com', 'en'),
('contact_telegram', '@romanwarior', 'en'),
('contact_channel', '@romanagency', 'en'),
('contact_website', 'romanagency.net', 'en'),
('pricing_fee', '8%', 'en'),
('pricing_deposit', '$100', 'en');
