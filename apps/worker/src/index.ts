import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { env } from './env.js'
import { createBullBoardRouter } from './bull-board.js'

// Import workers to start them
import './workers/player-fetch.worker.js'
import './workers/match-collection.worker.js'
import './workers/analysis.worker.js'

const app = new Hono()
app.use('*', logger())

// Mount Bull Board UI at /admin/queues
const bullBoardRouter = createBullBoardRouter()
app.route('/admin/queues', bullBoardRouter)

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

serve({ fetch: app.fetch, port: env.BULL_BOARD_PORT }, (info) => {
  console.log(`[worker] Bull Board running on http://localhost:${info.port}/admin/queues`)
})

console.log('[worker] Workers started')
console.log(`[worker] Environment: ${env.NODE_ENV}`)
