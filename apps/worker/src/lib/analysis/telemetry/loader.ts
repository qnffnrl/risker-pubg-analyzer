import { eq, inArray, schema } from '@risker/db'
import { db } from '../../db.js'

export async function loadTelemetry(matchId: string): Promise<unknown[]> {
  const row = await db
    .select({ payload: schema.matchTelemetry.payload })
    .from(schema.matchTelemetry)
    .where(eq(schema.matchTelemetry.matchId, matchId))
    .limit(1)

  if (!row[0]) return []
  return (row[0].payload as unknown[]) ?? []
}

export async function loadTelemetryForPlayer(
  matchIds: string[],
): Promise<Map<string, unknown[]>> {
  if (matchIds.length === 0) return new Map()

  const rows = await db
    .select({
      matchId: schema.matchTelemetry.matchId,
      payload: schema.matchTelemetry.payload,
    })
    .from(schema.matchTelemetry)
    .where(inArray(schema.matchTelemetry.matchId, matchIds))

  const result = new Map<string, unknown[]>()
  for (const row of rows) {
    result.set(row.matchId, (row.payload as unknown[]) ?? [])
  }
  return result
}
