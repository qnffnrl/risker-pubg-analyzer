import { Hono } from 'hono'
import { createSuccessResponse } from '@risker/shared'

const health = new Hono()

health.get('/', (c) => {
  return c.json(
    createSuccessResponse({
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    }),
  )
})

export { health }
