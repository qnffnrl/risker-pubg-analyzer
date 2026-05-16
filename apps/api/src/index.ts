import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { env } from './env.js'
import { corsMiddleware } from './middleware/cors.js'
import { trafficLogger } from './middleware/trafficLogger.js'
import { health } from './routes/health.js'
import { v1 } from './routes/v1/index.js'

const app = new Hono()

app.use('*', corsMiddleware)
app.use('*', logger())
app.use('*', trafficLogger)

app.route('/health', health)
app.route('/api/v1', v1)

app.notFound((c) => {
  return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404)
})

app.onError((err, c) => {
  console.error(err)
  return c.json(
    { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' } },
    500,
  )
})

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] Server running on http://localhost:${info.port}`)
})
