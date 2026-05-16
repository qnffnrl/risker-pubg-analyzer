import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, schema } from '@risker/db'
import { createSuccessResponse, createErrorResponse } from '@risker/shared'
import { db } from '../../lib/db.js'

const compare = new Hono()

const CompareQuerySchema = z.object({
  players: z.string().regex(/^[^,]+,[^,]+$/, 'Provide exactly 2 comma-separated pubgIds'),
})

// GET /api/v1/compare?players=pubgId1,pubgId2
compare.get('/', zValidator('query', CompareQuerySchema), async (c) => {
  const { players: rawIds } = c.req.valid('query')
  const [id1, id2] = rawIds.split(',').map((s) => s.trim())

  const results = await Promise.all(
    [id1!, id2!].map(async (pubgId) => {
      const player = await db.query.players.findFirst({
        where: eq(schema.players.pubgId, pubgId),
      })
      if (!player) return null

      const analysis = await db.query.playStyleAnalyses.findFirst({
        where: eq(schema.playStyleAnalyses.playerId, player.id),
        orderBy: [desc(schema.playStyleAnalyses.analyzedAt)],
      })

      return { player, analysis: analysis ?? null }
    }),
  )

  const notFound = [id1, id2].filter((_, i) => !results[i])
  if (notFound.length > 0) {
    return c.json(
      createErrorResponse('PLAYER_NOT_FOUND', `Players not found: ${notFound.join(', ')}`),
      404,
    )
  }

  return c.json(createSuccessResponse({ players: results }))
})

export { compare }
