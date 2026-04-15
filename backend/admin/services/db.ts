import { Database } from 'bun:sqlite'
import { join } from 'path'

const DB_PATH = join(import.meta.dir, '..', 'data', 'admin.db')

let db: Database

export function getDb(): Database {
  if (!db) {
    db = new Database(DB_PATH, { create: true })
    db.run('PRAGMA journal_mode = WAL')
    db.run('PRAGMA foreign_keys = ON')
    initSchema()
  }
  return db
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS media_items (
      id            TEXT PRIMARY KEY,
      section       TEXT NOT NULL,
      slot          TEXT NOT NULL,
      file_name     TEXT NOT NULL,
      r2_key        TEXT NOT NULL,
      r2_url        TEXT NOT NULL,
      mime_type     TEXT NOT NULL,
      file_size     INTEGER NOT NULL,
      width         INTEGER,
      height        INTEGER,
      alt_text      TEXT DEFAULT '',
      caption       TEXT DEFAULT '',
      caption_sub   TEXT DEFAULT '',
      sort_order    INTEGER DEFAULT 0,
      is_visible    INTEGER DEFAULT 1,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_media_section ON media_items(section)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_media_visible ON media_items(is_visible)`)

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS publish_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      status     TEXT NOT NULL DEFAULT 'success',
      media_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)
}

// ── Media queries ──

export function getAllMedia(section?: string) {
  const d = getDb()
  if (section) {
    return d.query('SELECT * FROM media_items WHERE section = ? ORDER BY sort_order, created_at').all(section)
  }
  return d.query('SELECT * FROM media_items ORDER BY section, sort_order, created_at').all()
}

export function getMediaById(id: string) {
  return getDb().query('SELECT * FROM media_items WHERE id = ?').get(id)
}

export function insertMedia(item: {
  id: string
  section: string
  slot: string
  file_name: string
  r2_key: string
  r2_url: string
  mime_type: string
  file_size: number
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  caption_sub?: string
  sort_order?: number
}) {
  const d = getDb()
  return d.run(
    `INSERT INTO media_items (id, section, slot, file_name, r2_key, r2_url, mime_type, file_size, width, height, alt_text, caption, caption_sub, sort_order)
     VALUES ($id, $section, $slot, $file_name, $r2_key, $r2_url, $mime_type, $file_size, $width, $height, $alt_text, $caption, $caption_sub, $sort_order)`,
    {
      $id: item.id,
      $section: item.section,
      $slot: item.slot,
      $file_name: item.file_name,
      $r2_key: item.r2_key,
      $r2_url: item.r2_url,
      $mime_type: item.mime_type,
      $file_size: item.file_size,
      $width: item.width ?? null,
      $height: item.height ?? null,
      $alt_text: item.alt_text ?? '',
      $caption: item.caption ?? '',
      $caption_sub: item.caption_sub ?? '',
      $sort_order: item.sort_order ?? 0,
    }
  )
}

export function updateMedia(
  id: string,
  updates: Partial<{
    alt_text: string
    caption: string
    caption_sub: string
    sort_order: number
    is_visible: number
    r2_key: string
    r2_url: string
    file_name: string
    mime_type: string
    file_size: number
  }>
) {
  const d = getDb()
  const fields: string[] = []
  const values: Record<string, unknown> = { $id: id }

  for (const [key, val] of Object.entries(updates)) {
    if (val !== undefined) {
      fields.push(`${key} = $${key}`)
      values[`$${key}`] = val
    }
  }

  if (fields.length === 0) return

  fields.push("updated_at = datetime('now')")
  d.run(`UPDATE media_items SET ${fields.join(', ')} WHERE id = $id`, values)
}

export function deleteMedia(id: string) {
  return getDb().run('DELETE FROM media_items WHERE id = ?', id)
}

export function reorderMedia(items: { id: string; sort_order: number }[]) {
  const d = getDb()
  const stmt = d.prepare("UPDATE media_items SET sort_order = $order, updated_at = datetime('now') WHERE id = $id")
  const tx = d.transaction(() => {
    for (const item of items) {
      stmt.run({ $order: item.sort_order, $id: item.id })
    }
  })
  tx()
}

// ── Admin user queries ──

export function getAdminByUsername(username: string) {
  return getDb().query('SELECT * FROM admin_users WHERE username = ?').get(username) as
    | { id: number; username: string; password_hash: string; created_at: string }
    | null
}

export function insertAdmin(username: string, passwordHash: string) {
  return getDb().run('INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)', username, passwordHash)
}

// ── Publish history ──

export function insertPublish(mediaCount: number) {
  return getDb().run('INSERT INTO publish_history (media_count) VALUES (?)', mediaCount)
}

export function getPublishHistory(limit = 10) {
  return getDb().query('SELECT * FROM publish_history ORDER BY created_at DESC LIMIT ?').all(limit)
}
