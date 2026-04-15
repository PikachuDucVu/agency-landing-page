-- ═══════════════════════════════════════════════════════
--  Publish Releases — Published media config snapshots
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS publish_releases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  version       INTEGER NOT NULL UNIQUE,
  status        TEXT NOT NULL DEFAULT 'published',
  config_json   TEXT NOT NULL,
  config_hash   TEXT NOT NULL,
  notes         TEXT DEFAULT '',
  published_by  TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_publish_releases_created_at ON publish_releases(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_publish_releases_status ON publish_releases(status);

CREATE TABLE IF NOT EXISTS publish_state (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT DEFAULT (datetime('now'))
);
