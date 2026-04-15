import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv, FAQ } from '../types'

export const adminFaqRoutes = new Hono<AppEnv>()

adminFaqRoutes.use('*', requireAuth)

// ── GET /api/admin/faqs ──────────────────────────────────
adminFaqRoutes.get('/faqs', async (c) => {
  const lang = c.req.query('lang') // optional filter
  let query = `SELECT * FROM faqs`
  const bindings: (string | number)[] = []

  if (lang) {
    query += ` WHERE lang = ?`
    bindings.push(lang)
  }

  query += ` ORDER BY lang, sort_order ASC`

  const { results } = bindings.length
    ? await c.env.DB.prepare(query).bind(...bindings).all<FAQ>()
    : await c.env.DB.prepare(query).all<FAQ>()

  return c.json({ success: true, data: results, meta: { total: results.length } })
})

// ── GET /api/admin/faqs/:id ──────────────────────────────
adminFaqRoutes.get('/faqs/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const faq = await c.env.DB.prepare(`SELECT * FROM faqs WHERE id = ?`).bind(id).first<FAQ>()

  if (!faq) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'FAQ not found', status: 404 } }, 404)
  }

  return c.json({ success: true, data: faq })
})

// ── POST /api/admin/faqs ─────────────────────────────────
adminFaqRoutes.post('/faqs', async (c) => {
  let body: { question: string; answer: string; lang?: string; sort_order?: number }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const { question, answer, lang = 'en', sort_order } = body

  if (!question?.trim() || !answer?.trim()) {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'question and answer are required', status: 400 } }, 400)
  }

  // Get next sort_order
  let order = sort_order
  if (order === undefined) {
    const maxOrder = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM faqs WHERE lang = ?`
    ).bind(lang).first<{ next: number }>()
    order = maxOrder?.next ?? 1
  }

  const { meta } = await c.env.DB.prepare(
    `INSERT INTO faqs (question, answer, lang, sort_order) VALUES (?, ?, ?, ?)`
  ).bind(question.trim(), answer.trim(), lang, order).run()

  const newFaq = await c.env.DB.prepare(`SELECT * FROM faqs WHERE id = ?`).bind(meta.last_row_id).first<FAQ>()

  return c.json({ success: true, data: newFaq }, 201)
})

// ── PATCH /api/admin/faqs/:id ────────────────────────────
adminFaqRoutes.patch('/faqs/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  let body: Partial<{ question: string; answer: string; sort_order: number; is_active: number }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM faqs WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'FAQ not found', status: 404 } }, 404)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (body.question !== undefined) { fields.push('question = ?'); values.push(body.question.trim()) }
  if (body.answer !== undefined) { fields.push('answer = ?'); values.push(body.answer.trim()) }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order) }
  if (body.is_active !== undefined) { fields.push('is_active = ?'); values.push(body.is_active ? 1 : 0) }

  if (!fields.length) {
    return c.json({ success: false, error: { code: 'NO_FIELDS', message: 'No fields to update', status: 400 } }, 400)
  }

  fields.push('updated_at = datetime(\'now\')')
  values.push(id)

  await c.env.DB.prepare(`UPDATE faqs SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()

  const updated = await c.env.DB.prepare(`SELECT * FROM faqs WHERE id = ?`).bind(id).first<FAQ>()

  return c.json({ success: true, data: updated })
})

// ── DELETE /api/admin/faqs/:id ───────────────────────────
adminFaqRoutes.delete('/faqs/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const existing = await c.env.DB.prepare(`SELECT id FROM faqs WHERE id = ?`).bind(id).first()

  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'FAQ not found', status: 404 } }, 404)
  }

  await c.env.DB.prepare(`DELETE FROM faqs WHERE id = ?`).bind(id).run()

  return c.json({ success: true, data: { message: 'FAQ deleted', id } })
})

// ── PATCH /api/admin/faqs-reorder ───────────────────────
adminFaqRoutes.patch('/faqs-reorder', async (c) => {
  let body: { items: Array<{ id: number; sort_order: number }> }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const stmts = body.items.map(({ id, sort_order }) =>
    c.env.DB.prepare(`UPDATE faqs SET sort_order = ? WHERE id = ?`).bind(sort_order, id)
  )

  await c.env.DB.batch(stmts)

  return c.json({ success: true, data: { message: 'FAQs reordered' } })
})
