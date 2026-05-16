import { pgTable, uuid, integer, numeric, jsonb, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { players } from './players'
import { matches } from './matches'

export const playerMatchStats = pgTable(
  'player_match_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull().references(() => players.id),
    matchId: uuid('match_id').notNull().references(() => matches.id),
    placement: integer('placement'),
    kills: integer('kills'),
    assists: integer('assists'),
    damageDealt: numeric('damage_dealt', { precision: 8, scale: 2 }),
    headshotKills: integer('headshot_kills'),
    distanceOnFoot: numeric('distance_on_foot', { precision: 10, scale: 2 }),
    distanceInVehicle: numeric('distance_in_vehicle', { precision: 10, scale: 2 }),
    timeSurvived: integer('time_survived'),
    boosts: integer('boosts'),
    heals: integer('heals'),
    weaponsAcquired: integer('weapons_acquired'),
    revives: integer('revives'),
    teamKills: integer('team_kills'),
    rawStats: jsonb('raw_stats'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_player_match_stats_unique').on(table.playerId, table.matchId),
    index('idx_player_match_stats_player_id').on(table.playerId),
  ],
)

export type PlayerMatchStat = typeof playerMatchStats.$inferSelect
export type NewPlayerMatchStat = typeof playerMatchStats.$inferInsert
