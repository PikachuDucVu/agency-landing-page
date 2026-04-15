import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv, Stat } from '../types'

export const adminStatsRoutes = new Hono<AppEnv>()

adminStatsRoutes.use('*', requireAuth)

const VALID_STYLES = ['gold', 'dark', 'green', 'outline']

// ── GET /api/admin/stats ─────────────────────────────────
adminStatsRoutes.get('/stats', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM stats ORDER BY sort_order ASC`
  ).all<Stat>()

  return c.json({ success: true, data: results, meta: { total: results.length } })
})

// ── GET /api/admin/stats/:id ─────────────────────────────
adminStatsRoutes.get('/stats/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const item = await c.env.DB.prepare(`SELECT * FROM stats WHERE id = ?`).bind(id).first<Stat>()
  if (!item) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Stat not found', status: 404 } }, 404)
  }

  return c.json({ success: true, data: item })
})

// ── POST /api/admin/stats ────────────────────────────────
adminStatsRoutes.post('/stats', async (c) => {
  let body: {
    label: string
    value: number
    prefix?: string
    suffix?: string
    description?: string
    icon_key?: string
    card_style?: string
    sort_order?: number
  }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const { label, value, prefix = '', suffix = '', description = '', icon_key = 'dollar', card_style = 'dark', sort_order } = body

  if (!label?.trim() || value === undefined || value === null) {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'label and value are required', status: 400 } }, 400)
  }

  if (card_style && !VALID_STYLES.includes(card_style)) {
    return c.json({ success: false, error: { code: 'INVALID_STYLE', message: `card_style must be one of: ${VALID_STYLES.join(', ')}`, status: 400 } }, 400)
  }

  let order = sort_order
  if (order === undefined) {
    const maxOrder = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM stats`
    ).first<{ next: number }>()
    order = maxOrder?.next ?? 1
  }

  const { meta } = await c.env.DB.prepare(
    `INSERT INTO stats (label, value, prefix, suffix, description, icon_key, card_style, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(label.trim(), value, prefix, suffix, description, icon_key, card_style, order).run()

  const newItem = await c.env.DB.prepare(`SELECT * FROM stats WHERE id = ?`).bind(meta.last_row_id).first<Stat>()
  return c.json({ success: true, data: newItem }, 201)
})

// ── PATCH /api/admin/stats/:id ───────────────────────────
adminStatsRoutes.patch('/stats/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  let body: Partial<{ label: string; value: number; prefix: string; suffix: string; description: string; icon_key: string; card_style: string; sort_order: number; is_visible: number }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM stats WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Stat not found', status: 404 } }, 404)
  }

  if (body.card_style && !VALID_STYLES.includes(body.card_style)) {
    return c.json({ success: false, error: { code: 'INVALID_STYLE', message: `card_style must be one of: ${VALID_STYLES.join(', ')}`, status: 400 } }, 400)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (body.label       !== undefined) { fields.push('label = ?');       values.push(body.label.trim()) }
  if (body.value       !== undefined) { fields.push('value = ?');       values.push(body.value) }
  if (body.prefix      !== undefined) { fields.push('prefix = ?');      values.push(body.prefix) }
  if (body.suffix      !== undefined) { fields.push('suffix = ?');      values.push(body.suffix) }
  if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description) }
  if (body.icon_key    !== undefined) { fields.push('icon_key = ?');    values.push(body.icon_key) }
  if (body.card_style  !== undefined) { fields.push('card_style = ?');  values.push(body.card_style) }
  if (body.sort_order  !== undefined) { fields.push('sort_order = ?');  values.push(body.sort_order) }
  if (body.is_visible  !== undefined) { fields.push('is_visible = ?');  values.push(body.is_visible ? 1 : 0) }

  if (!fields.length) {
    return c.json({ success: false, error: { code: 'NO_FIELDS', message: 'No fields to update', status: 400 } }, 400)
  }

  fields.push('updated_at = datetime(\'now\')')
  values.push(id)

  await c.env.DB.prepare(`UPDATE stats SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  const updated = await c.env.DB.prepare(`SELECT * FROM stats WHERE id = ?`).bind(id).first<Stat>()

  return c.json({ success: true, data: updated })
})

// ── DELETE /api/admin/stats/:id ──────────────────────────
adminStatsRoutes.delete('/stats/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM stats WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Stat not found', status: 404 } }, 404)
  }

  await c.env.DB.prepare(`DELETE FROM stats WHERE id = ?`).bind(id).run()
  return c.json({ success: true, data: { message: 'Stat deleted', id } })
})
