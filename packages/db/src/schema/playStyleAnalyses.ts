import { pgTable, uuid, integer, numeric, text, jsonb, timestamp, varchar, index } from 'drizzle-orm/pg-core'
import { players } from './players'

export const playStyleAnalyses = pgTable(
  'play_style_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull().unique().references(() => players.id),
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
    consistencyScore: numeric('consistency_score', { precision: 5, scale: 2 }),
    clutchScore: numeric('clutch_score', { precision: 5, scale: 2 }),
    consistencyMetrics: jsonb('consistency_metrics'),
    clutchMetrics: jsonb('clutch_metrics'),
    scoreVersion: varchar('score_version', { length: 8 }).default('v1'),
    aggressionScoreV2: numeric('aggression_score_v2', { precision: 5, scale: 2 }),
    survivalScoreV2: numeric('survival_score_v2', { precision: 5, scale: 2 }),
    positioningScoreV2: numeric('positioning_score_v2', { precision: 5, scale: 2 }),
    teamplayScoreV2: numeric('teamplay_score_v2', { precision: 5, scale: 2 }),
    aggressionMetricsV2: jsonb('aggression_metrics_v2'),
    survivalMetricsV2: jsonb('survival_metrics_v2'),
    positioningMetricsV2: jsonb('positioning_score_v2_metrics'),
    teamplayMetricsV2: jsonb('teamplay_metrics_v2'),
    skillScore: numeric('skill_score', { precision: 5, scale: 2 }),
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
