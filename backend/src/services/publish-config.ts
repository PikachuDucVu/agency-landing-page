import type { D1Database } from '@cloudflare/workers-types'
import type { MediaItem, Product, PaymentMethod, WalletAddress, Stat, FAQ, Testimonial } from '../types'

// ── Types ────────────────────────────────────────────────

type FixedSlotEntry = {
  id: string
  slot: string
  url: string
  alt: string
  caption: string
  caption_sub: string
  mimeType: string
}

type ListEntry = FixedSlotEntry

type PublishedMediaConfig = Record<
  string,
  Record<string, FixedSlotEntry> | { items: ListEntry[] }
>

const LIST_SECTIONS = new Set([
  'resources',
  'proof-campaign',
  'proof-system',
  'proof-bm',
  'proof-sigma',
  'proof-affiliate',
])

// ── Main Builder ─────────────────────────────────────────

export async function buildPublishedConfig(
  db: D1Database,
  options?: { includeHidden?: boolean }
) {
  const includeHidden = options?.includeHidden ?? false

  // ── Media ──────────────────────────────────────────────
  const mediaQuery = includeHidden
    ? `SELECT * FROM media_items ORDER BY section, sort_order ASC, created_at ASC`
    : `SELECT * FROM media_items WHERE is_visible = 1 ORDER BY section, sort_order ASC, created_at ASC`

  const { results: mediaItems } = await db.prepare(mediaQuery).all<MediaItem>()

  const media: PublishedMediaConfig = {}

  for (const item of mediaItems) {
    const normalized: FixedSlotEntry = {
      id: item.id,
      slot: item.slot,
      url: item.r2_url,
      alt: item.alt_text || '',
      caption: item.caption || '',
      caption_sub: item.caption_sub || '',
      mimeType: item.mime_type,
    }

    if (LIST_SECTIONS.has(item.section)) {
      if (!media[item.section]) media[item.section] = { items: [] }
      ;(media[item.section] as { items: ListEntry[] }).items.push(normalized)
      continue
    }

    if (!media[item.section]) media[item.section] = {}
    ;(media[item.section] as Record<string, FixedSlotEntry>)[item.slot] = normalized
  }

  // ── Stats ──────────────────────────────────────────────
  const statsQuery = includeHidden
    ? `SELECT * FROM stats ORDER BY sort_order ASC`
    : `SELECT * FROM stats WHERE is_visible = 1 ORDER BY sort_order ASC`

  const { results: statsRows } = await db.prepare(statsQuery).all<Stat>()

  const stats = statsRows.map(s => ({
    id: s.id,
    label: s.label,
    value: s.value,
    prefix: s.prefix,
    suffix: s.suffix,
    description: s.description,
    icon_key: s.icon_key,
    card_style: s.card_style,
  }))

  // ── Products ───────────────────────────────────────────
  const productsQuery = includeHidden
    ? `SELECT * FROM products ORDER BY category, sub_group DESC, sort_order ASC`
    : `SELECT * FROM products WHERE is_visible = 1 ORDER BY category, sub_group DESC, sort_order ASC`

  const { results: productRows } = await db.prepare(productsQuery).all<Product>()

  // Group by category
  const productsByCategory: Record<string, unknown[]> = {}
  for (const p of productRows) {
    if (!productsByCategory[p.category]) productsByCategory[p.category] = []
    productsByCategory[p.category].push({
      id: p.id,
      category: p.category,
      sub_group: p.sub_group,
      name: p.name,
      limit_text: p.limit_text,
      description: p.description,
      icon_key: p.icon_key,
      is_gold: p.is_gold === 1,
    })
  }

  const products = {
    categories: Object.keys(productsByCategory),
    items: productRows.map(p => ({
      id: p.id,
      category: p.category,
      sub_group: p.sub_group,
      name: p.name,
      limit_text: p.limit_text,
      description: p.description,
      icon_key: p.icon_key,
      is_gold: p.is_gold === 1,
    })),
  }

  // ── Payments ───────────────────────────────────────────
  const paymentsQuery = includeHidden
    ? `SELECT * FROM payment_methods ORDER BY sort_order ASC`
    : `SELECT * FROM payment_methods WHERE is_visible = 1 ORDER BY sort_order ASC`

  const { results: methodRows } = await db.prepare(paymentsQuery).all<PaymentMethod>()

  const walletsQuery = includeHidden
    ? `SELECT * FROM wallet_addresses ORDER BY payment_method_id, sort_order ASC`
    : `SELECT * FROM wallet_addresses WHERE is_visible = 1 ORDER BY payment_method_id, sort_order ASC`

  const { results: walletRows } = await db.prepare(walletsQuery).all<WalletAddress>()

  const walletMap = new Map<number, WalletAddress[]>()
  for (const w of walletRows) {
    if (!walletMap.has(w.payment_method_id)) walletMap.set(w.payment_method_id, [])
    walletMap.get(w.payment_method_id)!.push(w)
  }

  const payments = methodRows.map(m => ({
    id: m.id,
    name: m.name,
    label: m.label,
    icon_key: m.icon_key,
    wallets: (walletMap.get(m.id) ?? []).map(w => ({
      id: w.id,
      network: w.network,
      address: w.address,
    })),
  }))

  // ── FAQs ───────────────────────────────────────────────
  const faqsQuery = includeHidden
    ? `SELECT * FROM faqs ORDER BY lang, sort_order ASC`
    : `SELECT * FROM faqs WHERE is_active = 1 ORDER BY lang, sort_order ASC`

  const { results: faqRows } = await db.prepare(faqsQuery).all<FAQ>()

  // Group by lang
  const faqsByLang: Record<string, { question: string; answer: string }[]> = {}
  for (const f of faqRows) {
    if (!faqsByLang[f.lang]) faqsByLang[f.lang] = []
    faqsByLang[f.lang].push({ question: f.question, answer: f.answer })
  }

  // ── Testimonials ───────────────────────────────────────
  const testimonialsQuery = includeHidden
    ? `SELECT * FROM testimonials ORDER BY lang, sort_order ASC`
    : `SELECT * FROM testimonials WHERE is_active = 1 ORDER BY lang, sort_order ASC`

  const { results: testimonialRows } = await db.prepare(testimonialsQuery).all<Testimonial>()

  const testimonialsByLang: Record<string, { author_name: string; author_role: string; content: string; avatar_url: string }[]> = {}
  for (const t of testimonialRows) {
    if (!testimonialsByLang[t.lang]) testimonialsByLang[t.lang] = []
    testimonialsByLang[t.lang].push({
      author_name: t.author_name,
      author_role: t.author_role,
      content: t.content,
      avatar_url: t.avatar_r2_url || '',
    })
  }

  // ── Settings ───────────────────────────────────────────
  const { results: settingsRows } = await db.prepare(
    `SELECT key, value, lang FROM settings ORDER BY lang, key ASC`
  ).all<{ key: string; value: string; lang: string }>()

  const settingsByLang: Record<string, Record<string, string>> = {}
  for (const s of settingsRows) {
    if (!settingsByLang[s.lang]) settingsByLang[s.lang] = {}
    settingsByLang[s.lang][s.key] = s.value
  }

  // ── Assemble config ────────────────────────────────────
  const config = {
    generatedAt: new Date().toISOString(),
    media,
    stats,
    products,
    payments,
    faqs: faqsByLang,
    testimonials: testimonialsByLang,
    settings: settingsByLang,
  }

  const summary = {
    mediaItems: mediaItems.length,
    stats: stats.length,
    products: productRows.length,
    paymentMethods: methodRows.length,
    wallets: walletRows.length,
    faqs: faqRows.length,
    testimonials: testimonialRows.length,
    settings: settingsRows.length,
  }

  const canonicalJson = stableStringify({ media, stats, products, payments, faqs: faqsByLang, testimonials: testimonialsByLang, settings: settingsByLang })
  const hash = await sha256Hex(canonicalJson)

  return { config, summary, hash }
}

// ── Keep backward compat alias ────────────────────────────
export const buildPublishedMediaConfig = buildPublishedConfig

// ── Helpers ──────────────────────────────────────────────

export async function getCurrentPublishedRelease(db: D1Database) {
  const current = await db.prepare(`SELECT value FROM publish_state WHERE key = 'current_release_id'`).first<{ value: string }>()
  if (!current) return null

  return db.prepare(
    `SELECT id, version, status, config_json, config_hash, notes, published_by, created_at
     FROM publish_releases WHERE id = ?`
  ).bind(current.value).first<{
    id: number
    version: number
    status: string
    config_json: string
    config_hash: string
    notes: string
    published_by: string | null
    created_at: string
  }>()
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortObject(value))
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject)

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortObject((value as Record<string, unknown>)[key])
        return acc
      }, {})
  }

  return value
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
