import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
} from 'drizzle-orm/pg-core'
export const profiles = pgTable('profiles', {
  id: text().primaryKey(),
  email: text().notNull(),
  name: text().notNull(),
  data: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  balance: integer().notNull().default(1248050),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
export const applications = pgTable('applications', {
  id: uuid().defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => profiles.id),
  kind: text().notNull(),
  status: text().notNull().default('pending'),
  data: jsonb().$type<Record<string, unknown>>().notNull(),
  notes: text().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
export const ledger = pgTable('ledger', {
  id: uuid().defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => profiles.id),
  description: text().notNull(),
  amount: integer().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
export const audits = pgTable('audits', {
  id: uuid().defaultRandom().primaryKey(),
  actor: text().notNull(),
  action: text().notNull(),
  target: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
export const inquiries = pgTable('inquiries', {
  id: uuid().defaultRandom().primaryKey(),
  kind: text().notNull(),
  email: text().notNull(),
  data: jsonb().$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
export const wallets = pgTable('wallets', {
  symbol: text().primaryKey(),
  address: text().notNull(),
  network: text().notNull(),
})
