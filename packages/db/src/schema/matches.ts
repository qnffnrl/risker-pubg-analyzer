import { pgTable, uuid, varchar, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core'

export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pubgMatchId: varchar('pubg_match_id', { length: 128 }).notNull().unique(),
    mapName: varchar('map_name', { length: 64 }),
    mode: varchar('mode', { length: 32 }),
    playedAt: timestamp('played_at', { withTimezone: true }),
    durationSec: integer('duration_sec'),
    totalPlayers: integer('total_players'),
    rawData: jsonb('raw_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_matches_pubg_match_id').on(table.pubgMatchId),
    index('idx_matches_played_at').on(table.playedAt),
  ],
)

export type Match = typeof matches.$inferSelect
export type NewMatch = typeof matches.$inferInsert
