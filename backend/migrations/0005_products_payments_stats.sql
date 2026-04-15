-- ═══════════════════════════════════════════════════════
--  Products + Payment Methods + Stats
--  Migration 0005
-- ═══════════════════════════════════════════════════════

-- ── Products ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT NOT NULL,              -- 'personal', 'bm', 'fanpage', 'profile'
  sub_group   TEXT DEFAULT '',            -- 'new', 'old' (chỉ dùng cho personal)
  name        TEXT NOT NULL,
  limit_text  TEXT NOT NULL,              -- 'Limit $50', 'No limit', 'BM Limit $250'
  description TEXT NOT NULL,
  icon_key    TEXT DEFAULT 'fb',          -- 'fb', 'house', 'page', 'profile'
  is_gold     INTEGER DEFAULT 0,          -- 1 = gold highlight
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_visible  ON products(is_visible);

-- ── Payment Methods ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_methods (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,              -- 'USDT', 'BTC', 'ETH'
  label       TEXT NOT NULL,              -- 'Tether', 'Bitcoin', 'Ethereum'
  icon_key    TEXT NOT NULL,              -- 'usdt', 'btc', 'eth'
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wallet_addresses (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  network           TEXT NOT NULL,        -- 'TRC-20', 'ERC-20', 'BTC', 'ETH'
  address           TEXT NOT NULL,
  sort_order        INTEGER DEFAULT 0,
  is_visible        INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_wallet_payment ON wallet_addresses(payment_method_id);

-- ── Stats ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stats (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  label       TEXT NOT NULL,              -- 'Ad Spend Managed'
  value       INTEGER NOT NULL,           -- 20000000
  prefix      TEXT DEFAULT '',            -- '$'
  suffix      TEXT DEFAULT '',            -- '+'
  description TEXT DEFAULT '',
  icon_key    TEXT DEFAULT 'dollar',      -- 'dollar', 'user', 'clock', 'shield'
  card_style  TEXT DEFAULT 'dark',        -- 'gold', 'dark', 'green', 'outline'
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- ════════════════════════════════════════════════════════
--  SEED DATA — từ hardcode trong index.html
-- ════════════════════════════════════════════════════════

-- ── Seed: Stats ───────────────────────────────────────────
INSERT INTO stats (label, value, prefix, suffix, description, icon_key, card_style, sort_order) VALUES
  ('Ad Spend Managed',    20000000, '$', '+', 'Massive volume handled across Facebook and TikTok campaigns.', 'dollar', 'gold',    1),
  ('Active Accounts',     50000,    '',  '+', 'Ready-to-run accounts available for fast campaign deployment.', 'user',   'dark',    2),
  ('Support Available',   24,       '',  '/7','Technical help whenever issues appear — day or night.',         'clock',  'green',   3),
  ('Refund For Unused Budget', 100, '',  '%', 'Clear protection policy so your budget never feels trapped.',  'shield', 'outline', 4);

-- ── Seed: Payment Methods ─────────────────────────────────
INSERT INTO payment_methods (id, name, label, icon_key, sort_order) VALUES
  (1, 'USDT', 'Tether',   'usdt', 1),
  (2, 'BTC',  'Bitcoin',  'btc',  2),
  (3, 'ETH',  'Ethereum', 'eth',  3);

INSERT INTO wallet_addresses (payment_method_id, network, address, sort_order) VALUES
  -- USDT
  (1, 'TRC-20', 'TCDunashF4ntpBhReGXK31DHoRNYXoeRoY',       1),
  (1, 'ERC-20', '0xeec41369dfa92a6e39a67c24cb42bafbaebb3f47', 2),
  -- BTC
  (2, 'BTC',    '16VTG54exkPyVmQpDD5zVhemN9aUyE4Fne',       1),
  -- ETH
  (3, 'ETH',    '0xeec41369dfa92a6e39a67c24cb42bafbaebb3f47', 1);

-- ── Seed: Products — Personal (new) ──────────────────────
INSERT INTO products (category, sub_group, name, limit_text, description, icon_key, is_gold, sort_order) VALUES
  ('personal', 'new', 'Personal account (new)', 'Limit $50',
   'Never used before, with the ability to change time zone and currency. Can spend up to $50 USD per day. Regular spending can increase the limit.',
   'fb', 0, 1),
  ('personal', 'new', 'Personal account (new)', 'Limit $250',
   'Never used before, with the ability to change time zone and currency. Can spend up to $250 USD per day. Regular spending can increase the limit.',
   'fb', 0, 2),
  ('personal', 'new', 'Personal account (new)', 'Limit $1500',
   'Never used before, with the ability to change time zone and currency. Can spend up to $1500 USD per day.',
   'fb', 0, 3),
  ('personal', 'new', 'Personal account (new)', 'No limit',
   'Never used before, with the ability to change time zone and currency. Can spend from $5000 USD to unlimited per day.',
   'fb', 1, 4);

-- ── Seed: Products — Personal (old) ──────────────────────
INSERT INTO products (category, sub_group, name, limit_text, description, icon_key, is_gold, sort_order) VALUES
  ('personal', 'old', 'Personal account (old)', 'Limit $50',
   'Used for previous White hat campaigns with many successful payouts, high reliability and good health. Can spend up to $50 USD per day. Regular spending can increase the limit.',
   'fb', 0, 5),
  ('personal', 'old', 'Personal account (old)', 'Limit $250',
   'Used for previous White hat campaigns with many successful payouts, high reliability and good health. Can spend up to $250 USD per day. Regular spending can increase the limit.',
   'fb', 0, 6),
  ('personal', 'old', 'Personal account (old)', 'Limit $1500',
   'Used for previous White hat campaigns with many successful payouts, high reliability and good health. Can spend up to $1500 USD per day.',
   'fb', 0, 7),
  ('personal', 'old', 'Personal account (old)', 'No limit',
   'Used for previous White hat campaigns with many successful payouts, high reliability and good health. Can spend from $5000 USD to unlimited per day.',
   'fb', 1, 8);

-- ── Seed: Products — Business Manager ────────────────────
INSERT INTO products (category, sub_group, name, limit_text, description, icon_key, is_gold, sort_order) VALUES
  ('bm', '', 'Business Manager', 'BM Limit $250',
   'Verified Business Manager with $250 daily spending limit. Includes ad account creation capability. Clean history, ready to use.',
   'house', 0, 1),
  ('bm', '', 'Business Manager', 'BM Limit $1500',
   'Verified Business Manager with $1500 daily spending limit. Premium quality, ideal for scaling campaigns. Includes multiple ad account slots.',
   'house', 0, 2),
  ('bm', '', 'Business Manager', 'BM No Limit',
   'Unlimited Business Manager with no daily spending cap. Full verified, maximum ad account slots. Enterprise-level infrastructure for massive scale.',
   'house', 1, 3);

-- ── Seed: Products — Fanpage ──────────────────────────────
INSERT INTO products (category, sub_group, name, limit_text, description, icon_key, is_gold, sort_order) VALUES
  ('fanpage', '', 'Fanpage', 'New Fanpage',
   'Brand new Facebook page, ready for ad campaigns. Support name change to match your brand. Clean page with no violations.',
   'page', 0, 1),
  ('fanpage', '', 'Fanpage', 'Aged Fanpage',
   'Aged Facebook page with established history. Higher trust score, better ad delivery performance. Ideal for sensitive verticals.',
   'page', 0, 2);

-- ── Seed: Products — Profile ──────────────────────────────
INSERT INTO products (category, sub_group, name, limit_text, description, icon_key, is_gold, sort_order) VALUES
  ('profile', '', 'Profile', 'New Profile',
   'Fresh Facebook profile with clean history. Suitable for running new ad accounts. Includes 2FA setup and recovery options.',
   'profile', 0, 1),
  ('profile', '', 'Profile', 'Aged Profile',
   'Aged Facebook profile with real activity history. Higher trust level from Facebook algorithm. Better for high-spend campaigns and BM creation.',
   'profile', 0, 2);
