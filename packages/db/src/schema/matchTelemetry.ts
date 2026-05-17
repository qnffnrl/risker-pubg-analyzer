import { pgTable, uuid, jsonb, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { matches } from './matches'

export const matchTelemetry = pgTable(
  'match_telemetry',
  {
    matchId: uuid('match_id').primaryKey().references(() => matches.id, { onDelete: 'cascade' }),
    payload: jsonb('payload').notNull(),
    eventCount: integer('event_count'),
    payloadBytes: integer('payload_bytes'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_match_telemetry_fetched_at').on(table.fetchedAt),
  ],
)

export type MatchTelemetry = typeof matchTelemetry.$inferSelect
export type NewMatchTelemetry = typeof matchTelemetry.$inferInsert
