import type { Context, Next } from 'hono'
import { verifyToken } from '../lib/admin-auth.js'
import { env } from '../env.js'

export async function adminAuth(c: Context, next: Next): Promise<Response | void> {
  const auth = c.req.header('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || !verifyToken(token, env.ADMIN_PASSWORD)) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, 401)
  }
  await next()
}
