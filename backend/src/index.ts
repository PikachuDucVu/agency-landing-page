import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import type { AppEnv } from './types'
import { publicRoutes } from './routes/public'
import { subscriberRoutes } from './routes/subscriber'
import { authRoutes } from './routes/auth'
import { adminMediaRoutes } from './routes/admin-media'
import { adminFaqRoutes } from './routes/admin-faq'
import { adminSettingsRoutes } from './routes/admin-settings'
import { adminSubscriberRoutes } from './routes/admin-subscribers'
import { adminPublishRoutes } from './routes/admin-publish'
import { adminTestimonialRoutes } from './routes/admin-testimonials'
import { adminProductRoutes } from './routes/admin-products'
import { adminPaymentRoutes } from './routes/admin-payments'
import { adminStatsRoutes } from './routes/admin-stats'

const app = new Hono<AppEnv>()

// ── Global Middleware ────────────────────────────────────
app.use('*', logger())

app.use('*', async (c, next) => {
  const origins = c.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || []

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return undefined
      return origins.includes(origin) ? origin : undefined
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })

  return corsMiddleware(c, next)
})

// ── Hostname Guard ──────────────────────────────────────
// api.romanagency.net  → only public API (no admin, no auth)
// admin.romanagency.net → full access (admin panel + API + auth)
// localhost/127.0.0.1   → full access (dev)
app.use('/api/admin/*', async (c, next) => {
  const host = c.req.header('host') || ''
  if (host.startsWith('api.')) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Admin API not available on this domain', status: 403 },
    }, 403)
  }
  return next()
})

app.use('/api/auth/*', async (c, next) => {
  const host = c.req.header('host') || ''
  if (host.startsWith('api.')) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Auth not available on this domain', status: 403 },
    }, 403)
  }
  return next()
})

// ── Health Check ────────────────────────────────────────
app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      service: 'Roman Agency API',
      version: '1.0.0',
      status: 'running',
    },
  })
})

app.get('/api/health', (c) => {
  return c.json({ ok: true, service: 'roman-agency-api' })
})

// ── Public API Routes ───────────────────────────────────
app.route('/api', publicRoutes)
app.route('/api', subscriberRoutes)

// ── Auth Routes ─────────────────────────────────────────
app.route('/api/auth', authRoutes)

// ── Admin Routes (JWT-protected) ────────────────────────
app.route('/api/admin', adminMediaRoutes)
app.route('/api/admin', adminFaqRoutes)
app.route('/api/admin', adminSettingsRoutes)
app.route('/api/admin', adminSubscriberRoutes)
app.route('/api/admin', adminPublishRoutes)
app.route('/api/admin', adminTestimonialRoutes)
app.route('/api/admin', adminProductRoutes)
app.route('/api/admin', adminPaymentRoutes)
app.route('/api/admin', adminStatsRoutes)

// ── 404 Handler ─────────────────────────────────────────
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${c.req.method} ${c.req.path} not found`,
      status: 404,
    },
  }, 404)
})

// ── Error Handler ───────────────────────────────────────
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      status: 500,
    },
  }, 500)
})

export default app
