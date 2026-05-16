import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js'
import { HonoAdapter } from '@bull-board/hono'
import { Hono } from 'hono'
import { allQueues } from './queues/index.js'

export function createBullBoardRouter(): Hono {
  const serverAdapter = new HonoAdapter(new Hono())

  createBullBoard({
    queues: allQueues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  })

  serverAdapter.setBasePath('/admin/queues')

  return serverAdapter.registerPlugin()
}
