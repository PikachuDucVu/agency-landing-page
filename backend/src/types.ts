// ── Cloudflare Workers Bindings ──────────────────────────
export type Bindings = {
  DB: D1Database
  MEDIA: R2Bucket
  JWT_SECRET: string
  ADMIN_USERNAME: string
  CORS_ORIGINS: string
}

export type Variables = {
  userId?: number
  username?: string
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}

// ── Database Models ─────────────────────────────────────
export interface MediaItem {
  id: string
  section: string
  slot: string
  file_name: string
  r2_key: string
  r2_url: string
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  alt_text: string
  caption: string
  caption_sub: string
  sort_order: number
  is_visible: number
  created_at: string
  updated_at: string
}

export interface FAQ {
  id: number
  question: string
  answer: string
  sort_order: number
  lang: string
  is_active: number
  created_at: string
  updated_at: string
}

export interface Setting {
  key: string
  value: string
  lang: string
  updated_at: string
}

export interface Subscriber {
  id: number
  email: string
  status: string
  ip_address: string
  created_at: string
  origin: string | null
  user_agent: string | null
  unsubscribed_at: string | null
}

export interface AdminUser {
  id: number
  username: string
  password_hash: string
  created_at: string
}

export interface PublishRelease {
  id: number
  version: number
  status: string
  config_json: string
  config_hash: string
  notes: string
  published_by: string | null
  created_at: string
}

export interface Testimonial {
  id: number
  author_name: string
  author_role: string
  content: string
  lang: string
  sort_order: number
  is_active: number
  avatar_r2_key: string
  avatar_r2_url: string
  created_at: string
  updated_at: string
}

// ── API Response Envelope ───────────────────────────────
export interface ApiSuccess<T = unknown> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    status: number
  }
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ── Media Sections (matching landing page) ──────────────
export const MEDIA_SECTIONS = [
  'hero',
  'brand',
  'marquee',
  'services',
  'resources',
  'proof-campaign',
  'proof-system',
  'proof-bm',
  'proof-sigma',
  'proof-affiliate',
  'meta',
  'favicon',
] as const

export type MediaSection = typeof MEDIA_SECTIONS[number]

// ── Allowed file types ──────────────────────────────────
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
]

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024   // 5 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024  // 50 MB

export interface Product {
  id: number
  category: string
  sub_group: string
  name: string
  limit_text: string
  description: string
  icon_key: string
  is_gold: number
  sort_order: number
  is_visible: number
  created_at: string
  updated_at: string
}

export interface PaymentMethod {
  id: number
  name: string
  label: string
  icon_key: string
  sort_order: number
  is_visible: number
  created_at: string
  updated_at: string
}

export interface WalletAddress {
  id: number
  payment_method_id: number
  network: string
  address: string
  sort_order: number
  is_visible: number
}

export interface Stat {
  id: number
  label: string
  value: number
  prefix: string
  suffix: string
  description: string
  icon_key: string
  card_style: string
  sort_order: number
  is_visible: number
  created_at: string
  updated_at: string
}
