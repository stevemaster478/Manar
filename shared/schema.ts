import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  textSize: varchar("text_size").notNull().default("medium"), // small, medium, large, extra-large
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Shamela texts/books table
export const texts = pgTable("texts", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  author: varchar("author"),
  category: varchar("category"),
  era: varchar("era"),
  content: text("content").notNull(),
  introduction: text("introduction"), // Introduzione del libro da Shamela
  metadata: jsonb("metadata"), // Additional book metadata (chapters, pages, etc.)
  createdAt: timestamp("created_at").defaultNow(),
});

export const textsRelations = relations(texts, ({ many }) => ({
  bookmarks: many(bookmarks),
  readingHistory: many(readingHistory),
}));

export const insertTextSchema = createInsertSchema(texts).omit({
  createdAt: true,
});

export type InsertText = z.infer<typeof insertTextSchema>;
export type Text = typeof texts.$inferSelect;

// Translation cache table
export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  textId: integer("text_id").notNull().references(() => texts.id, { onDelete: 'cascade' }),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text").notNull(),
  sourceLanguage: varchar("source_language").notNull().default("ar"),
  targetLanguage: varchar("target_language").notNull().default("it"),
  model: varchar("model").notNull(), // gemini, deepseek
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_translations_text_id").on(table.textId),
]);

export const translationsRelations = relations(translations, ({ one }) => ({
  text: one(texts, {
    fields: [translations.textId],
    references: [texts.id],
  }),
}));

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  createdAt: true,
});

export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translations.$inferSelect;

// Bookmarks table
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  textId: integer("text_id").notNull().references(() => texts.id, { onDelete: 'cascade' }),
  pageNumber: integer("page_number"),
  excerpt: text("excerpt"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_bookmarks_user_id").on(table.userId),
  index("idx_bookmarks_text_id").on(table.textId),
]);

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  text: one(texts, {
    fields: [bookmarks.textId],
    references: [texts.id],
  }),
}));

export const insertBookmarkSchema = createInsertSchema(bookmarks).omit({
  id: true,
  createdAt: true,
});

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Reading history table
export const readingHistory = pgTable("reading_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  textId: integer("text_id").notNull().references(() => texts.id, { onDelete: 'cascade' }),
  lastPageNumber: integer("last_page_number"),
  progress: integer("progress").notNull().default(0), // Percentage 0-100
  lastReadAt: timestamp("last_read_at").defaultNow(),
}, (table) => [
  index("idx_reading_history_user_id").on(table.userId),
  index("idx_reading_history_text_id").on(table.textId),
]);

export const readingHistoryRelations = relations(readingHistory, ({ one }) => ({
  user: one(users, {
    fields: [readingHistory.userId],
    references: [users.id],
  }),
  text: one(texts, {
    fields: [readingHistory.textId],
    references: [texts.id],
  }),
}));

export const insertReadingHistorySchema = createInsertSchema(readingHistory).omit({
  id: true,
  lastReadAt: true,
});

export type InsertReadingHistory = z.infer<typeof insertReadingHistorySchema>;
export type ReadingHistory = typeof readingHistory.$inferSelect;
