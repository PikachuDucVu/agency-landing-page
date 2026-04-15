import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv, PaymentMethod, WalletAddress } from '../types'

export const adminPaymentRoutes = new Hono<AppEnv>()

adminPaymentRoutes.use('*', requireAuth)

type PaymentMethodWithWallets = PaymentMethod & { wallets: WalletAddress[] }

// ── GET /api/admin/payments ──────────────────────────────
// Trả về danh sách payment methods kèm wallets lồng nhau
adminPaymentRoutes.get('/payments', async (c) => {
  const { results: methods } = await c.env.DB.prepare(
    `SELECT * FROM payment_methods ORDER BY sort_order ASC`
  ).all<PaymentMethod>()

  const { results: wallets } = await c.env.DB.prepare(
    `SELECT * FROM wallet_addresses ORDER BY payment_method_id, sort_order ASC`
  ).all<WalletAddress>()

  // Group wallets by payment_method_id
  const walletMap = new Map<number, WalletAddress[]>()
  for (const w of wallets) {
    if (!walletMap.has(w.payment_method_id)) walletMap.set(w.payment_method_id, [])
    walletMap.get(w.payment_method_id)!.push(w)
  }

  const data: PaymentMethodWithWallets[] = methods.map(m => ({
    ...m,
    wallets: walletMap.get(m.id) ?? [],
  }))

  return c.json({ success: true, data, meta: { total: data.length } })
})

// ── GET /api/admin/payments/:id ──────────────────────────
adminPaymentRoutes.get('/payments/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const method = await c.env.DB.prepare(`SELECT * FROM payment_methods WHERE id = ?`).bind(id).first<PaymentMethod>()
  if (!method) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment method not found', status: 404 } }, 404)
  }

  const { results: wallets } = await c.env.DB.prepare(
    `SELECT * FROM wallet_addresses WHERE payment_method_id = ? ORDER BY sort_order ASC`
  ).bind(id).all<WalletAddress>()

  return c.json({ success: true, data: { ...method, wallets } })
})

// ── POST /api/admin/payments ─────────────────────────────
adminPaymentRoutes.post('/payments', async (c) => {
  let body: { name: string; label: string; icon_key: string; sort_order?: number }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const { name, label, icon_key, sort_order } = body

  if (!name?.trim() || !label?.trim() || !icon_key?.trim()) {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'name, label, icon_key are required', status: 400 } }, 400)
  }

  let order = sort_order
  if (order === undefined) {
    const maxOrder = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM payment_methods`
    ).first<{ next: number }>()
    order = maxOrder?.next ?? 1
  }

  const { meta } = await c.env.DB.prepare(
    `INSERT INTO payment_methods (name, label, icon_key, sort_order) VALUES (?, ?, ?, ?)`
  ).bind(name.trim(), label.trim(), icon_key.trim(), order).run()

  const newMethod = await c.env.DB.prepare(`SELECT * FROM payment_methods WHERE id = ?`).bind(meta.last_row_id).first<PaymentMethod>()
  return c.json({ success: true, data: { ...newMethod, wallets: [] } }, 201)
})

// ── PATCH /api/admin/payments/:id ───────────────────────
adminPaymentRoutes.patch('/payments/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  let body: Partial<{ name: string; label: string; icon_key: string; sort_order: number; is_visible: number }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM payment_methods WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment method not found', status: 404 } }, 404)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (body.name       !== undefined) { fields.push('name = ?');       values.push(body.name.trim()) }
  if (body.label      !== undefined) { fields.push('label = ?');      values.push(body.label.trim()) }
  if (body.icon_key   !== undefined) { fields.push('icon_key = ?');   values.push(body.icon_key.trim()) }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order) }
  if (body.is_visible !== undefined) { fields.push('is_visible = ?'); values.push(body.is_visible ? 1 : 0) }

  if (!fields.length) {
    return c.json({ success: false, error: { code: 'NO_FIELDS', message: 'No fields to update', status: 400 } }, 400)
  }

  fields.push('updated_at = datetime(\'now\')')
  values.push(id)

  await c.env.DB.prepare(`UPDATE payment_methods SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  const updated = await c.env.DB.prepare(`SELECT * FROM payment_methods WHERE id = ?`).bind(id).first<PaymentMethod>()
  const { results: wallets } = await c.env.DB.prepare(
    `SELECT * FROM wallet_addresses WHERE payment_method_id = ? ORDER BY sort_order ASC`
  ).bind(id).all<WalletAddress>()

  return c.json({ success: true, data: { ...updated, wallets } })
})

