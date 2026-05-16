import { pgTable, uuid, jsonb, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { players } from './players'

export const weaponStats = pgTable(
  'weapon_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull().references(() => players.id),
    weaponData: jsonb('weapon_data').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_weapon_stats_player_id').on(table.playerId),
  ],
)

export type WeaponStat = typeof weaponStats.$inferSelect
export type NewWeaponStat = typeof weaponStats.$inferInsert
