import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, gt, desc, inArray, schema } from '@risker/db'
import { PlatformSchema, createSuccessResponse, createErrorResponse } from '@risker/shared'
import { db } from '../../lib/db.js'
import { playerFetchQueue } from '../../lib/redis.js'

const players = new Hono()

const SearchQuerySchema = z.object({
  nickname: z.string().min(1).max(64),
  platform: PlatformSchema.default('steam'),
})

const SearchBodySchema = SearchQuerySchema

async function handleSearch(nickname: string, platform: z.infer<typeof PlatformSchema>, c: any) {
  c.set('searchedPlayer', nickname)

  // Check if player exists with fresh analysis
  const player = await db.query.players.findFirst({
    where: eq(schema.players.nickname, nickname),
  })

  if (player) {
    const freshAnalysis = await db.query.playStyleAnalyses.findFirst({
      where: and(
        eq(schema.playStyleAnalyses.playerId, player.id),
        gt(schema.playStyleAnalyses.expiresAt, new Date()),
      ),
      orderBy: [desc(schema.playStyleAnalyses.analyzedAt)],
    })

    if (freshAnalysis) {
      // Enqueue weapon mastery collection if missing (non-blocking)
      const weaponStat = await db.query.weaponStats.findFirst({
        where: eq(schema.weaponStats.playerId, player.id),
      })
      if (!weaponStat) {
        const weaponJobId = `player-fetch_${platform}_${nickname}_weapon_${Date.now()}`
        playerFetchQueue
          .add(
            'player-fetch',
            { nickname: player.nickname, platform, requestedAt: new Date().toISOString(), forceRefresh: false },
            { jobId: weaponJobId, removeOnComplete: { age: 3600 }, removeOnFail: { age: 86400 } },
          )
          .catch(() => undefined)
      }
      return c.json(
        createSuccessResponse({
          jobId: null,
          playerId: player.id,
          cached: true,
          player,
          analysis: freshAnalysis,
        }),
        200,
      )
    }
  }

  // Enqueue player-fetch job
  const jobId = `player-fetch_${platform}_${nickname}`
  await playerFetchQueue.add(
    'player-fetch',
    {
      nickname,
      platform,
      requestedAt: new Date().toISOString(),
      forceRefresh: false,
    },
    { jobId, removeOnComplete: { age: 3600 }, removeOnFail: { age: 86400 } },
  )

  return c.json(
    createSuccessResponse({
      jobId,
      playerId: player?.id ?? null,
      pubgId: player?.pubgId ?? null,
      cached: false,
    }),
    202,
  )
}

// GET /api/v1/players/search?nickname=&platform=
players.get('/search', zValidator('query', SearchQuerySchema), async (c) => {
  const { nickname, platform } = c.req.valid('query')
  return handleSearch(nickname, platform, c)
})

// POST /api/v1/players/search
players.post('/search', zValidator('json', SearchBodySchema), async (c) => {
  const { nickname, platform } = c.req.valid('json')
  return handleSearch(nickname, platform, c)
})

// GET /api/v1/players/:pubgId
players.get('/:pubgId', async (c) => {
  const { pubgId } = c.req.param()

  const player = await db.query.players.findFirst({
    where: eq(schema.players.pubgId, pubgId),
  })

  if (!player) {
    return c.json(createErrorResponse('PLAYER_NOT_FOUND', 'Player not found'), 404)
  }

  const latestAnalysis = await db.query.playStyleAnalyses.findFirst({
    where: eq(schema.playStyleAnalyses.playerId, player.id),
    orderBy: [desc(schema.playStyleAnalyses.analyzedAt)],
  })

  return c.json(createSuccessResponse({ player, latestAnalysis: latestAnalysis ?? null }))
})

