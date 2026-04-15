-- ═══════════════════════════════════════════════════════
--  Seed: Media Items (placeholder entries for admin preview)
--  These create DB records only — actual images must be
--  uploaded via Admin > Upload Media or synced from R2.
-- ═══════════════════════════════════════════════════════

-- ── Brand ───────────────────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('brand-logo', 'brand', 'logo', 'Container.png', 'media/brand/Container.png', '/api/public-media/brand/Container.png', 'image/png', 0, 0),
('brand-logo-alt', 'brand', 'logo-alt', 'image-removebg-preview.png', 'media/brand/image-removebg-preview.png', '/api/public-media/brand/image-removebg-preview.png', 'image/png', 0, 1);

-- ── Favicon ─────────────────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('favicon-main', 'favicon', 'main', 'favicon.png', 'media/favicon/favicon.png', '/api/public-media/favicon/favicon.png', 'image/png', 0, 0);

-- ── Hero ────────────────────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('hero-bg', 'hero', 'bg', 'hero-bg.png', 'media/hero/hero-bg.png', '/api/public-media/hero/hero-bg.png', 'image/png', 0, 0);

-- ── Services ───────────────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('services-rental', 'services', 'rental', 'service-rental.png', 'media/services/service-rental.png', '/api/public-media/services/service-rental.png', 'image/png', 0, 0),
('services-sales', 'services', 'sales', 'service-sales.png', 'media/services/service-sales.png', '/api/public-media/services/service-sales.png', 'image/png', 0, 1),
('services-managed', 'services', 'managed', 'service-managed.png', 'media/services/service-managed.png', '/api/public-media/services/service-managed.png', 'image/png', 0, 2);

-- ── Meta ────────────────────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('meta-logo', 'meta', 'logo', 'meta-logo.png', 'media/meta/meta-logo.png', '/api/public-media/meta/meta-logo.png', 'image/png', 0, 0);

-- ── Resources ──────────────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('resources-sd1', 'resources', 'sd1', 'SD1.png', 'media/resources/SD1.png', '/api/public-media/resources/SD1.png', 'image/png', 0, 0),
('resources-sd2', 'resources', 'sd2', 'SD2.png', 'media/resources/SD2.png', '/api/public-media/resources/SD2.png', 'image/png', 0, 1),
('resources-sd3', 'resources', 'sd3', 'SD3.png', 'media/resources/SD3.png', '/api/public-media/resources/SD3.png', 'image/png', 0, 2),
('resources-sd5', 'resources', 'sd5', 'SD5.png', 'media/resources/SD5.png', '/api/public-media/resources/SD5.png', 'image/png', 0, 3),
('resources-sd6', 'resources', 'sd6', 'SD6.png', 'media/resources/SD6.png', '/api/public-media/resources/SD6.png', 'image/png', 0, 4),
('resources-sd7', 'resources', 'sd7', 'SD7.png', 'media/resources/SD7.png', '/api/public-media/resources/SD7.png', 'image/png', 0, 5),
('resources-extra', 'resources', 'extra', 'SD-extra.jpg', 'media/resources/SD-extra.jpg', '/api/public-media/resources/SD-extra.jpg', 'image/jpeg', 0, 6);

-- ── Proof — Campaign ───────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('proof-campaign-1', 'proof-campaign', 'gallery-1', 'gallery-large-1.jpg', 'media/proof-campaign/gallery-large-1.jpg', '/api/public-media/proof-campaign/gallery-large-1.jpg', 'image/jpeg', 0, 0),
('proof-campaign-2', 'proof-campaign', 'gallery-2', 'gallery-large-2.jpg', 'media/proof-campaign/gallery-large-2.jpg', '/api/public-media/proof-campaign/gallery-large-2.jpg', 'image/jpeg', 0, 1),
('proof-campaign-3', 'proof-campaign', 'gallery-3', 'gallery-large-3.jpg', 'media/proof-campaign/gallery-large-3.jpg', '/api/public-media/proof-campaign/gallery-large-3.jpg', 'image/jpeg', 0, 2),
('proof-campaign-4', 'proof-campaign', 'gallery-4', 'gallery-large-4.jpg', 'media/proof-campaign/gallery-large-4.jpg', '/api/public-media/proof-campaign/gallery-large-4.jpg', 'image/jpeg', 0, 3),
('proof-campaign-5', 'proof-campaign', 'gallery-5', 'gallery-large-5.jpg', 'media/proof-campaign/gallery-large-5.jpg', '/api/public-media/proof-campaign/gallery-large-5.jpg', 'image/jpeg', 0, 4),
('proof-campaign-7', 'proof-campaign', 'gallery-7', 'gallery-large-7.jpg', 'media/proof-campaign/gallery-large-7.jpg', '/api/public-media/proof-campaign/gallery-large-7.jpg', 'image/jpeg', 0, 5),
('proof-campaign-8', 'proof-campaign', 'gallery-8', 'gallery-large-8.jpg', 'media/proof-campaign/gallery-large-8.jpg', '/api/public-media/proof-campaign/gallery-large-8.jpg', 'image/jpeg', 0, 6);

-- ── Proof — BM ─────────────────────────────────────────
INSERT OR IGNORE INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, sort_order)
VALUES
('proof-bm-1', 'proof-bm', 'bm-1', 'BM-1.jpg', 'media/proof-bm/BM-1.jpg', '/api/public-media/proof-bm/BM-1.jpg', 'image/jpeg', 0, 0),
('proof-bm-2', 'proof-bm', 'bm-2', 'BM-2.jpg', 'media/proof-bm/BM-2.jpg', '/api/public-media/proof-bm/BM-2.jpg', 'image/jpeg', 0, 1),
('proof-bm-3', 'proof-bm', 'bm-3', 'BM-3.jpg', 'media/proof-bm/BM-3.jpg', '/api/public-media/proof-bm/BM-3.jpg', 'image/jpeg', 0, 2);
