import { Hono } from 'hono'
import { getAdminByUsername } from '../services/db'

const auth = new Hono()

// In-memory session store (simple, single-server)
const sessions = new Map<string, { username: string; expiresAt: number }>()

const SESSION_MAX_AGE = 24 * 60 * 60 * 1000 // 24 hours

function generateSessionId(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function getSessionFromCookie(cookie: string | undefined): string | null {
  if (!cookie) return null
  const match = cookie.match(/admin_session=([a-f0-9]+)/)
  return match ? match[1] : null
}

export function getSession(cookie: string | undefined) {
  const sessionId = getSessionFromCookie(cookie)
  if (!sessionId) return null
  const session = sessions.get(sessionId)
  if (!session) return null
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId)
    return null
  }
  return session
}

// POST /auth/login
auth.post('/login', async (c) => {
  let body: { username?: string; password?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ success: false, error: { code: 'INVALID_BODY', message: 'Invalid JSON', status: 400 } }, 400)
  }

  const { username, password } = body

  if (!username || !password) {
    return c.json(
      { success: false, error: { code: 'MISSING_FIELDS', message: 'Username and password required', status: 400 } },
      400
    )
  }

  const admin = getAdminByUsername(username)

  if (!admin) {
    return c.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password', status: 401 } },
      401
    )
  }

  const valid = await Bun.password.verify(password, admin.password_hash)

  if (!valid) {
    return c.json(
      { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid username or password', status: 401 } },
      401
    )
  }

  const sessionId = generateSessionId()
  sessions.set(sessionId, {
    username: admin.username,
    expiresAt: Date.now() + SESSION_MAX_AGE,
  })

  c.header(
    'Set-Cookie',
    `admin_session=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE / 1000}`
  )

  return c.json({ success: true, data: { username: admin.username } })
})

// POST /auth/logout
auth.post('/logout', (c) => {
  const sessionId = getSessionFromCookie(c.req.header('cookie'))
  if (sessionId) sessions.delete(sessionId)

  c.header('Set-Cookie', 'admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0')
  return c.json({ success: true })
})

// GET /auth/me
auth.get('/me', (c) => {
  const session = getSession(c.req.header('cookie'))

  if (!session) {
    return c.json(
      { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'Not logged in', status: 401 } },
      401
    )
  }

  return c.json({ success: true, data: { username: session.username } })
})

export default auth
