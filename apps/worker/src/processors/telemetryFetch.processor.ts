import type { Job } from 'bullmq'
import { eq, schema } from '@risker/db'
import { db } from '../lib/db.js'
import { PubgApiClient } from '../lib/pubg-client.js'

const pubg = new PubgApiClient()

export interface TelemetryFetchJob {
  matchId: string
  telemetryUrl: string
}

export async function telemetryFetchProcessor(job: Job<TelemetryFetchJob>): Promise<void> {
  const { matchId, telemetryUrl } = job.data

  // Skip if already fetched
  const existing = await db
    .select({ matchId: schema.matchTelemetry.matchId })
    .from(schema.matchTelemetry)
    .where(eq(schema.matchTelemetry.matchId, matchId))
    .limit(1)

  if (existing.length > 0) {
    job.log(`Telemetry already exists for match ${matchId}, skipping`)
    return
  }

  job.log(`Fetching telemetry for match ${matchId} from ${telemetryUrl}`)
  const events = await pubg.getTelemetry(telemetryUrl)

  const payloadStr = JSON.stringify(events)
  const payloadBytes = Buffer.byteLength(payloadStr, 'utf8')

  await db
    .insert(schema.matchTelemetry)
    .values({
      matchId,
      payload: events as unknown as Record<string, unknown>[],
      eventCount: events.length,
      payloadBytes,
    })
    .onConflictDoNothing()

  job.log(`Telemetry stored: ${events.length} events, ${(payloadBytes / 1024).toFixed(1)}KB`)
}
