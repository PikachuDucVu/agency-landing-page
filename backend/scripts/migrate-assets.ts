import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8788'
const USERNAME = process.env.ADMIN_USERNAME || 'admin'
const PASSWORD = process.env.ADMIN_PASSWORD || 'roman2026!'
const FRONTEND_ROOT = process.env.FRONTEND_ROOT || 'F:/RomanAgencyMarketing/frontend'
const ASSETS_DIR = join(FRONTEND_ROOT, 'assets')

type AssetItem = {
  file: string
  section: string
  slot: string
  alt: string
  mimeType: string
  caption?: string
  caption_sub?: string
}

const inventory: AssetItem[] = [
  { file: 'hero-video-0402.mp4', section: 'hero', slot: 'video', alt: 'Roman Agency showcase video', mimeType: 'video/mp4' },
  { file: 'Container.png', section: 'brand', slot: 'logo', alt: 'Roman Agency Marketing', mimeType: 'image/png' },
  { file: 'meta-logo.png', section: 'marquee', slot: 'logo-1', alt: 'Meta', mimeType: 'image/png' },
  { file: 'service-rental.png', section: 'services', slot: 'card-1', alt: 'Ad Account Rental illustration', mimeType: 'image/png' },
  { file: 'service-sales.png', section: 'services', slot: 'card-2', alt: 'Healthy Profiles & Pages illustration', mimeType: 'image/png' },
  { file: 'service-managed.png', section: 'services', slot: 'card-3', alt: 'Full Support Service illustration', mimeType: 'image/png' },
  { file: 'SD1.png', section: 'resources', slot: 'item-1', alt: 'Payment history showing $15,513 total spend with $900 threshold — stable Visa payments', mimeType: 'image/png' },
  { file: 'SD2.png', section: 'resources', slot: 'item-2', alt: 'EUR payment activity showing €14,883 total spend — continuous daily payments', mimeType: 'image/png' },
  { file: 'SD3.png', section: 'proof-campaign', slot: 'screenshot-1', alt: 'Ads Manager showing $56,439 total spend across 221 campaigns', mimeType: 'image/png' },
  { file: 'SD7.png', section: 'proof-campaign', slot: 'screenshot-2', alt: 'Ads Manager showing $25,412 spend with $10,000/day budget campaign', mimeType: 'image/png' },
  { file: 'SD-extra.jpg', section: 'proof-campaign', slot: 'screenshot-3', alt: 'Additional campaign spending proof', mimeType: 'image/jpeg' },
  { file: 'SD5.png', section: 'proof-system', slot: 'system-1', alt: 'Ads Check tool showing multiple accounts with $1M+ total spend, no limit', mimeType: 'image/png' },
  { file: 'SD6.png', section: 'proof-system', slot: 'system-2', alt: 'Two verified Business Managers with 2500 account creation limit', mimeType: 'image/png' },
  { file: 'BM-3.jpg', section: 'proof-bm', slot: 'bm-1', alt: '1183 AG Properties LLC - Verified BM 2500, USA', mimeType: 'image/jpeg' },
  { file: 'BM-1.jpg', section: 'proof-bm', slot: 'bm-2', alt: 'Algerian Fashion Hub AG - Verified BM 2500', mimeType: 'image/jpeg' },
  { file: 'BM-2.jpg', section: 'proof-bm', slot: 'bm-3', alt: 'Soha Consulting - Verified BM 2500, Vietnam', mimeType: 'image/jpeg' },
  { file: 'gallery-large-1.jpg', section: 'proof-sigma', slot: 'item-1', alt: 'Roman Agency team at SiGMA World event', mimeType: 'image/jpeg' },
  { file: 'gallery-large-2.jpg', section: 'proof-sigma', slot: 'item-2', alt: 'Tradeshow environment with neon lighting', mimeType: 'image/jpeg' },
  { file: 'gallery-large-3.jpg', section: 'proof-sigma', slot: 'item-3', alt: 'Crowded event stage and audience', mimeType: 'image/jpeg' },
  { file: 'gallery-large-4.jpg', section: 'proof-sigma', slot: 'item-4', alt: 'Event crowd at conference floor', mimeType: 'image/jpeg' },
  { file: 'gallery-large-5.jpg', section: 'proof-affiliate', slot: 'item-1', alt: 'Roman Agency presentation booth at affiliate event', mimeType: 'image/jpeg' },
  { file: 'gallery-large-8.jpg', section: 'proof-affiliate', slot: 'item-2', alt: 'Roman Agency team on conference floor', mimeType: 'image/jpeg' },
  { file: 'gallery-large-7.jpg', section: 'proof-affiliate', slot: 'item-3', alt: 'Affiliate World stage and audience area', mimeType: 'image/jpeg' },
  { file: 'gallery-large-8.jpg', section: 'proof-affiliate', slot: 'item-4', alt: 'Affiliate conference exterior and attendees', mimeType: 'image/jpeg' },
  { file: 'hero-bg.png', section: 'meta', slot: 'og-image', alt: 'Roman Agency social sharing preview', mimeType: 'image/png' },
  { file: 'image-removebg-preview.png', section: 'favicon', slot: 'favicon', alt: 'Roman Agency favicon', mimeType: 'image/png' },
]

async function main() {
  console.log(`Using API: ${API_BASE}`)

  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  })

  const loginData = await loginRes.json()
  if (!loginRes.ok || !loginData.success) {
    throw new Error(loginData.error?.message || 'Login failed')
  }

  const token = loginData.data.token as string
  let uploaded = 0
  let skipped = 0

  for (const item of inventory) {
    const filePath = join(ASSETS_DIR, item.file)
    if (!existsSync(filePath)) {
      console.warn(`SKIP missing file: ${filePath}`)
      skipped++
      continue
    }

    const form = new FormData()
    const bytes = readFileSync(filePath)
    const blob = new Blob([bytes], { type: item.mimeType })
    form.append('file', blob, item.file)
    form.append('section', item.section)
    form.append('slot', item.slot)
    form.append('alt_text', item.alt)
    if (item.caption) form.append('caption', item.caption)
    if (item.caption_sub) form.append('caption_sub', item.caption_sub)

    const res = await fetch(`${API_BASE}/api/admin/media/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      console.error(`FAIL ${item.file}:`, data.error?.message || data)
      continue
    }

    console.log(`OK ${item.section}/${item.slot} <- ${item.file}`)
    uploaded++
  }

  console.log(`Done. Uploaded: ${uploaded}, skipped: ${skipped}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
