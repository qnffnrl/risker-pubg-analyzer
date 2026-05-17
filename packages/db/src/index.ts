import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined

export function getDb() {
  if (_db) return _db

  const connectionString = process.env['DATABASE_URL']
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const client = postgres(connectionString, { prepare: false })
  _db = drizzle(client, { schema })
  return _db
}

export { schema }
export type { schema as Schema }

export { sql, eq, and, or, gt, gte, lt, lte, ne, desc, asc, inArray, notInArray, isNull, isNotNull } from 'drizzle-orm'

export type {
  Player, NewPlayer,
  Match, NewMatch,
  MatchTelemetry, NewMatchTelemetry,
  PlayerMatchStat, NewPlayerMatchStat,
  PlayStyleAnalysis, NewPlayStyleAnalysis,
  AnalysisJob, NewAnalysisJob,
  TrafficLog, NewTrafficLog,
  WeaponStat, NewWeaponStat,
} from './schema'
