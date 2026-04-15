import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv, MediaItem } from '../types'
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../types'

function getPublicMediaBase(c: any): string {
  const url = new URL(c.req.url)
  return `${url.origin}/api/public-media`
}

export const adminMediaRoutes = new Hono<AppEnv>()

// All admin routes require auth
adminMediaRoutes.use('*', requireAuth)

// ── GET /api/admin/media ─────────────────────────────────
adminMediaRoutes.get('/media', async (c) => {
  const section = c.req.query('section')

  let query = `SELECT * FROM media_items`
  const bindings: string[] = []

  if (section) {
    query += ` WHERE section = ?`
    bindings.push(section)
  }

  query += ` ORDER BY section, sort_order ASC`

  const { results } = bindings.length
    ? await c.env.DB.prepare(query).bind(...bindings).all<MediaItem>()
    : await c.env.DB.prepare(query).all<MediaItem>()

  return c.json({ success: true, data: results, meta: { total: results.length } })
})

// ── GET /api/admin/media/:id ─────────────────────────────
adminMediaRoutes.get('/media/:id', async (c) => {
  const id = c.req.param('id')
  const item = await c.env.DB.prepare(`SELECT * FROM media_items WHERE id = ?`).bind(id).first<MediaItem>()

  if (!item) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Media item not found', status: 404 } }, 404)
  }

  return c.json({ success: true, data: item })
})

// ── POST /api/admin/media/upload ─────────────────────────
adminMediaRoutes.post('/media/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const section = formData.get('section') as string | null
  const slot = formData.get('slot') as string | null
  const alt_text = (formData.get('alt_text') as string) || ''
  const caption = (formData.get('caption') as string) || ''
  const caption_sub = (formData.get('caption_sub') as string) || ''

  if (!file || !section) {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'file and section are required', status: 400 } }, 400)
  }

  // Validate file type
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return c.json({
      success: false,
      error: { code: 'INVALID_TYPE', message: `File type ${file.type} not allowed`, status: 400 },
    }, 400)
  }

  // Validate file size
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return c.json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: `Max ${isVideo ? '50' : '5'}MB allowed`, status: 400 },
    }, 400)
  }

  // Generate unique R2 key
  const ext = file.name.split('.').pop() || 'bin'
  const uuid = crypto.randomUUID()
  const r2Key = `media/${section}/${uuid}.${ext}`
  const id = slot ? `${section}-${slot}` : `${section}-${uuid.slice(0, 8)}`

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer()
  await c.env.MEDIA.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  })

  // Get public URL served by Worker
  const r2Url = `${getPublicMediaBase(c)}/${section}/${uuid}.${ext}`

  // Get existing sort_order max
  const maxOrder = await c.env.DB.prepare(
    `SELECT COALESCE(MAX(sort_order), -1) as m FROM media_items WHERE section = ?`
  ).bind(section).first<{ m: number }>()

  // Save metadata to D1
  await c.env.DB.prepare(`
    INSERT INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, alt_text, caption, caption_sub, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      file_name = excluded.file_name,
      r2_key = excluded.r2_key,
      r2_url = excluded.r2_url,
      mime_type = excluded.mime_type,
      file_size = excluded.file_size,
      alt_text = excluded.alt_text,
      caption = excluded.caption,
      caption_sub = excluded.caption_sub,
      updated_at = datetime('now')
  `).bind(
    id, section, slot || uuid.slice(0, 8), file.name,
    r2Key, r2Url, file.type, file.size,
    alt_text, caption, caption_sub,
    (maxOrder?.m ?? -1) + 1
  ).run()

  const item = await c.env.DB.prepare(`SELECT * FROM media_items WHERE id = ?`).bind(id).first<MediaItem>()

  return c.json({ success: true, data: item }, 201)
})

