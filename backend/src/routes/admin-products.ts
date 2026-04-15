import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv, Product } from '../types'

export const adminProductRoutes = new Hono<AppEnv>()

adminProductRoutes.use('*', requireAuth)

// ── GET /api/admin/products ──────────────────────────────
adminProductRoutes.get('/products', async (c) => {
  const category = c.req.query('category')
  const lang = c.req.query('lang')
  const conditions: string[] = []
  const bindings: string[] = []

  if (category) { conditions.push('category = ?'); bindings.push(category) }
  if (lang) { conditions.push('lang = ?'); bindings.push(lang) }

  let query = `SELECT * FROM products`
  if (conditions.length) query += ` WHERE ${conditions.join(' AND ')}`
  query += ` ORDER BY category, sub_group DESC, sort_order ASC`

  const { results } = bindings.length
    ? await c.env.DB.prepare(query).bind(...bindings).all<Product>()
    : await c.env.DB.prepare(query).all<Product>()

  return c.json({ success: true, data: results, meta: { total: results.length } })
})

// ── GET /api/admin/products/:id ──────────────────────────
adminProductRoutes.get('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const item = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first<Product>()
  if (!item) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found', status: 404 } }, 404)
  }

  return c.json({ success: true, data: item })
})

// ── POST /api/admin/products ─────────────────────────────
adminProductRoutes.post('/products', async (c) => {
  let body: {
    category: string
    sub_group?: string
    name: string
    limit_text: string
    description: string
    icon_key?: string
    is_gold?: number
    sort_order?: number
    lang?: string
  }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const { category, sub_group = '', name, limit_text, description, icon_key = 'fb', is_gold = 0, sort_order, lang = 'en' } = body

  if (!category?.trim() || !name?.trim() || !limit_text?.trim() || !description?.trim()) {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'category, name, limit_text, description are required', status: 400 } }, 400)
  }

  const validCategories = ['personal', 'bm', 'fanpage', 'profile']
  if (!validCategories.includes(category)) {
    return c.json({ success: false, error: { code: 'INVALID_CATEGORY', message: `category must be one of: ${validCategories.join(', ')}`, status: 400 } }, 400)
  }

  let order = sort_order
  if (order === undefined) {
    const maxOrder = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM products WHERE category = ?`
    ).bind(category).first<{ next: number }>()
    order = maxOrder?.next ?? 1
  }

  const { meta } = await c.env.DB.prepare(
    `INSERT INTO products (category, sub_group, name, limit_text, description, icon_key, is_gold, sort_order, lang) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(category, sub_group, name.trim(), limit_text.trim(), description.trim(), icon_key, is_gold ? 1 : 0, order, lang).run()

  const newItem = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(meta.last_row_id).first<Product>()
  return c.json({ success: true, data: newItem }, 201)
})

// ── PATCH /api/admin/products/:id ───────────────────────
adminProductRoutes.patch('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  let body: Partial<{ category: string; sub_group: string; name: string; limit_text: string; description: string; icon_key: string; is_gold: number; sort_order: number; is_visible: number }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM products WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found', status: 404 } }, 404)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (body.category   !== undefined) { fields.push('category = ?');    values.push(body.category) }
  if (body.sub_group  !== undefined) { fields.push('sub_group = ?');   values.push(body.sub_group) }
  if (body.name       !== undefined) { fields.push('name = ?');        values.push(body.name.trim()) }
  if (body.limit_text !== undefined) { fields.push('limit_text = ?');  values.push(body.limit_text.trim()) }
  if (body.description!== undefined) { fields.push('description = ?'); values.push(body.description.trim()) }
  if (body.icon_key   !== undefined) { fields.push('icon_key = ?');    values.push(body.icon_key) }
  if (body.is_gold    !== undefined) { fields.push('is_gold = ?');     values.push(body.is_gold ? 1 : 0) }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?');  values.push(body.sort_order) }
  if (body.is_visible !== undefined) { fields.push('is_visible = ?');  values.push(body.is_visible ? 1 : 0) }

  if (!fields.length) {
    return c.json({ success: false, error: { code: 'NO_FIELDS', message: 'No fields to update', status: 400 } }, 400)
  }

  fields.push('updated_at = datetime(\'now\')')
  values.push(id)

  await c.env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  const updated = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first<Product>()

  return c.json({ success: true, data: updated })
})

// ── DELETE /api/admin/products/:id ──────────────────────
adminProductRoutes.delete('/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM products WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found', status: 404 } }, 404)
  }

  await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()
  return c.json({ success: true, data: { message: 'Product deleted', id } })
})

// ── PATCH /api/admin/products/reorder ───────────────────
adminProductRoutes.patch('/products/reorder', async (c) => {
  let body: { items: { id: number; sort_order: number }[] }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return c.json({ success: false, error: { code: 'INVALID_BODY', message: 'items array required', status: 400 } }, 400)
  }

  const stmts = body.items.map(({ id, sort_order }) =>
    c.env.DB.prepare(`UPDATE products SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`).bind(sort_order, id)
  )

  await c.env.DB.batch(stmts)
  return c.json({ success: true, data: { updated: body.items.length } })
})
