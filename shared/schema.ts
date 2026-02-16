import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, bigint, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const files = pgTable("files", {
  id: varchar("id", { length: 32 }).primaryKey(),
  fileId: text("file_id").notNull(),
  fileUniqueId: text("file_unique_id").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull(),
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  fileType: text("file_type").notNull().default("document"),
  thumbnailFileId: text("thumbnail_file_id"),
  senderName: text("sender_name"),
  senderId: bigint("sender_id", { mode: "number" }),
  chatId: bigint("chat_id", { mode: "number" }),
  messageId: integer("message_id"),
  duration: integer("duration"),
  width: integer("width"),
  height: integer("height"),
  downloads: integer("downloads").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type TelegramFile = typeof files.$inferSelect;
