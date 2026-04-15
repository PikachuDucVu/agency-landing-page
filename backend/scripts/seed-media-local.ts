/**
 * seed-media-local.ts
 *
 * Upload ảnh từ admin/public/asset-preview/ vào R2 local + cập nhật DB
 * Chạy sau khi đã: npm install, wrangler.toml, migrations, wrangler dev
 *
 * Usage:
 *   1. Start server:  npx wrangler dev
 *   2. Setup admin:   curl -X POST http://localhost:8787/api/auth/setup -H "Content-Type: application/json" -d '{"username":"admin","password":"admin12345"}'
 *   3. Run script:    npx tsx scripts/seed-media-local.ts
 *      hoặc:          bun run scripts/seed-media-local.ts
 */

const API = process.env.API_URL || 'http://localhost:8787';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin12345';

const ASSET_DIR = new URL('../admin/public/asset-preview/', import.meta.url).pathname
  .replace(/^\/([A-Z]:)/, '$1'); // fix Windows path

// Map: file_name → { section, slot }
const MEDIA_MAP: Array<{ file: string; section: string; slot: string }> = [
  // Brand
  { file: 'Container.png', section: 'brand', slot: 'logo' },
  { file: 'image-removebg-preview.png', section: 'brand', slot: 'logo-alt' },
  // Hero
  { file: 'hero-bg.png', section: 'hero', slot: 'bg' },
  // Services
  { file: 'service-rental.png', section: 'services', slot: 'rental' },
  { file: 'service-sales.png', section: 'services', slot: 'sales' },
  { file: 'service-managed.png', section: 'services', slot: 'managed' },
  // Meta
  { file: 'meta-logo.png', section: 'meta', slot: 'logo' },
  // Resources
  { file: 'SD1.png', section: 'resources', slot: 'sd1' },
  { file: 'SD2.png', section: 'resources', slot: 'sd2' },
  { file: 'SD3.png', section: 'resources', slot: 'sd3' },
  { file: 'SD5.png', section: 'resources', slot: 'sd5' },
  { file: 'SD6.png', section: 'resources', slot: 'sd6' },
  { file: 'SD7.png', section: 'resources', slot: 'sd7' },
  { file: 'SD-extra.jpg', section: 'resources', slot: 'extra' },
  // Proof — Campaign
  { file: 'gallery-large-1.jpg', section: 'proof-campaign', slot: 'gallery-1' },
  { file: 'gallery-large-2.jpg', section: 'proof-campaign', slot: 'gallery-2' },
  { file: 'gallery-large-3.jpg', section: 'proof-campaign', slot: 'gallery-3' },
  { file: 'gallery-large-4.jpg', section: 'proof-campaign', slot: 'gallery-4' },
  { file: 'gallery-large-5.jpg', section: 'proof-campaign', slot: 'gallery-5' },
  { file: 'gallery-large-7.jpg', section: 'proof-campaign', slot: 'gallery-7' },
  { file: 'gallery-large-8.jpg', section: 'proof-campaign', slot: 'gallery-8' },
  // Proof — BM
  { file: 'BM-1.jpg', section: 'proof-bm', slot: 'bm-1' },
  { file: 'BM-2.jpg', section: 'proof-bm', slot: 'bm-2' },
  { file: 'BM-3.jpg', section: 'proof-bm', slot: 'bm-3' },
];

async function main() {
  const { readFileSync, existsSync } = await import('fs');
  const { join } = await import('path');

  // 1. Login
  console.log(`\n🔑 Logging in to ${API}...`);
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });
  const loginData = await loginRes.json() as any;
  if (!loginData.success) {
    console.error('❌ Login failed:', loginData.error?.message);
    console.log('   Hãy tạo admin user trước:');
    console.log(`   curl -X POST ${API}/api/auth/setup -H "Content-Type: application/json" -d '{"username":"${ADMIN_USER}","password":"${ADMIN_PASS}"}'`);
    process.exit(1);
  }
  const token = loginData.data.token;
  console.log('✅ Logged in\n');

  // 2. Upload each file
  let ok = 0, skip = 0, fail = 0;

  for (const item of MEDIA_MAP) {
    const filePath = join(ASSET_DIR, item.file);

    if (!existsSync(filePath)) {
      console.log(`⏭  Skip: ${item.file} (file not found)`);
      skip++;
      continue;
    }

    const fileBuffer = readFileSync(filePath);
    const ext = item.file.split('.').pop()!.toLowerCase();
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
      : ext === 'png' ? 'image/png'
      : ext === 'webp' ? 'image/webp'
      : ext === 'svg' ? 'image/svg+xml'
      : 'application/octet-stream';

    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer], { type: mimeType }), item.file);
    formData.append('section', item.section);
    formData.append('slot', item.slot);

    try {
      const res = await fetch(`${API}/api/admin/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json() as any;

      if (data.success) {
        console.log(`✅ ${item.section}/${item.slot} ← ${item.file}`);
        ok++;
      } else {
        console.log(`⚠️  ${item.file}: ${data.error?.message}`);
        fail++;
      }
    } catch (err: any) {
      console.log(`❌ ${item.file}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n📊 Done: ${ok} uploaded, ${skip} skipped, ${fail} failed`);
  console.log('🎉 Media seeded! Refresh admin panel to see images.\n');
}

main().catch(console.error);
