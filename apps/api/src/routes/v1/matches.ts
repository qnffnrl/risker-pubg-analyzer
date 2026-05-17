import { Hono } from 'hono'
import { eq, schema } from '@risker/db'
import { PUBG_API_BASE } from '@risker/shared'
import { createSuccessResponse, createErrorResponse } from '@risker/shared'
import { db } from '../../lib/db.js'

const matchesRouter = new Hono()

async function fetchMatchFromPubg(shard: string, matchId: string): Promise<{ included: unknown[] }> {
  const apiKey = process.env['PUBG_API_KEY']
  if (!apiKey) throw new Error('PUBG_API_KEY not set')
  const res = await fetch(`${PUBG_API_BASE}/shards/${shard}/matches/${encodeURIComponent(matchId)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/vnd.api+json' },
  })
  if (!res.ok) throw new Error(`PUBG API ${res.status}`)
  const json = await res.json() as { included: unknown[] }
  return json
}

matchesRouter.get('/:matchId', async (c) => {
  const { matchId } = c.req.param()

  const matchRow = await db.query.matches.findFirst({
    where: eq(schema.matches.pubgMatchId, matchId),
  })

  if (!matchRow) {
    return c.json(createErrorResponse('MATCH_NOT_FOUND', 'Match not found'), 404)
  }

  let included: unknown[]

  if (matchRow.includedData) {
    included = matchRow.includedData as unknown[]
  } else {
    const rawData = matchRow.rawData as Record<string, unknown> | null
    const attrs = rawData?.['attributes'] as Record<string, unknown> | undefined
    const shard = (attrs?.['shardId'] as string | undefined) ?? 'steam'
    try {
      const matchResponse = await fetchMatchFromPubg(shard, matchId)
      included = matchResponse.included
      await db
        .update(schema.matches)
        .set({ includedData: included as Record<string, unknown>[] })
        .where(eq(schema.matches.pubgMatchId, matchId))
    } catch {
      // PUBG API 조회 실패 (14일 이상 지난 매치 등) — 기본 정보만 반환
      return c.json(
        createSuccessResponse({
          match: {
            pubgMatchId: matchRow.pubgMatchId,
            mapName: matchRow.mapName,
            mode: matchRow.mode,
            playedAt: matchRow.playedAt,
            durationSec: matchRow.durationSec,
            totalPlayers: matchRow.totalPlayers,
          },
          participants: [],
          rosters: [],
          telemetryUrl: null,
          dataUnavailable: true,
        }),
      )
    }
  }

  type RawParticipant = { type: string; id: string; attributes: { stats: Record<string, unknown> } }
  type RawRoster = {
    type: string; id: string
    attributes: { stats: { rank: number; teamId: number }; won: string }
    relationships: { participants: { data: Array<{ id: string }> } }
  }
  type RawAsset = { type: string; attributes: { URL?: string } }

  const arr = included as Array<RawParticipant | RawRoster | RawAsset>

  const participants = (arr as RawParticipant[])
    .filter((r) => r.type === 'participant')
    .map((r) => ({ id: r.id, stats: r.attributes.stats }))

  const rosters = (arr as RawRoster[])
    .filter((r) => r.type === 'roster')
    .map((r) => ({
      id: r.id,
      rank: r.attributes.stats.rank,
      teamId: r.attributes.stats.teamId,
      won: r.attributes.won === 'true',
      participantIds: r.relationships.participants.data.map((p) => p.id),
    }))
    .sort((a, b) => a.rank - b.rank)

  const asset = (arr as RawAsset[]).find((r) => r.type === 'asset')
  const telemetryUrl = asset?.attributes?.URL ?? null

  return c.json(
    createSuccessResponse({
      match: {
        pubgMatchId: matchRow.pubgMatchId,
        mapName: matchRow.mapName,
        mode: matchRow.mode,
        playedAt: matchRow.playedAt,
        durationSec: matchRow.durationSec,
        totalPlayers: matchRow.totalPlayers,
      },
      participants,
      rosters,
      telemetryUrl,
    }),
  )
})

export { matchesRouter }
