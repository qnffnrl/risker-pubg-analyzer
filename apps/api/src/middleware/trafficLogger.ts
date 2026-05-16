import type { Context, Next } from 'hono'
import { db } from '../lib/db.js'
import { schema } from '@risker/db'

function maskIp(ip: string): string {
  const v4 = ip.match(/^(\d+\.\d+\.\d+)\.\d+$/)
  if (v4) return `${v4[1]}.xxx`
  const v6 = ip.lastIndexOf(':')
  if (v6 > 0) return `${ip.slice(0, v6)}:xxxx`
  return ip
}

function getClientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0]!.trim() : (c.req.header('x-real-ip') ?? 'unknown')
  return maskIp(ip)
}

export async function trafficLogger(c: Context, next: Next) {
  const start = Date.now()
  await next()
  const durationMs = Date.now() - start

  // Async fire-and-forget — do not await so response is not delayed
  setImmediate(() => {
    db.insert(schema.trafficLogs)
      .values({
        path: new URL(c.req.url).pathname,
        method: c.req.method,
        statusCode: c.res.status,
        ipAddress: getClientIp(c),
        userAgent: c.req.header('user-agent') ?? null,
        durationMs,
        searchedPlayer: c.get('searchedPlayer') ?? null,
      })
      .catch(() => {
        // best-effort logging; ignore errors
      })
  })
}
