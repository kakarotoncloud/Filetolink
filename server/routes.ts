import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createBot } from "./bot";
import { initMTProto, isMTProtoReady, streamFileFromMessage } from "./mtproto";
import { log } from "./index";
import type { TelegramFile } from "@shared/schema";

async function getTelegramFileUrl(fileId: string): Promise<string | null> {
  const token = process.env.BOT_TOKEN;
  if (!token) return null;

  try {
    const fileInfoRes = await fetch(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoRes.json();
    if (!fileInfo.ok || !fileInfo.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${token}/${fileInfo.result.file_path}`;
  } catch {
    return null;
  }
}

function parseRange(rangeHeader: string, fileSize: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
  if (start >= fileSize || end >= fileSize || start > end) return null;
  return { start, end };
}

function writeWithBackpressure(res: Response, chunk: Buffer): Promise<boolean> {
  return new Promise((resolve) => {
    const ok = res.write(chunk);
    if (ok) {
      resolve(true);
    } else {
      res.once("drain", () => resolve(true));
    }
  });
}

async function serveMTProtoFile(
  file: TelegramFile,
  req: Request,
  res: Response,
  isDownload: boolean,
): Promise<boolean> {
  if (!isMTProtoReady() || !file.chatId || !file.messageId) return false;

  const rangeHeader = req.headers.range;
  let aborted = false;
  req.on("close", () => { aborted = true; });

  try {
    if (rangeHeader && file.fileSize > 0) {
      const range = parseRange(rangeHeader, file.fileSize);
      if (!range) {
        res.status(416).setHeader("Content-Range", `bytes */${file.fileSize}`);
        res.end();
        return true;
      }

      const { start, end } = range;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${file.fileSize}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", chunkSize.toString());
      res.setHeader("Content-Type", file.mimeType);
      if (isDownload) {
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      } else {
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.fileName)}"`);
      }

      let bytesWritten = 0;
      const success = await streamFileFromMessage(
        file.chatId,
        file.messageId,
        async (chunk) => {
          if (aborted) return false;
          const remaining = chunkSize - bytesWritten;
          if (remaining <= 0) return false;
          const toWrite = chunk.length > remaining ? chunk.subarray(0, remaining) : chunk;
          await writeWithBackpressure(res, toWrite);
          bytesWritten += toWrite.length;
          return bytesWritten < chunkSize && !aborted;
        },
        start,
      );

      if (success && !aborted) {
        res.end();
      }
      return true;
    } else {
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Accept-Ranges", "bytes");
      if (file.fileSize > 0) {
        res.setHeader("Content-Length", file.fileSize.toString());
      }
      if (isDownload) {
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.fileName)}"`);
      } else {
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.fileName)}"`);
      }

      const success = await streamFileFromMessage(
        file.chatId,
        file.messageId,
        async (chunk) => {
          if (aborted) return false;
          await writeWithBackpressure(res, chunk);
          return !aborted;
        },
      );

      if (success && !aborted) {
        res.end();
      }
      return true;
    }
  } catch (err: any) {
    log(`MTProto serve error: ${err.message}`, "mtproto");
    return false;
  }
}

async function serveBotApiFile(
  file: TelegramFile,
  req: Request,
  res: Response,
  isDownload: boolean,
): Promise<boolean> {
  const telegramUrl = await getTelegramFileUrl(file.fileId);
  if (!telegramUrl) return false;

  const rangeHeader = req.headers.range;

  try {
    const fetchHeaders: Record<string, string> = {};
    if (rangeHeader) {
      fetchHeaders["Range"] = rangeHeader;
    }

    const upstream = await fetch(telegramUrl, {
      headers: Object.keys(fetchHeaders).length > 0 ? fetchHeaders : undefined,
    });

    if (!upstream.ok && upstream.status !== 206) return false;

    if (upstream.status === 206) {
      res.status(206);
      const cr = upstream.headers.get("content-range");
      if (cr) res.setHeader("Content-Range", cr);
      res.setHeader("Accept-Ranges", "bytes");
      const cl = upstream.headers.get("content-length");
      if (cl) res.setHeader("Content-Length", cl);
      res.setHeader("Content-Type", file.mimeType);
    } else {
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Accept-Ranges", "bytes");
      const cl = upstream.headers.get("content-length");
      if (cl) res.setHeader("Content-Length", cl);
      else if (file.fileSize > 0) res.setHeader("Content-Length", file.fileSize.toString());
    }

    if (isDownload) {
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.fileName)}"`);
    }

    const reader = upstream.body?.getReader();
    if (!reader) return false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writeWithBackpressure(res, Buffer.from(value));
    }
    res.end();
    return true;
  } catch {
    return false;
  }
}

async function serveFile(req: Request, res: Response, isDownload: boolean) {
  try {
    const fileId = req.params.id as string;
    const file = await storage.getFile(fileId);
    if (!file) {
      return res.status(404).send("File not found");
    }

    storage.incrementDownloads(file.id).catch(() => {});

    if (isMTProtoReady() && file.chatId && file.messageId) {
      const served = await serveMTProtoFile(file, req, res, isDownload);
      if (served) return;
      log("MTProto failed, falling back to Bot API", "express");
    }

    const served = await serveBotApiFile(file, req, res, isDownload);
    if (served) return;

    if (!res.headersSent) {
      res.status(404).send("File no longer available on Telegram. It may be too large for Bot API (>20MB). Try re-sending it to the bot.");
    }
  } catch (err) {
    log(`File serve error: ${err}`, "express");
    if (!res.headersSent) {
      res.status(500).send("Failed to serve file");
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  let baseUrl = process.env.BASE_URL || "";
  if (!baseUrl) {
    if (process.env.REPLIT_DEV_DOMAIN) {
      baseUrl = `https://${process.env.REPLIT_DEV_DOMAIN}`;
    } else if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      baseUrl = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
    } else if (process.env.HEROKU_APP_NAME) {
      baseUrl = `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`;
    } else {
      const port = process.env.PORT || "5000";
      baseUrl = `http://localhost:${port}`;
    }
  }

  let botUsername = "";
  let botName = "";

  if (process.env.BOT_TOKEN) {
    try {
      const bot = createBot(baseUrl);

      const me = await bot.api.getMe();
      botUsername = me.username || "";
      botName = me.first_name || "";
      log(`Bot started as @${botUsername}`, "bot");

      bot.start({
        onStart: () => log("Bot polling started", "bot"),
      });
    } catch (err: any) {
      log(`Failed to start bot: ${err.message}`, "bot");
    }

    initMTProto().catch((err) => {
      log(`MTProto init error: ${err}`, "mtproto");
    });
  }

  app.get("/api/bot-info", (_req, res) => {
    res.json({ username: botUsername, name: botName });
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (err) {
      res.json({ totalFiles: 0, totalSize: 0, totalDownloads: 0 });
    }
  });

  app.get("/api/file/:id", async (req, res) => {
    try {
      const file = await storage.getFile(req.params.id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      res.json(file);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get("/dl/:id", (req, res) => serveFile(req, res, true));

  app.get("/stream/:id", (req, res) => serveFile(req, res, false));

  return httpServer;
}
