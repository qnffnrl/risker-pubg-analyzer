import IORedis from 'ioredis'
import { env } from './env.js'

export const redisConnection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

redisConnection.on('error', (err) => {
  console.error('[redis] Connection error:', err)
})

redisConnection.on('connect', () => {
  console.log('[redis] Connected')
})
