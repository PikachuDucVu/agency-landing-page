import type { Context, Next } from 'hono'
import { getSession } from '../routes/auth'

export async function requireAuth(c: Context, next: Next) {
  const session = getSession(c.req.header('cookie'))

  if (!session) {
    return c.json(
      { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'Login required', status: 401 } },
      401
    )
  }

  c.set('username', session.username)
  await next()
}
