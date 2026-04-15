-- ═══════════════════════════════════════════════════════
--  Subscribers: add status + ip_address
--  Testimonials: add avatar fields
--  Migration 0006
-- ═══════════════════════════════════════════════════════

-- ── Subscribers enhancements ──────────────────────────────
ALTER TABLE subscribers ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE subscribers ADD COLUMN ip_address TEXT DEFAULT '';
ALTER TABLE subscribers ADD COLUMN unsubscribed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

-- ── Testimonials avatar ───────────────────────────────────
ALTER TABLE testimonials ADD COLUMN avatar_r2_key TEXT DEFAULT '';
ALTER TABLE testimonials ADD COLUMN avatar_r2_url TEXT DEFAULT '';
