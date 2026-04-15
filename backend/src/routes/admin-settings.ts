import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

export const adminSettingsRoutes = new Hono<AppEnv>()

adminSettingsRoutes.use('*', requireAuth)

// ── GET /api/admin/settings ──────────────────────────────
adminSettingsRoutes.get('/settings', async (c) => {
  const lang = c.req.query('lang') || 'en'
  const { results } = await c.env.DB.prepare(
    `SELECT key, value, lang, updated_at FROM settings WHERE lang = ?`
  ).bind(lang).all()

  return c.json({ success: true, data: results, meta: { lang } })
})

// ── PUT /api/admin/settings ──────────────────────────────
// Upsert one or many settings at once
adminSettingsRoutes.put('/settings', async (c) => {
  let body: { lang?: string; settings: Record<string, string> }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const lang = body.lang || 'en'
  const { settings } = body

  if (!settings || typeof settings !== 'object') {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'settings object is required', status: 400 } }, 400)
  }

  const stmts = Object.entries(settings).map(([key, value]) =>
    c.env.DB.prepare(`
      INSERT INTO settings (key, value, lang)
      VALUES (?, ?, ?)
      ON CONFLICT(key, lang) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).bind(key, String(value), lang)
  )

  await c.env.DB.batch(stmts)

  return c.json({ success: true, data: { message: 'Settings updated', count: stmts.length } })
})

// ── DELETE /api/admin/settings/:key ─────────────────────
adminSettingsRoutes.delete('/settings/:key', async (c) => {
  const key = c.req.param('key')
  const lang = c.req.query('lang') || 'en'

  await c.env.DB.prepare(`DELETE FROM settings WHERE key = ? AND lang = ?`).bind(key, lang).run()

  return c.json({ success: true, data: { message: 'Setting deleted', key, lang } })
})
