import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { HonoAdapter } from '@bull-board/hono'
import { serveStatic } from '@hono/node-server/serve-static'
import type { Hono } from 'hono'
import { allQueues } from './queues/index.js'

export function createBullBoardRouter(): Hono {
  const serverAdapter = new HonoAdapter(serveStatic)

  createBullBoard({
    queues: allQueues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  })

  serverAdapter.setBasePath('/admin/queues')

  return serverAdapter.registerPlugin()
}
