import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Subscriber = {
  email: string
  createdAt: string
  origin: string | null
  userAgent: string | null
}

const app = new Hono()
const port = 8000
const dataFile = './subscribers.json'

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'https://romanagency.net',
  'https://cd8fa9af.agency-landing-page-7zg.pages.dev',
])

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return undefined
      return allowedOrigins.has(origin) ? origin : undefined
    },
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
)

app.get('/', (c) => {
  return c.json({ message: 'Hono backend is running' })
})

app.get('/api/health', (c) => {
  return c.json({ ok: true, service: 'backend' })
})

app.post('/api/subscribe', async (c) => {
  let body: { email?: string }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ ok: false, error: 'Invalid JSON body' }, 400)
  }

  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return c.json({ ok: false, error: 'Email is required' }, 400)
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  if (!isValidEmail) {
    return c.json({ ok: false, error: 'Invalid email' }, 400)
  }

  let subscribers: Subscriber[] = []

  try {
    const file = Bun.file(dataFile)
    if (await file.exists()) {
      subscribers = await file.json()
    }
  } catch {
    subscribers = []
  }

  const alreadyExists = subscribers.some((subscriber) => subscriber.email === email)

  if (!alreadyExists) {
    subscribers.push({
      email,
      createdAt: new Date().toISOString(),
      origin: c.req.header('origin') ?? null,
      userAgent: c.req.header('user-agent') ?? null,
    })

    await Bun.write(dataFile, JSON.stringify(subscribers, null, 2))
  }

  return c.json({
    ok: true,
    message: alreadyExists ? 'Email already subscribed' : 'Subscribed successfully',
  })
})

console.log(`Backend running at http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
