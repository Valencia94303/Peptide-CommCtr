// Drizzle schema — starting point. The full 9-table port + sessions/attachments
// lands in Phase 2 alongside the data migration. These two anchor the auth model
// (profiles.id references users.id, mirroring the old auth.users == profiles.id link).
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  // bcrypt hash imported from Supabase auth.users.encrypted_password (no resets).
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable('profiles', {
  id: uuid('id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
