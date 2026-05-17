import { Hono } from 'hono'
import { Queue } from 'bullmq'
import { generateToken } from '../../lib/admin-auth.js'
import { adminAuth } from '../../middleware/adminAuth.js'
import { env } from '../../env.js'
import { schema, sql, eq, desc, and, gte } from '@risker/db'
import { db } from '../../lib/db.js'
import { redisConnection } from '../../lib/redis.js'
import { QUEUE_NAMES, createSuccessResponse, createErrorResponse } from '@risker/shared'

const admin = new Hono()

// Rate limiting: simple in-memory map (IP → { count, resetAt })
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

// POST /admin/auth
admin.post('/auth', async (c) => {
  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()

  // Rate limit: 5 attempts per minute
  const attempt = loginAttempts.get(ip)
  if (attempt && attempt.resetAt > now && attempt.count >= 5) {
    return c.json(createErrorResponse('TOO_MANY_REQUESTS', '잠시 후 다시 시도해주세요'), 429)
  }

  const body = await c.req.json<{ password?: string }>().catch(() => ({} as { password?: string }))
  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    const current = loginAttempts.get(ip) ?? { count: 0, resetAt: now + 60000 }
    loginAttempts.set(ip, { count: current.count + 1, resetAt: current.resetAt })
    return c.json(createErrorResponse('UNAUTHORIZED', '비밀번호가 틀렸습니다'), 401)
  }

  loginAttempts.delete(ip)
  const token = generateToken(env.ADMIN_PASSWORD)
  return c.json(createSuccessResponse({ token }))
})

// All routes below require auth
admin.use('/*', adminAuth)

// GET /admin/stats/summary
admin.get('/stats/summary', async (c) => {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [todayVisits] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.trafficLogs)
    .where(gte(schema.trafficLogs.createdAt, todayStart))

  const [todaySearches] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.trafficLogs)
    .where(and(
      gte(schema.trafficLogs.createdAt, todayStart),
      sql`${schema.trafficLogs.searchedPlayer} IS NOT NULL`,
    ))

  const [avgResponse] = await db
    .select({ avg: sql<number>`COALESCE(AVG(${schema.trafficLogs.durationMs}), 0)` })
    .from(schema.trafficLogs)
    .where(gte(schema.trafficLogs.createdAt, todayStart))

  const [total200] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(schema.trafficLogs)
    .where(and(
      gte(schema.trafficLogs.createdAt, todayStart),
      eq(schema.trafficLogs.statusCode, 200),
    ))

  const visitCount = Number(todayVisits?.count ?? 0)
  const hit200Count = Number(total200?.count ?? 0)
  const cacheHitRate = visitCount > 0 ? Math.round((hit200Count / visitCount) * 100) : 0

  return c.json(createSuccessResponse({
    todayVisits: visitCount,
    todaySearches: Number(todaySearches?.count ?? 0),
    cacheHitRate,
    avgResponseMs: Math.round(Number(avgResponse?.avg ?? 0)),
  }))
})

// GET /admin/stats/traffic
admin.get('/stats/traffic', async (c) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      hour: sql<string>`date_trunc('hour', ${schema.trafficLogs.createdAt})`,
      requestCount: sql<number>`COUNT(*)`,
      errorCount: sql<number>`COUNT(*) FILTER (WHERE ${schema.trafficLogs.statusCode} >= 400)`,
    })
    .from(schema.trafficLogs)
    .where(gte(schema.trafficLogs.createdAt, since))
    .groupBy(sql`date_trunc('hour', ${schema.trafficLogs.createdAt})`)
    .orderBy(sql`date_trunc('hour', ${schema.trafficLogs.createdAt})`)

  return c.json(createSuccessResponse(rows))
})

// GET /admin/stats/popular-players
admin.get('/stats/popular-players', async (c) => {
  const limit = Number(c.req.query('limit') ?? 10)
  const rows = await db
    .select({
      nickname: schema.trafficLogs.searchedPlayer,
      searchCount: sql<number>`COUNT(*)`,
    })
    .from(schema.trafficLogs)
    .where(sql`${schema.trafficLogs.searchedPlayer} IS NOT NULL`)
    .groupBy(schema.trafficLogs.searchedPlayer)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit)

  return c.json(createSuccessResponse(rows))
})

// GET /admin/logs
admin.get('/logs', async (c) => {
  const limit = Number(c.req.query('limit') ?? 50)
  const offset = Number(c.req.query('offset') ?? 0)
  const logs = await db
    .select()
    .from(schema.trafficLogs)
    .orderBy(desc(schema.trafficLogs.createdAt))
    .limit(limit)
    .offset(offset)

  return c.json(createSuccessResponse(logs))
})

// GET /admin/queue/status
admin.get('/queue/status', async (c) => {
  try {
    const queueNames = [QUEUE_NAMES.PLAYER_FETCH, QUEUE_NAMES.MATCH_COLLECTION, QUEUE_NAMES.ANALYSIS]
    let waiting = 0, active = 0, completed = 0, failed = 0
    for (const name of queueNames) {
      const q = new Queue(name, { connection: redisConnection })
      const counts = await q.getJobCounts('waiting', 'active', 'completed', 'failed')
      waiting += counts.waiting ?? 0
      active += counts.active ?? 0
      completed += counts.completed ?? 0
      failed += counts.failed ?? 0
      await q.close()
    }
    return c.json(createSuccessResponse({ waiting, active, completed, failed }))
  } catch {
    return c.json(createSuccessResponse({ waiting: 0, active: 0, completed: 0, failed: 0 }))
  }
})

// DELETE /admin/cache/:playerId
admin.delete('/cache/:playerId', async (c) => {
  const playerId = c.req.param('playerId')
  await db.delete(schema.playStyleAnalyses).where(eq(schema.playStyleAnalyses.playerId, playerId))
  return c.json(createSuccessResponse({ deleted: true }))
})

export { admin }
