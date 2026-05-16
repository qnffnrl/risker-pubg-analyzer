import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env.js'
import { health } from './routes/health.js'
import { v1 } from './routes/v1/index.js'

const app = new Hono()

// Global middleware
app.use('*', cors())
app.use('*', logger())

// Routes
app.route('/health', health)
app.route('/api/v1', v1)

// 404 fallback
app.notFound((c) => {
  return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json(
    { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
    500,
  )
})

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] Server running on http://localhost:${info.port}`)
  console.log(`[api] Health: http://localhost:${info.port}/health`)
})
