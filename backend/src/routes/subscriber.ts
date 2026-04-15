import { Hono } from 'hono'
import type { AppEnv } from '../types'

export const subscriberRoutes = new Hono<AppEnv>()

// ── In-memory rate limit (3 per minute per IP) ──────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60_000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  // Lazy cleanup: remove stale entries on each check
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key)
    }
  }

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= RATE_LIMIT) {
    return false
  }

  entry.count++
  return true
}

// ── POST /api/subscribe ──────────────────────────────────
subscriberRoutes.post('/subscribe', async (c) => {
  // Rate limiting
  const clientIp = c.req.header('cf-connecting-ip')
    || c.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    || c.req.header('x-real-ip')
    || '0.0.0.0'

  if (!checkRateLimit(clientIp)) {
    return c.json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.', status: 429 },
    }, 429)
  }

  let body: { email?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Invalid JSON body', status: 400 },
    }, 400)
  }

  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return c.json({
      success: false,
      error: { code: 'MISSING_EMAIL', message: 'Email is required', status: 400 },
    }, 400)
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!isValidEmail) {
    return c.json({
      success: false,
      error: { code: 'INVALID_EMAIL', message: 'Invalid email format', status: 400 },
    }, 400)
  }

  // Check if already subscribed
  const existing = await c.env.DB.prepare(
    `SELECT id, status FROM subscribers WHERE email = ?`
  ).bind(email).first<{ id: number; status: string }>()

  if (existing) {
    // Re-activate if previously unsubscribed
    if (existing.status === 'unsubscribed') {
      await c.env.DB.prepare(
        `UPDATE subscribers SET status = 'active', unsubscribed_at = NULL WHERE id = ?`
      ).bind(existing.id).run()
      return c.json({
        success: true,
        data: { message: 'Welcome back! You have been re-subscribed.' },
      })
    }
    return c.json({
      success: true,
      data: { message: 'Email already subscribed' },
    })
  }

  // Insert new subscriber with IP
  await c.env.DB.prepare(
    `INSERT INTO subscribers (email, status, ip_address, origin, user_agent) VALUES (?, 'active', ?, ?, ?)`
  ).bind(
    email,
    clientIp,
    c.req.header('origin') ?? null,
    c.req.header('user-agent') ?? null,
  ).run()

  return c.json({
    success: true,
    data: { message: 'Subscribed successfully' },
  }, 201)
})
