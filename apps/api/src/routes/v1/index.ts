import { Hono } from 'hono'

const v1 = new Hono()

// Placeholder — individual route modules will be mounted here in subsequent tasks
v1.get('/', (c) => {
  return c.json({ version: 'v1', message: 'PUBG Analyzer API' })
})

export { v1 }
