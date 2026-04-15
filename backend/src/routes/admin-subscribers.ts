import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

export const adminSubscriberRoutes = new Hono<AppEnv>()

adminSubscriberRoutes.use('*', requireAuth)

// ── GET /api/admin/subscribers ───────────────────────────
// Supports: ?page=1&limit=50&search=gmail&status=active
adminSubscriberRoutes.get('/subscribers', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
  const offset = (page - 1) * limit
  const search = c.req.query('search')?.trim()
  const status = c.req.query('status')?.trim()

  let where = 'WHERE 1=1'
  const bindings: unknown[] = []

  if (search) {
    where += ` AND email LIKE ?`
    bindings.push(`%${search}%`)
  }

  if (status && status !== 'all') {
    where += ` AND status = ?`
    bindings.push(status)
  }

  const countQuery = `SELECT COUNT(*) as count FROM subscribers ${where}`
  const listQuery = `SELECT id, email, status, created_at, origin, ip_address, unsubscribed_at FROM subscribers ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`

  const total = bindings.length
    ? await c.env.DB.prepare(countQuery).bind(...bindings).first<{ count: number }>()
    : await c.env.DB.prepare(countQuery).first<{ count: number }>()

  const { results } = await c.env.DB.prepare(listQuery).bind(...bindings, limit, offset).all()

  return c.json({
    success: true,
    data: results,
    meta: { total: total?.count ?? 0, page, limit, pages: Math.ceil((total?.count ?? 0) / limit) },
  })
})

// ── PATCH /api/admin/subscribers/:id ────────────────────
// Update status: active / unsubscribed
adminSubscriberRoutes.patch('/subscribers/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  let body: { status?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM subscribers WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Subscriber not found', status: 404 } }, 404)
  }

  const validStatuses = ['active', 'unsubscribed']
  if (body.status && !validStatuses.includes(body.status)) {
    return c.json({ success: false, error: { code: 'INVALID_STATUS', message: `status must be: ${validStatuses.join(', ')}`, status: 400 } }, 400)
  }

  if (body.status) {
    const unsubAt = body.status === 'unsubscribed' ? "datetime('now')" : 'NULL'
    await c.env.DB.prepare(
      `UPDATE subscribers SET status = ?, unsubscribed_at = ${unsubAt} WHERE id = ?`
    ).bind(body.status, id).run()
  }

  const updated = await c.env.DB.prepare(
    `SELECT id, email, status, created_at, origin, unsubscribed_at FROM subscribers WHERE id = ?`
  ).bind(id).first()

  return c.json({ success: true, data: updated })
})

// ── DELETE /api/admin/subscribers/:id ───────────────────
adminSubscriberRoutes.delete('/subscribers/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const existing = await c.env.DB.prepare(`SELECT id FROM subscribers WHERE id = ?`).bind(id).first()

  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Subscriber not found', status: 404 } }, 404)
  }

  await c.env.DB.prepare(`DELETE FROM subscribers WHERE id = ?`).bind(id).run()

  return c.json({ success: true, data: { message: 'Subscriber removed', id } })
})

// ── GET /api/admin/subscribers/export ───────────────────
// Export as CSV
adminSubscriberRoutes.get('/subscribers/export', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT email, status, created_at, origin FROM subscribers ORDER BY created_at DESC`
  ).all<{ email: string; status: string; created_at: string; origin: string | null }>()

  const csv = [
    'email,status,subscribed_at,source',
    ...results.map(r => `${r.email},${r.status || 'active'},${r.created_at},${r.origin || ''}`)
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
})
