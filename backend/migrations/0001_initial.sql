-- ═══════════════════════════════════════════════════════
--  Roman Agency Marketing — D1 Database Schema
--  Adapted from docs/admin-console-design.md
-- ═══════════════════════════════════════════════════════

-- ── Media Items ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_items (
  id          TEXT PRIMARY KEY,
  section     TEXT NOT NULL,
  slot        TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  r2_key      TEXT NOT NULL,
  r2_url      TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  file_size   INTEGER NOT NULL DEFAULT 0,
  width       INTEGER,
  height      INTEGER,
  alt_text    TEXT DEFAULT '',
  caption     TEXT DEFAULT '',
  caption_sub TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  is_visible  INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_media_section ON media_items(section);
CREATE INDEX IF NOT EXISTS idx_media_visible ON media_items(is_visible);

-- ── FAQs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  lang        TEXT DEFAULT 'en',
  is_active   INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_faqs_lang ON faqs(lang);

-- ── Site Settings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  lang        TEXT DEFAULT 'en',
  updated_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (key, lang)
);

-- ── Subscribers ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT UNIQUE NOT NULL,
  created_at  TEXT DEFAULT (datetime('now')),
  origin      TEXT,
  user_agent  TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);

-- ── Admin Users ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);