// ── PATCH /api/admin/media/:id ───────────────────────────
adminMediaRoutes.patch('/media/:id', async (c) => {
  const id = c.req.param('id')
  let body: Partial<Pick<MediaItem, 'alt_text' | 'caption' | 'caption_sub' | 'is_visible' | 'sort_order'>>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM media_items WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Media item not found', status: 404 } }, 404)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (body.alt_text !== undefined) { fields.push('alt_text = ?'); values.push(body.alt_text) }
  if (body.caption !== undefined) { fields.push('caption = ?'); values.push(body.caption) }
  if (body.caption_sub !== undefined) { fields.push('caption_sub = ?'); values.push(body.caption_sub) }
  if (body.is_visible !== undefined) { fields.push('is_visible = ?'); values.push(body.is_visible ? 1 : 0) }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order) }

  if (!fields.length) {
    return c.json({ success: false, error: { code: 'NO_FIELDS', message: 'No fields to update', status: 400 } }, 400)
  }

  fields.push('updated_at = datetime(\'now\')')
  values.push(id)

  await c.env.DB.prepare(
    `UPDATE media_items SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run()

  const item = await c.env.DB.prepare(`SELECT * FROM media_items WHERE id = ?`).bind(id).first<MediaItem>()

  return c.json({ success: true, data: item })
})

// ── DELETE /api/admin/media/:id ──────────────────────────
adminMediaRoutes.delete('/media/:id', async (c) => {
  const id = c.req.param('id')
  const item = await c.env.DB.prepare(`SELECT r2_key FROM media_items WHERE id = ?`).bind(id).first<{ r2_key: string }>()

  if (!item) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Media item not found', status: 404 } }, 404)
  }

  // Delete from R2
  await c.env.MEDIA.delete(item.r2_key)

  // Delete from D1
  await c.env.DB.prepare(`DELETE FROM media_items WHERE id = ?`).bind(id).run()

  return c.json({ success: true, data: { message: 'Media item deleted', id } })
})

// ── POST /api/admin/media/:id/replace ───────────────────
adminMediaRoutes.post('/media/:id/replace', async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare(
    `SELECT id, section, slot, r2_key, alt_text, caption, caption_sub FROM media_items WHERE id = ?`
  ).bind(id).first<{
    id: string
    section: string
    slot: string
    r2_key: string
    alt_text: string
    caption: string
    caption_sub: string
  }>()

  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Media item not found', status: 404 } }, 404)
  }

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return c.json({ success: false, error: { code: 'MISSING_FILE', message: 'file is required', status: 400 } }, 400)
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

  if (!isImage && !isVideo) {
    return c.json({ success: false, error: { code: 'INVALID_TYPE', message: `File type ${file.type} not allowed`, status: 400 } }, 400)
  }

  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return c.json({ success: false, error: { code: 'FILE_TOO_LARGE', message: `Max ${isVideo ? '50' : '5'}MB allowed`, status: 400 } }, 400)
  }

  const ext = file.name.split('.').pop() || 'bin'
  const uuid = crypto.randomUUID()
  const r2Key = `media/${existing.section}/${uuid}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  await c.env.MEDIA.put(r2Key, arrayBuffer, {
    httpMetadata: { contentType: file.type },
  })

  await c.env.MEDIA.delete(existing.r2_key)

  const r2Url = `${getPublicMediaBase(c)}/${existing.section}/${uuid}.${ext}`

  await c.env.DB.prepare(
    `UPDATE media_items
     SET file_name = ?, r2_key = ?, r2_url = ?, mime_type = ?, file_size = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).bind(file.name, r2Key, r2Url, file.type, file.size, id).run()

  const updated = await c.env.DB.prepare(`SELECT * FROM media_items WHERE id = ?`).bind(id).first<MediaItem>()

  return c.json({ success: true, data: updated })
})

// ── PATCH /api/admin/media/reorder ──────────────────────
adminMediaRoutes.patch('/media-reorder', async (c) => {
  let body: { items: Array<{ id: string; sort_order: number }> }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  if (!Array.isArray(body.items)) {
    return c.json({ success: false, error: { code: 'INVALID_BODY', message: 'items must be an array', status: 400 } }, 400)
  }

  const stmts = body.items.map(({ id, sort_order }) =>
    c.env.DB.prepare(`UPDATE media_items SET sort_order = ? WHERE id = ?`).bind(sort_order, id)
  )

  await c.env.DB.batch(stmts)

  return c.json({ success: true, data: { message: 'Reordered successfully' } })
})
