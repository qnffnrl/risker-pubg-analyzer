import { pgTable, uuid, integer, numeric, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { players } from './players'

export const playStyleAnalyses = pgTable(
  'play_style_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull().references(() => players.id),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }).defaultNow().notNull(),
    matchCount: integer('match_count').notNull(),
    aggressionScore: numeric('aggression_score', { precision: 5, scale: 2 }),
    survivalScore: numeric('survival_score', { precision: 5, scale: 2 }),
    positioningScore: numeric('positioning_score', { precision: 5, scale: 2 }),
    teamplayScore: numeric('teamplay_score', { precision: 5, scale: 2 }),
    aggressionMetrics: jsonb('aggression_metrics'),
    survivalMetrics: jsonb('survival_metrics'),
    positioningMetrics: jsonb('positioning_metrics'),
    teamplayMetrics: jsonb('teamplay_metrics'),
    weaponPreferences: jsonb('weapon_preferences'),
    mapPreferences: jsonb('map_preferences'),
    llmSummary: text('llm_summary'),
    llmGeneratedAt: timestamp('llm_generated_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idx_play_style_analyses_player_id').on(table.playerId),
    index('idx_play_style_analyses_expires_at').on(table.expiresAt),
  ],
)

export type PlayStyleAnalysis = typeof playStyleAnalyses.$inferSelect
export type NewPlayStyleAnalysis = typeof playStyleAnalyses.$inferInsert