// ── DELETE /api/admin/payments/:id ──────────────────────
adminPaymentRoutes.delete('/payments/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(`SELECT id FROM payment_methods WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment method not found', status: 404 } }, 404)
  }

  // wallet_addresses sẽ bị xóa theo (ON DELETE CASCADE)
  await c.env.DB.prepare(`DELETE FROM payment_methods WHERE id = ?`).bind(id).run()
  return c.json({ success: true, data: { message: 'Payment method deleted', id } })
})

// ═══════════════════════════════════════════════════════
//  Wallet Address sub-routes
// ═══════════════════════════════════════════════════════

// ── POST /api/admin/payments/:id/wallets ────────────────
adminPaymentRoutes.post('/payments/:id/wallets', async (c) => {
  const methodId = parseInt(c.req.param('id'))
  if (Number.isNaN(methodId)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid payment method id', status: 400 } }, 400)
  }

  const method = await c.env.DB.prepare(`SELECT id FROM payment_methods WHERE id = ?`).bind(methodId).first()
  if (!method) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment method not found', status: 404 } }, 404)
  }

  let body: { network: string; address: string; sort_order?: number }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const { network, address, sort_order } = body

  if (!network?.trim() || !address?.trim()) {
    return c.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'network and address are required', status: 400 } }, 400)
  }

  let order = sort_order
  if (order === undefined) {
    const maxOrder = await c.env.DB.prepare(
      `SELECT COALESCE(MAX(sort_order), 0) + 1 as next FROM wallet_addresses WHERE payment_method_id = ?`
    ).bind(methodId).first<{ next: number }>()
    order = maxOrder?.next ?? 1
  }

  const { meta } = await c.env.DB.prepare(
    `INSERT INTO wallet_addresses (payment_method_id, network, address, sort_order) VALUES (?, ?, ?, ?)`
  ).bind(methodId, network.trim(), address.trim(), order).run()

  const newWallet = await c.env.DB.prepare(`SELECT * FROM wallet_addresses WHERE id = ?`).bind(meta.last_row_id).first<WalletAddress>()
  return c.json({ success: true, data: newWallet }, 201)
})

// ── PATCH /api/admin/payments/:id/wallets/:walletId ─────
adminPaymentRoutes.patch('/payments/:id/wallets/:walletId', async (c) => {
  const methodId  = parseInt(c.req.param('id'))
  const walletId  = parseInt(c.req.param('walletId'))

  if (Number.isNaN(methodId) || Number.isNaN(walletId)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  let body: Partial<{ network: string; address: string; sort_order: number; is_visible: number }>

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_JSON', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM wallet_addresses WHERE id = ? AND payment_method_id = ?`
  ).bind(walletId, methodId).first()

  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Wallet address not found', status: 404 } }, 404)
  }

  const fields: string[] = []
  const values: unknown[] = []

  if (body.network    !== undefined) { fields.push('network = ?');    values.push(body.network.trim()) }
  if (body.address    !== undefined) { fields.push('address = ?');    values.push(body.address.trim()) }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order) }
  if (body.is_visible !== undefined) { fields.push('is_visible = ?'); values.push(body.is_visible ? 1 : 0) }

  if (!fields.length) {
    return c.json({ success: false, error: { code: 'NO_FIELDS', message: 'No fields to update', status: 400 } }, 400)
  }

  values.push(walletId)
  await c.env.DB.prepare(`UPDATE wallet_addresses SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  const updated = await c.env.DB.prepare(`SELECT * FROM wallet_addresses WHERE id = ?`).bind(walletId).first<WalletAddress>()

  return c.json({ success: true, data: updated })
})

// ── DELETE /api/admin/payments/:id/wallets/:walletId ────
adminPaymentRoutes.delete('/payments/:id/wallets/:walletId', async (c) => {
  const methodId = parseInt(c.req.param('id'))
  const walletId = parseInt(c.req.param('walletId'))

  if (Number.isNaN(methodId) || Number.isNaN(walletId)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid id', status: 400 } }, 400)
  }

  const existing = await c.env.DB.prepare(
    `SELECT id FROM wallet_addresses WHERE id = ? AND payment_method_id = ?`
  ).bind(walletId, methodId).first()

  if (!existing) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Wallet address not found', status: 404 } }, 404)
  }

  await c.env.DB.prepare(`DELETE FROM wallet_addresses WHERE id = ?`).bind(walletId).run()
  return c.json({ success: true, data: { message: 'Wallet address deleted', id: walletId } })
})
