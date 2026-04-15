-- ═══════════════════════════════════════════════════════
--  Migration 0008: Add lang column to products, stats, payment_methods
--  Enables multi-language support (en/zh/ru)
-- ═══════════════════════════════════════════════════════

-- ── Products: add lang column ───────────────────────────
ALTER TABLE products ADD COLUMN lang TEXT DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_products_lang ON products(lang);

-- ── Stats: add lang column ──────────────────────────────
ALTER TABLE stats ADD COLUMN lang TEXT DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_stats_lang ON stats(lang);

-- ── Payment Methods: add lang column ────────────────────
ALTER TABLE payment_methods ADD COLUMN lang TEXT DEFAULT 'en';
CREATE INDEX IF NOT EXISTS idx_payments_lang ON payment_methods(lang);
