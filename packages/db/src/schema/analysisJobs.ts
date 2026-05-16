import { pgTable, pgEnum, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core'
import { players } from './players'

export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed'])

export const analysisJobs = pgTable(
  'analysis_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull().references(() => players.id),
    status: jobStatusEnum('status').notNull().default('pending'),
    bullJobId: varchar('bull_job_id', { length: 128 }),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_analysis_jobs_player_id').on(table.playerId),
    index('idx_analysis_jobs_status').on(table.status),
  ],
)

export type AnalysisJob = typeof analysisJobs.$inferSelect
export type NewAnalysisJob = typeof analysisJobs.$inferInsert
