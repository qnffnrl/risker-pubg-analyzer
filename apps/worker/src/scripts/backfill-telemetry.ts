/**
 * backfill-telemetry.ts
 *
 * included_data가 없거나 telemetry URL이 없는 매치를 PUBG API에서 재수집하여
 * included_data를 업데이트하고 telemetry-fetch 큐에 투입하는 일회성 backfill 스크립트.
 *
 * 실행: pnpm --filter @risker/worker backfill:telemetry
 */

import { eq, isNull, isNotNull, schema } from '@risker/db'
import { PLATFORM_TO_SHARD } from '@risker/shared'
import { db } from '../lib/db.js'
import { PubgApiClient } from '../lib/pubg-client.js'
import { telemetryFetchQueue } from '../queues/index.js'
import { redisConnection } from '../redis.js'

const RATE_LIMIT_DELAY_MS = 300
const TDM_TRAINING_MAPS = ['Italy_TDM_Main', 'Range_Main']

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main(): Promise<void> {
  const pubg = new PubgApiClient()

  console.log('[backfill] 대상 매치 조회 중...')

  // included_data가 없는 매치 조회: player_match_stats → players join으로 shard 추론
  const nullIncludedRows = await db
    .select({
      matchId: schema.matches.id,
      pubgMatchId: schema.matches.pubgMatchId,
      mapName: schema.matches.mapName,
      platform: schema.players.platform,
    })
    .from(schema.matches)
    .innerJoin(schema.playerMatchStats, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .innerJoin(schema.players, eq(schema.players.id, schema.playerMatchStats.playerId))
    .where(isNull(schema.matches.includedData))

  // included_data는 있지만 telemetry URL이 없는 매치도 조회
  const existingIncludedRows = await db
    .select({
      matchId: schema.matches.id,
      pubgMatchId: schema.matches.pubgMatchId,
      mapName: schema.matches.mapName,
      includedData: schema.matches.includedData,
      platform: schema.players.platform,
    })
    .from(schema.matches)
    .innerJoin(schema.playerMatchStats, eq(schema.playerMatchStats.matchId, schema.matches.id))
    .innerJoin(schema.players, eq(schema.players.id, schema.playerMatchStats.playerId))
    .where(isNotNull(schema.matches.includedData))

  // pubgMatchId 기준으로 중복 제거 (한 매치에 여러 플레이어가 있을 수 있음)
  // TDM/Training 제외
  const seenNull = new Map<string, typeof nullIncludedRows[number]>()
  for (const row of nullIncludedRows) {
    if (TDM_TRAINING_MAPS.includes(row.mapName ?? '')) continue
    if (!seenNull.has(row.pubgMatchId)) {
      seenNull.set(row.pubgMatchId, row)
    }
  }
  const needsRefetch = Array.from(seenNull.values())

  // included_data가 있지만 telemetry URL이 없는 매치 → 큐 투입만 시도 (재fetch 불필요)
  const seenExisting = new Map<string, typeof existingIncludedRows[number]>()
  for (const row of existingIncludedRows) {
    if (TDM_TRAINING_MAPS.includes(row.mapName ?? '')) continue
    if (!seenExisting.has(row.pubgMatchId)) {
      seenExisting.set(row.pubgMatchId, row)
    }
  }

  const needsQueueOnly = Array.from(seenExisting.values()).filter((r) => {
    const included = r.includedData as Array<{ type: string; attributes?: { URL?: string } }> | null
    const asset = included?.find((i) => i.type === 'asset')
    return !asset?.attributes?.URL
  })

  console.log(`[backfill] included_data NULL → 재fetch 대상: ${needsRefetch.length}개`)
  console.log(`[backfill] included_data 있음 but no telemetry URL: ${needsQueueOnly.length}개 (skip)`)
  console.log(`[backfill] 총 처리 대상: ${needsRefetch.length}개`)

  let success = 0
  let failed = 0
  const skipped = needsQueueOnly.length
  let queued = 0

  // --- Phase 1: included_data NULL → PUBG API 재fetch + DB 업데이트 + 큐 투입 ---
  for (let i = 0; i < needsRefetch.length; i++) {
    const row = needsRefetch[i]!
    const progress = `[${i + 1}/${needsRefetch.length}]`
    const shard = PLATFORM_TO_SHARD[row.platform] ?? 'steam'

    try {
      console.log(`${progress} fetch: ${row.pubgMatchId} (shard=${shard})`)
      const matchResponse = await pubg.getMatch(shard, row.pubgMatchId)

      // DB 업데이트
      await db
        .update(schema.matches)
        .set({
          includedData: matchResponse.included as unknown as Record<string, unknown>[],
        })
        .where(eq(schema.matches.id, row.matchId))

      // telemetry URL 추출
      const asset = matchResponse.included.find((i) => i.type === 'asset')
      const telemetryUrl = asset?.type === 'asset' ? asset.attributes.URL : undefined

      if (telemetryUrl) {
        await telemetryFetchQueue.add(
          'fetch',
          { matchId: row.matchId, telemetryUrl },
          { jobId: `telemetry-${row.matchId}` },
        )
        queued++
        console.log(`${progress} ✓ included_data 저장 + telemetry 큐 투입`)
      } else {
        console.log(`${progress} ✓ included_data 저장 (telemetry URL 없음 — 큐 투입 skip)`)
      }

      success++
    } catch (err) {
      failed++
      console.error(`${progress} ✗ skip (${row.pubgMatchId}):`, String(err))
    }

    // Rate limit: 매치 간 300ms 대기
    if (i < needsRefetch.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS)
    }
  }

  // --- 결과 출력 ---
  console.log('\n[backfill] 완료')
  console.log(`  성공 (재fetch + DB 업데이트): ${success}개`)
  console.log(`  텔레메트리 큐 투입:           ${queued}개`)
  console.log(`  실패 (skip):                  ${failed}개`)
  console.log(`  skip (URL 없는 included_data): ${skipped}개`)
}

main()
  .catch((err) => {
    console.error('[backfill] Fatal error:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await redisConnection.quit()
    console.log('[backfill] Redis 연결 종료')
  })
