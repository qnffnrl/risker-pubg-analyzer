import { pgTable, pgEnum, uuid, varchar, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'

export const platformEnum = pgEnum('platform', ['steam', 'kakao', 'psn', 'xbox'])

export const players = pgTable(
  'players',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pubgId: varchar('pubg_id', { length: 64 }).notNull().unique(),
    nickname: varchar('nickname', { length: 64 }).notNull(),
    platform: platformEnum('platform').notNull(),
    region: varchar('region', { length: 16 }),
    lastFetchedAt: timestamp('last_fetched_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_players_nickname').on(table.nickname),
    uniqueIndex('idx_players_pubg_id').on(table.pubgId),
  ],
)

export type Player = typeof players.$inferSelect
export type NewPlayer = typeof players.$inferInsert
