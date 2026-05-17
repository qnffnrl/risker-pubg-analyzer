import { eq, inArray, schema } from '@risker/db'
import { db } from '../../db.js'

export interface MapHeatmapPoints {
  mapName: string
  kills: Array<[number, number]>
  deaths: Array<[number, number]>
}

const MAP_SIZES: Record<string, number> = {
  Erangel_Main: 813000,
  Desert_Main: 813000,
  Savage_Main: 408000,
  DihorOtok_Main: 610000,
  Summerland_Main: 204000,
  Chimera_Main: 306000,
  Tiger_Main: 813000,
  Heaven_Main: 813000,
  Kiki_Main: 813000,
  Baltic_Main: 813000,
}

function normalize(x: number, y: number, mapName: string): [number, number] {
  const size = MAP_SIZES[mapName] ?? 813000
  return [
    Math.round((x / size) * 10000) / 10000,
    Math.round((y / size) * 10000) / 10000,
  ]
}

export async function aggregateHeatmaps(
  playerId: string,
  pubgAccountId: string,
): Promise<Record<string, MapHeatmapPoints>> {
  // Get all matches for this player with their map names and DB IDs
  const matchRows = await db
    .select({
      matchId: schema.matches.id,
      mapName: schema.matches.mapName,
    })
    .from(schema.playerMatchStats)
    .innerJoin(schema.matches, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .where(eq(schema.playerMatchStats.playerId, playerId))

  if (matchRows.length === 0) return {}

  const matchDbIds = matchRows.map(r => r.matchId)

  // Load telemetry for all matches
  const telemetryRows = await db
    .select({
      matchId: schema.matchTelemetry.matchId,
      payload: schema.matchTelemetry.payload,
    })
    .from(schema.matchTelemetry)
    .where(
      matchDbIds.length === 1
        ? eq(schema.matchTelemetry.matchId, matchDbIds[0]!)
        : inArray(schema.matchTelemetry.matchId, matchDbIds),
    )

  const telemetryMap = new Map<string, unknown[]>()
  for (const row of telemetryRows) {
    telemetryMap.set(row.matchId, (row.payload as unknown[]) ?? [])
  }

  const matchMapMap = new Map<string, string>()
  for (const r of matchRows) {
    matchMapMap.set(r.matchId, r.mapName ?? 'Unknown')
  }

  const result: Record<string, MapHeatmapPoints> = {}

  for (const [matchId, events] of telemetryMap) {
    const mapName = matchMapMap.get(matchId) ?? 'Unknown'
    if (!result[mapName]) {
      result[mapName] = { mapName, kills: [], deaths: [] }
    }
    const mapData = result[mapName]!

    for (const event of events as Array<Record<string, unknown>>) {
      if (event['_T'] !== 'LogPlayerKillV2') continue

      const killer = event['killer'] as Record<string, unknown> | undefined
      const victim = event['victim'] as Record<string, unknown> | undefined

      if (killer?.['accountId'] === pubgAccountId) {
        const loc = victim?.['location'] as Record<string, unknown> | undefined
        if (loc && typeof loc['x'] === 'number' && typeof loc['y'] === 'number') {
          mapData.kills.push(normalize(loc['x'], loc['y'], mapName))
        }
      }

      if (victim?.['accountId'] === pubgAccountId) {
        const loc = victim['location'] as Record<string, unknown> | undefined
        if (loc && typeof loc['x'] === 'number' && typeof loc['y'] === 'number') {
          mapData.deaths.push(normalize(loc['x'], loc['y'], mapName))
        }
      }
    }
  }

  return result
}
