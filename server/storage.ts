// Referenced from javascript_database and javascript_log_in_with_replit blueprints
import {
  users,
  texts,
  translations,
  bookmarks,
  readingHistory,
  type User,
  type UpsertUser,
  type Text,
  type InsertText,
  type Translation,
  type InsertTranslation,
  type Bookmark,
  type InsertBookmark,
  type ReadingHistory,
  type InsertReadingHistory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserTextSize(id: string, textSize: string): Promise<void>;

  // Text operations
  searchTexts(query?: string, author?: string, category?: string, era?: string): Promise<Text[]>;
  getTextById(id: number): Promise<Text | undefined>;
  createText(text: InsertText): Promise<Text>;

  // Translation operations
  getTranslation(textId: number, originalText: string): Promise<Translation | undefined>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;

  // Bookmark operations
  getBookmarksByUserId(userId: string): Promise<Bookmark[]>;
  getRecentBookmarksByUserId(userId: string, limit: number): Promise<Bookmark[]>;
  createBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  deleteBookmark(id: string, userId: string): Promise<void>;

  // Reading history operations
  getReadingHistoryByUserId(userId: string): Promise<ReadingHistory[]>;
  getRecentReadingHistoryByUserId(userId: string, limit: number): Promise<ReadingHistory[]>;
  upsertReadingHistory(history: InsertReadingHistory): Promise<ReadingHistory>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserTextSize(id: string, textSize: string): Promise<void> {
    await db.update(users).set({ textSize }).where(eq(users.id, id));
  }

  // Text operations
  async searchTexts(query?: string, author?: string, category?: string, era?: string): Promise<Text[]> {
    let conditions = [];

    if (query) {
      conditions.push(
        or(
          ilike(texts.title, `%${query}%`),
          ilike(texts.content, `%${query}%`)
        )
      );
    }

    if (author) {
      conditions.push(eq(texts.author, author));
    }

    if (category) {
      conditions.push(eq(texts.category, category));
    }

    if (era) {
      conditions.push(eq(texts.era, era));
    }

    if (conditions.length === 0) {
      return await db.select().from(texts).limit(50);
    }

    return await db
      .select()
      .from(texts)
      .where(and(...conditions))
      .limit(50);
  }

  async getTextById(id: number): Promise<Text | undefined> {
    const [text] = await db.select().from(texts).where(eq(texts.id, id));
    return text;
  }

  async createText(textData: InsertText): Promise<Text> {
    const [text] = await db.insert(texts).values(textData).returning();
    return text;
  }

  // Translation operations
  async getTranslation(textId: number, originalText: string): Promise<Translation | undefined> {
    const [translation] = await db
      .select()
      .from(translations)
      .where(
        and(
          eq(translations.textId, textId),
          eq(translations.originalText, originalText)
        )
      )
      .limit(1);
    return translation;
  }

  async createTranslation(translationData: InsertTranslation): Promise<Translation> {
    const [translation] = await db
      .insert(translations)
      .values(translationData)
      .returning();
    return translation;
  }

  // Bookmark operations
  async getBookmarksByUserId(userId: string): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
  }

  async getRecentBookmarksByUserId(userId: string, limit: number): Promise<Bookmark[]> {
    return await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .limit(limit);
  }

  async createBookmark(bookmarkData: InsertBookmark): Promise<Bookmark> {
    const [bookmark] = await db
      .insert(bookmarks)
      .values(bookmarkData)
      .returning();
    return bookmark;
  }

  async deleteBookmark(id: string, userId: string): Promise<void> {
    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));
  }

  // Reading history operations
  async getReadingHistoryByUserId(userId: string): Promise<ReadingHistory[]> {
    return await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.lastReadAt));
  }

  async getRecentReadingHistoryByUserId(userId: string, limit: number): Promise<ReadingHistory[]> {
    return await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .orderBy(desc(readingHistory.lastReadAt))
      .limit(limit);
  }

  async upsertReadingHistory(historyData: InsertReadingHistory): Promise<ReadingHistory> {
    const existing = await db
      .select()
      .from(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, historyData.userId),
          eq(readingHistory.textId, historyData.textId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(readingHistory)
        .set({
          ...historyData,
          lastReadAt: new Date(),
        })
        .where(eq(readingHistory.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(readingHistory)
      .values(historyData)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
