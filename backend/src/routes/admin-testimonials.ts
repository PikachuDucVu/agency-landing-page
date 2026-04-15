import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv, Testimonial } from '../types'

export const adminTestimonialRoutes = new Hono<AppEnv>()

adminTestimonialRoutes.use('*', requireAuth)

// ── GET /api/admin/testimonials ─────────────────────────
adminTestimonialRoutes.get('/testimonials', async (c) => {
  const lang = c.req.query('lang')
  let query = `SELECT * FROM testimonials`
  const bindings: string[] = []

  if (lang) {
    query += ` WHERE lang = ?`
    bindings.push(lang)
  }

  query += ` ORDER BY lang, sort_order ASC`

  const { results } = bindings.length
    ? await c.env.DB.prepare(query).bind(...bindings).all<Testimonial>()
    : await c.env.DB.prepare(query).all<Testimonial>()

  return c.json({ success: true, data: results, meta: { total: results.length } })
})

// ── GET /api/admin/testimonials/:id ─────────────────────
adminTestimonialRoutes.get('/testimonials/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const item = await c.env.DB.prepare(`SELECT * FROM testimonials WHERE id = ?`).bind(id).first<Testimonial>()

  if (!item) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Testimonial not found', status: 404 } }, 404)
  }

  return c.json({ success: true, data: item })
})

// ── POST /api/admin/testimonials ────────────────────────
adminTestimonialRoutes.post('/testimonials', async (c) => {
  let body: { author_name: string; author_role?: string; content: string; lang?: string; sort_order?: number }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const { author_name, author_role = '', content, lang = 'en', sort_order } = body

  if (!author_name?.trim() || !content?.trim()) {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'author_name and content are required', status: 400 } }, 400)
  }

  let order = sort_order
  if (order === undefined) {
    const maxOrder = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM testimonials WHERE lang = ?`
    ).bind(lang).first<{ next: number }>()
    order = maxOrder?.next ?? 1
  }

  const { meta } = await c.env.DB.prepare(
    `INSERT INTO testimonials (author_name, author_role, content, lang, sort_order) VALUES (?, ?, ?, ?, ?)`
  ).bind(author_name.trim(), author_role.trim(), content.trim(), lang, order).run()

  const newItem = await c.env.DB.prepare(`SELECT * FROM testimonials WHERE id = ?`).bind(meta.last_row_id).first<Testimonial>()

  return c.json({ success: true, data: newItem }, 201)
})

// ── PATCH /api/admin/testimonials/:id ───────────────────
adminTestimonialRoutes.patch('/testimonials/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  let body: Partial<{ author_name: string; author_role: string; content: string; sort_order: number; is_active: number }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM testimonials WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Testimonial not found', status: 404 } }, 404)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (body.author_name !== undefined) { fields.push('author_name = ?'); values.push(body.author_name.trim()) }
  if (body.author_role !== undefined) { fields.push('author_role = ?'); values.push(body.author_role.trim()) }
  if (body.content !== undefined) { fields.push('content = ?'); values.push(body.content.trim()) }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order) }
  if (body.is_active !== undefined) { fields.push('is_active = ?'); values.push(body.is_active ? 1 : 0) }

  if (!fields.length) {
    return c.json({ success: false, error: { code: 'NO_FIELDS', message: 'No fields to update', status: 400 } }, 400)
  }

  fields.push('updated_at = datetime(\'now\')')
  values.push(id)

  await c.env.DB.prepare(`UPDATE testimonials SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()

  const updated = await c.env.DB.prepare(`SELECT * FROM testimonials WHERE id = ?`).bind(id).first<Testimonial>()

  return c.json({ success: true, data: updated })
})

// ── DELETE /api/admin/testimonials/:id ──────────────────
adminTestimonialRoutes.delete('/testimonials/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const existing = await c.env.DB.prepare(`SELECT id, avatar_r2_key FROM testimonials WHERE id = ?`).bind(id).first<{ id: number; avatar_r2_key: string }>()

  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Testimonial not found', status: 404 } }, 404)
  }

  // Delete avatar from R2 if exists
  if (existing.avatar_r2_key) {
    try { await c.env.MEDIA.delete(existing.avatar_r2_key) } catch {}
  }

  await c.env.DB.prepare(`DELETE FROM testimonials WHERE id = ?`).bind(id).run()

  return c.json({ success: true, data: { message: 'Testimonial deleted', id } })
})

// ── POST /api/admin/testimonials/:id/avatar ─────────────
adminTestimonialRoutes.post('/testimonials/:id/avatar', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id, avatar_r2_key FROM testimonials WHERE id = ?`).bind(id).first<{ id: number; avatar_r2_key: string }>()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Testimonial not found', status: 404 } }, 404)
  }

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file || !(file instanceof File)) {
    return c.json({ success: false, error: { code: 'NO_FILE', message: 'No file provided', status: 400 } }, 400)
  }

  // Validate type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return c.json({ success: false, error: { code: 'INVALID_TYPE', message: 'Only PNG, JPEG, WebP allowed', status: 400 } }, 400)
  }

  // Validate size (2MB max for avatars)
  if (file.size > 2 * 1024 * 1024) {
    return c.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: 'Avatar must be under 2MB', status: 400 } }, 400)
  }

  // Delete old avatar
  if (existing.avatar_r2_key) {
    try { await c.env.MEDIA.delete(existing.avatar_r2_key) } catch {}
  }

  // Upload new
  const ext = file.name.split('.').pop() || 'jpg'
  const r2Key = `media/avatars/${crypto.randomUUID()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  await c.env.MEDIA.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  })

  // Build public URL
  const r2Url = `https://pub-${c.env.MEDIA.toString()}.r2.dev/${r2Key}`

  await c.env.DB.prepare(
    `UPDATE testimonials SET avatar_r2_key = ?, avatar_r2_url = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(r2Key, r2Url, id).run()

  const updated = await c.env.DB.prepare(`SELECT * FROM testimonials WHERE id = ?`).bind(id).first<Testimonial>()
  return c.json({ success: true, data: updated })
})

// ── PATCH /api/admin/testimonials/reorder ────────────────
adminTestimonialRoutes.patch('/testimonials/reorder', async (c) => {
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
    c.env.DB.prepare(`UPDATE testimonials SET sort_order = ?, updated_at = datetime('now') WHERE id = ?`).bind(sort_order, id)
  )

  await c.env.DB.batch(stmts)
  return c.json({ success: true, data: { updated: body.items.length } })
})
