import { pgTable, serial, text, integer, timestamp, char, primaryKey, index } from 'drizzle-orm/pg-core';

// Usuarios (provisionados por el admin; sin signup)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  display_name: text('display_name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Sesiones (token opaco)
export const sessions = pgTable('sessions', {
  token: text('token').primaryKey(),
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires_at: timestamp('expires_at', { withTimezone: true }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  user_idx: index('idx_sessions_user').on(table.user_id),
}));

// Predicciones: 1 fila por (usuario, partido)
export const predictions = pgTable('predictions', {
  user_id: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  match_id: integer('match_id').notNull(),
  resultado: char('resultado', { length: 1 }).notNull(),
  goles_local: integer('goles_local').notNull(),
  goles_visita: integer('goles_visita').notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.user_id, table.match_id] }),
}));

// Resultados reales: el admin inserta/actualiza conforme avanza el torneo
export const results = pgTable('results', {
  id: serial('id').primaryKey(),
  match_id: integer('match_id').notNull().unique(),
  goles_local: integer('goles_local').notNull(),
  goles_visita: integer('goles_visita').notNull(),
  video: text('video').notNull().default(''),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
