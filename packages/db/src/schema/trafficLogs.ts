import { pgTable, uuid, varchar, integer, text, timestamp, index } from 'drizzle-orm/pg-core'

export const trafficLogs = pgTable(
  'traffic_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    path: varchar('path', { length: 256 }).notNull(),
    method: varchar('method', { length: 8 }).notNull(),
    statusCode: integer('status_code'),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    durationMs: integer('duration_ms'),
    searchedPlayer: varchar('searched_player', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_traffic_logs_created_at').on(table.createdAt),
    index('idx_traffic_logs_path').on(table.path),
  ],
)

export type TrafficLog = typeof trafficLogs.$inferSelect
export type NewTrafficLog = typeof trafficLogs.$inferInsert
