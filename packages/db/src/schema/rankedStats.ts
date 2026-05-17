import { pgTable, uuid, text, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { players } from './players'

export const rankedStats = pgTable(
  'ranked_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull().references(() => players.id),
    seasonId: text('season_id').notNull(),
    rankedData: jsonb('ranked_data').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_ranked_stats_player_id').on(table.playerId),
  ],
)

export type RankedStat = typeof rankedStats.$inferSelect
export type NewRankedStat = typeof rankedStats.$inferInsert
