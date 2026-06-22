import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export interface ReActStep {
  type: 'plan' | 'execute' | 'verify';
  message: string;
  details?: any;
  timestamp: string;
}

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  steps: jsonb('steps').$type<Array<ReActStep>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
