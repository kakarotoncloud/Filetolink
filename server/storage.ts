import { type InsertFile, type TelegramFile, files, settings } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getFile(id: string): Promise<TelegramFile | undefined>;
  createFile(file: InsertFile): Promise<TelegramFile>;
  incrementDownloads(id: string): Promise<void>;
  getStats(): Promise<{ totalFiles: number; totalSize: number; totalDownloads: number }>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getFile(id: string): Promise<TelegramFile | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async createFile(file: InsertFile): Promise<TelegramFile> {
    const [created] = await db.insert(files).values(file).onConflictDoUpdate({
      target: files.id,
      set: {
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        mimeType: file.mimeType,
        fileType: file.fileType,
        thumbnailFileId: file.thumbnailFileId,
        senderName: file.senderName,
        senderId: file.senderId,
        chatId: file.chatId,
        messageId: file.messageId,
        duration: file.duration,
        width: file.width,
        height: file.height,
      },
    }).returning();
    return created;
  }

  async incrementDownloads(id: string): Promise<void> {
    await db.update(files).set({
      downloads: sql`${files.downloads} + 1`,
    }).where(eq(files.id, id));
  }

  async getStats(): Promise<{ totalFiles: number; totalSize: number; totalDownloads: number }> {
    const result = await db.select({
      totalFiles: sql<number>`count(*)::int`,
      totalSize: sql<number>`coalesce(sum(${files.fileSize}), 0)::bigint`,
      totalDownloads: sql<number>`coalesce(sum(${files.downloads}), 0)::int`,
    }).from(files);
    return {
      totalFiles: result[0]?.totalFiles ?? 0,
      totalSize: Number(result[0]?.totalSize ?? 0),
      totalDownloads: result[0]?.totalDownloads ?? 0,
    };
  }
  async getSetting(key: string): Promise<string | null> {
    const [row] = await db.select().from(settings).where(eq(settings.key, key));
    return row?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(settings).values({ key, value }).onConflictDoUpdate({
      target: settings.key,
      set: { value },
    });
  }
}

export const storage = new DatabaseStorage();