// GET /api/v1/players/:pubgId/analysis
players.get('/:pubgId/analysis', async (c) => {
  const { pubgId } = c.req.param()

  const player = await db.query.players.findFirst({
    where: eq(schema.players.pubgId, pubgId),
  })

  if (!player) {
    return c.json(createErrorResponse('PLAYER_NOT_FOUND', 'Player not found'), 404)
  }

  const analysis = await db.query.playStyleAnalyses.findFirst({
    where: eq(schema.playStyleAnalyses.playerId, player.id),
    orderBy: [desc(schema.playStyleAnalyses.analyzedAt)],
  })

  if (!analysis) {
    return c.json(createErrorResponse('ANALYSIS_NOT_FOUND', 'No analysis available for this player'), 404)
  }

  return c.json(createSuccessResponse(analysis))
})

// GET /api/v1/players/:pubgId/matches?limit=20&offset=0
const MatchesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

players.get('/:pubgId/matches', zValidator('query', MatchesQuerySchema), async (c) => {
  const { pubgId } = c.req.param()
  const { limit, offset } = c.req.valid('query')

  const player = await db.query.players.findFirst({
    where: eq(schema.players.pubgId, pubgId),
  })

  if (!player) {
    return c.json(createErrorResponse('PLAYER_NOT_FOUND', 'Player not found'), 404)
  }

  const stats = await db
    .select({
      matchId: schema.matches.pubgMatchId,
      mapName: schema.matches.mapName,
      mode: schema.matches.mode,
      playedAt: schema.matches.playedAt,
      durationSec: schema.matches.durationSec,
      totalPlayers: schema.matches.totalPlayers,
      placement: schema.playerMatchStats.placement,
      kills: schema.playerMatchStats.kills,
      assists: schema.playerMatchStats.assists,
      damageDealt: schema.playerMatchStats.damageDealt,
      headshotKills: schema.playerMatchStats.headshotKills,
      distanceOnFoot: schema.playerMatchStats.distanceOnFoot,
      distanceInVehicle: schema.playerMatchStats.distanceInVehicle,
      timeSurvived: schema.playerMatchStats.timeSurvived,
      boosts: schema.playerMatchStats.boosts,
      heals: schema.playerMatchStats.heals,
      weaponsAcquired: schema.playerMatchStats.weaponsAcquired,
      revives: schema.playerMatchStats.revives,
    })
    .from(schema.playerMatchStats)
    .innerJoin(schema.matches, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .where(eq(schema.playerMatchStats.playerId, player.id))
    .orderBy(desc(schema.matches.playedAt))
    .limit(limit)
    .offset(offset)

  return c.json(createSuccessResponse({ matches: stats, limit, offset }))
})

// GET /api/v1/players/:pubgId/weapons
players.get('/:pubgId/weapons', async (c) => {
  const { pubgId } = c.req.param()

  const player = await db.query.players.findFirst({
    where: eq(schema.players.pubgId, pubgId),
  })

  if (!player) {
    return c.json(createErrorResponse('PLAYER_NOT_FOUND', 'Player not found'), 404)
  }

  const weaponStat = await db.query.weaponStats.findFirst({
    where: eq(schema.weaponStats.playerId, player.id),
  })

  if (!weaponStat) {
    return c.json(createErrorResponse('NOT_FOUND', 'Weapon data not found'), 404)
  }

  return c.json(createSuccessResponse({ weaponData: weaponStat.weaponData, fetchedAt: weaponStat.fetchedAt }))
})

// GET /api/v1/players/:pubgId/maps
players.get('/:pubgId/maps', async (c) => {
  const { pubgId } = c.req.param()

  const player = await db.query.players.findFirst({
    where: eq(schema.players.pubgId, pubgId),
  })

  if (!player) {
    return c.json(createErrorResponse('PLAYER_NOT_FOUND', 'Player not found'), 404)
  }

  const SURVIVAL_MODES = [
    'squad', 'squad-fpp',
    'duo', 'duo-fpp',
    'solo', 'solo-fpp',
    'normal-squad', 'normal-squad-fpp',
    'normal-duo', 'normal-duo-fpp',
    'normal-solo', 'normal-solo-fpp',
  ]

  const rows = await db
    .select({
      mapName: schema.matches.mapName,
      placement: schema.playerMatchStats.placement,
      kills: schema.playerMatchStats.kills,
      damageDealt: schema.playerMatchStats.damageDealt,
      distanceOnFoot: schema.playerMatchStats.distanceOnFoot,
      distanceInVehicle: schema.playerMatchStats.distanceInVehicle,
      timeSurvived: schema.playerMatchStats.timeSurvived,
    })
    .from(schema.playerMatchStats)
    .innerJoin(schema.matches, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .where(
      and(
        eq(schema.playerMatchStats.playerId, player.id),
        inArray(schema.matches.mode, SURVIVAL_MODES),
      )
    )

  // 맵별 집계
  const mapMap: Record<string, {
    games: number; kills: number; damage: number;
    placements: number[]; foot: number; vehicle: number; wins: number
  }> = {}

  for (const r of rows) {
    const key = r.mapName ?? 'Unknown'
    if (!mapMap[key]) mapMap[key] = { games: 0, kills: 0, damage: 0, placements: [], foot: 0, vehicle: 0, wins: 0 }
    const m = mapMap[key]!
    m.games++
    m.kills += r.kills ?? 0
    m.damage += parseFloat(r.damageDealt ?? '0')
    m.placements.push(r.placement ?? 99)
    m.foot += parseFloat(r.distanceOnFoot ?? '0')
    m.vehicle += parseFloat(r.distanceInVehicle ?? '0')
    if (r.placement === 1) m.wins++
  }

  const mapStats = Object.entries(mapMap).map(([mapName, s]) => ({
    mapName,
    games: s.games,
    wins: s.wins,
    winRate: s.games > 0 ? s.wins / s.games : 0,
    avgKills: s.games > 0 ? s.kills / s.games : 0,
    avgDamage: s.games > 0 ? s.damage / s.games : 0,
    avgPlacement: s.placements.length > 0 ? s.placements.reduce((a, b) => a + b, 0) / s.placements.length : 0,
    avgFootDistance: s.games > 0 ? s.foot / s.games : 0,
    avgVehicleDistance: s.games > 0 ? s.vehicle / s.games : 0,
  })).sort((a, b) => b.games - a.games)

  return c.json(createSuccessResponse({ mapStats, totalGames: rows.length }))
})

// GET /api/v1/players/:pubgId/ranked
players.get('/:pubgId/ranked', async (c) => {
  const { pubgId } = c.req.param()

  const player = await db.query.players.findFirst({
    where: eq(schema.players.pubgId, pubgId),
  })

  if (!player) {
    return c.json(createErrorResponse('PLAYER_NOT_FOUND', 'Player not found'), 404)
  }

  const rankedStat = await db.query.rankedStats.findFirst({
    where: eq(schema.rankedStats.playerId, player.id),
  })

  if (!rankedStat) {
    return c.json(createErrorResponse('NOT_FOUND', 'Ranked data not found'), 404)
  }

  return c.json(createSuccessResponse({
    rankedData: rankedStat.rankedData,
    seasonId: rankedStat.seasonId,
    fetchedAt: rankedStat.fetchedAt,
  }))
})

// POST /api/v1/players/:pubgId/refresh
players.post('/:pubgId/refresh', async (c) => {
  const { pubgId } = c.req.param()

  const player = await db.query.players.findFirst({
    where: eq(schema.players.pubgId, pubgId),
  })

  if (!player) {
    return c.json(createErrorResponse('PLAYER_NOT_FOUND', 'Player not found'), 404)
  }

  const jobId = `player-fetch_${player.platform}_${player.nickname}_refresh_${Date.now()}`
  await playerFetchQueue.add(
    'player-fetch',
    {
      nickname: player.nickname,
      platform: player.platform,
      requestedAt: new Date().toISOString(),
      forceRefresh: true,
    },
    { jobId },
  )

  return c.json(createSuccessResponse({ jobId, message: 'Refresh triggered' }), 202)
})

export { players }
