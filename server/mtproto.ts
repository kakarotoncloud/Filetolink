import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import bigInt from "big-integer";
import { log } from "./index";
import { storage } from "./storage";

let client: TelegramClient | null = null;
let clientReady = false;

const MAX_CHUNK_SIZE = 1024 * 1024;
const DOWNLOAD_WORKERS = 16;
const SESSION_KEY = "mtproto_session";

async function loadSession(): Promise<string> {
  try {
    const saved = await storage.getSetting(SESSION_KEY);
    if (saved) {
      log("Loaded saved MTProto session from database", "mtproto");
      return saved;
    }
  } catch (err: any) {
    log(`Failed to load session: ${err.message}`, "mtproto");
  }
  return "";
}

async function saveSession(sessionString: string): Promise<void> {
  try {
    await storage.setSetting(SESSION_KEY, sessionString);
    log("Saved MTProto session to database", "mtproto");
  } catch (err: any) {
    log(`Failed to save session: ${err.message}`, "mtproto");
  }
}

export async function initMTProto(): Promise<boolean> {
  const apiId = parseInt(process.env.API_ID || "0", 10);
  const apiHash = process.env.API_HASH || "";
  const botToken = process.env.BOT_TOKEN || "";

  if (!apiId || !apiHash || !botToken) {
    log("MTProto: Missing API_ID, API_HASH, or BOT_TOKEN - large file downloads disabled", "mtproto");
    return false;
  }

  try {
    const savedSessionStr = await loadSession();
    const session = new StringSession(savedSessionStr);
    client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
      autoReconnect: true,
      useWSS: false,
    });

    await client.start({
      botAuthToken: botToken,
    });

    const newSessionStr = client.session.save() as unknown as string;
    if (newSessionStr && newSessionStr !== savedSessionStr) {
      await saveSession(newSessionStr);
    }

    clientReady = true;
    log(`MTProto client initialized - large file downloads enabled (up to 2GB, ${DOWNLOAD_WORKERS} workers, ${MAX_CHUNK_SIZE / 1024}KB chunks)`, "mtproto");
    return true;
  } catch (err: any) {
    log(`MTProto init failed: ${err.message}`, "mtproto");
    clientReady = false;

    if (err.message && err.message.includes("wait of")) {
      const match = err.message.match(/wait of (\d+) seconds/i);
      const waitSecs = match ? parseInt(match[1], 10) : 300;
      log(`MTProto rate-limited, will retry in ${waitSecs + 10} seconds...`, "mtproto");
      setTimeout(() => {
        initMTProto().catch((e) => log(`MTProto retry failed: ${e}`, "mtproto"));
      }, (waitSecs + 10) * 1000);
    }

    return false;
  }
}

export function isMTProtoReady(): boolean {
  return clientReady && client !== null;
}

export async function streamFileFromMessage(
  chatId: number,
  messageId: number,
  onChunk: (chunk: Buffer) => boolean | void | Promise<boolean | void>,
  offset?: number,
  limit?: number,
): Promise<boolean> {
  if (!client || !clientReady) return false;

  try {
    const messages = await client.getMessages(chatId, { ids: messageId });
    if (!messages || messages.length === 0 || !messages[0]?.media) {
      log(`MTProto: Message ${messageId} in chat ${chatId} not found or has no media`, "mtproto");
      return false;
    }

    const msg = messages[0];

    const alignedOffset = offset ? Math.floor(offset / MAX_CHUNK_SIZE) * MAX_CHUNK_SIZE : 0;
    const skipBytes = offset ? offset - alignedOffset : 0;

    const downloadIterator = client.iterDownload({
      file: msg.media!,
      requestSize: MAX_CHUNK_SIZE,
      offset: alignedOffset ? bigInt(alignedOffset) : undefined,
      limit: limit ? limit : undefined,
      workers: DOWNLOAD_WORKERS,
    } as any);

    let isFirstChunk = true;
    for await (const chunk of downloadIterator) {
      let buf = Buffer.from(chunk);

      if (isFirstChunk && skipBytes > 0) {
        buf = buf.subarray(skipBytes);
        isFirstChunk = false;
      } else {
        isFirstChunk = false;
      }

      if (buf.length === 0) continue;

      const result = await onChunk(buf);
      if (result === false) break;
    }

    return true;
  } catch (err: any) {
    log(`MTProto stream error: ${err.message}`, "mtproto");
    return false;
  }
}

export function getClient(): TelegramClient | null {
  return client;
}
