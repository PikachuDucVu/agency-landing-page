import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import type { AppEnv, PublishRelease } from '../types'
import { buildPublishedMediaConfig, getCurrentPublishedRelease } from '../services/publish-config'

export const adminPublishRoutes = new Hono<AppEnv>()

adminPublishRoutes.use('*', requireAuth)

adminPublishRoutes.get('/publish/preview', async (c) => {
  const draft = await buildPublishedMediaConfig(c.env.DB)
  const current = await getCurrentPublishedRelease(c.env.DB)

  let currentConfig: unknown = null
  if (current) {
    currentConfig = JSON.parse(current.config_json)
  }

  return c.json({
    success: true,
    data: {
      draft: draft.config,
      summary: {
        ...draft.summary,
        hash: draft.hash,
        nextVersion: (current?.version ?? 0) + 1,
      },
      diff: {
        hasChanges: current ? current.config_hash !== draft.hash : true,
        currentVersion: current?.version ?? null,
      },
      current: currentConfig,
    },
  })
})

adminPublishRoutes.post('/publish', async (c) => {
  let body: { notes?: string } = {}

  try {
    body = await c.req.json()
  } catch {
    body = {}
  }

  const draft = await buildPublishedMediaConfig(c.env.DB)
  const current = await getCurrentPublishedRelease(c.env.DB)
  const nextVersion = (current?.version ?? 0) + 1
  const username = c.get('username') || 'admin'

  const insert = await c.env.DB.prepare(
    `INSERT INTO publish_releases (version, status, config_json, config_hash, notes, published_by)
     VALUES (?, 'published', ?, ?, ?, ?)`
  ).bind(
    nextVersion,
    JSON.stringify({ version: nextVersion, ...draft.config }),
    draft.hash,
    body.notes || '',
    username
  ).run()

  const releaseId = insert.meta.last_row_id

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO publish_state (key, value, updated_at)
       VALUES ('current_release_id', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind(String(releaseId)),
    c.env.DB.prepare(
      `INSERT INTO publish_state (key, value, updated_at)
       VALUES ('current_version', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind(String(nextVersion)),
  ])

  return c.json({
    success: true,
    data: {
      releaseId,
      version: nextVersion,
      hash: draft.hash,
      notes: body.notes || '',
      summary: draft.summary,
      config: { version: nextVersion, ...draft.config },
    },
  }, 201)
})

adminPublishRoutes.get('/publish/history', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, version, status, config_hash, notes, published_by, created_at
     FROM publish_releases ORDER BY version DESC, created_at DESC LIMIT 20`
  ).all<Pick<PublishRelease, 'id' | 'version' | 'status' | 'config_hash' | 'notes' | 'published_by' | 'created_at'>>()

  const current = await getCurrentPublishedRelease(c.env.DB)

  return c.json({
    success: true,
    data: results,
    meta: {
      total: results.length,
      currentReleaseId: current?.id ?? null,
      currentVersion: current?.version ?? null,
    },
  })
})

adminPublishRoutes.get('/publish/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid publish release id', status: 400 } }, 400)
  }

  const release = await c.env.DB.prepare(
    `SELECT id, version, status, config_json, config_hash, notes, published_by, created_at
     FROM publish_releases WHERE id = ?`
  ).bind(id).first<PublishRelease>()

  if (!release) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Publish release not found', status: 404 } }, 404)
  }

  return c.json({
    success: true,
    data: {
      ...release,
      config: JSON.parse(release.config_json),
    },
  })
})

adminPublishRoutes.post('/publish/:id/rollback', async (c) => {
  const id = parseInt(c.req.param('id'))

  if (Number.isNaN(id)) {
    return c.json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid publish release id', status: 400 } }, 400)
  }

  const release = await c.env.DB.prepare(
    `SELECT id, version FROM publish_releases WHERE id = ?`
  ).bind(id).first<{ id: number; version: number }>()

  if (!release) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Publish release not found', status: 404 } }, 404)
  }

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO publish_state (key, value, updated_at)
       VALUES ('current_release_id', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind(String(release.id)),
    c.env.DB.prepare(
      `INSERT INTO publish_state (key, value, updated_at)
       VALUES ('current_version', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind(String(release.version)),
  ])

  return c.json({
    success: true,
    data: {
      message: 'Rollback successful',
      releaseId: release.id,
      version: release.version,
    },
  })
})
