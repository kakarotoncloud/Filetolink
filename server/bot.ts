import { Bot, Context } from "grammy";
import { storage } from "./storage";
import { randomBytes } from "crypto";
import mime from "mime-types";
import { log } from "./index";

function generateId(): string {
  return randomBytes(8).toString("hex");
}

function getFileName(doc: any, fallback: string): string {
  return doc?.file_name || fallback;
}

function getMimeType(doc: any, fallback: string): string {
  return doc?.mime_type || fallback;
}

export function createBot(baseUrl: string): Bot {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    throw new Error("BOT_TOKEN environment variable is required");
  }

  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    const welcomeText = `Welcome to *FileToLink Bot*\\! 🤖

Send me any file and I'll give you:
📥 *Direct download link*
▶️ *Stream link* \\(for media files\\)

*Supported file types:*
• Documents \\(PDF, DOCX, etc\\.\\)
• Videos \\(MP4, MKV, etc\\.\\)
• Audio \\(MP3, FLAC, etc\\.\\)
• Photos \\(JPG, PNG, etc\\.\\)
• Archives \\(ZIP, RAR, etc\\.\\)
• Any other file type\\!

Just send or forward a file to get started\\.`;

    await ctx.reply(welcomeText, { parse_mode: "MarkdownV2" });
  });

  bot.command("help", async (ctx) => {
    await ctx.reply(
      `*How to use:*\n\n1\\. Send or forward any file to this bot\n2\\. Get instant download and stream links\n3\\. Share the links with anyone\\!\n\n*Commands:*\n/start \\- Welcome message\n/help \\- Show this help\n/about \\- About this bot`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.command("about", async (ctx) => {
    await ctx.reply(
      `*FileToLink Bot*\n\nConverts Telegram files into direct download and stream links\\.\n\nAnyone can access the files through a browser \\- no Telegram account needed\\!`,
      { parse_mode: "MarkdownV2" }
    );
  });

  async function handleFile(
    ctx: Context,
    fileId: string,
    fileUniqueId: string,
    fileName: string,
    fileSize: number,
    mimeType: string,
    fileType: string,
    thumbnailFileId?: string,
    duration?: number,
    width?: number,
    height?: number,
  ) {
    try {
      const id = generateId();
      const senderName = ctx.from
        ? [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(" ")
        : undefined;

      const chatId = ctx.chat?.id || null;
      const messageId = ctx.message?.message_id || null;

      await storage.createFile({
        id,
        fileId,
        fileUniqueId,
        fileName,
        fileSize,
        mimeType,
        fileType,
        thumbnailFileId: thumbnailFileId || null,
        senderName: senderName || null,
        senderId: ctx.from?.id || null,
        chatId,
        messageId,
        duration: duration || null,
        width: width || null,
        height: height || null,
      });

      const downloadLink = `${baseUrl}/dl/${id}`;
      const streamLink = `${baseUrl}/stream/${id}`;
      const pageLink = `${baseUrl}/file/${id}`;

      const isMedia = ["video", "audio", "photo"].includes(fileType) ||
        mimeType.startsWith("video/") ||
        mimeType.startsWith("audio/") ||
        mimeType.startsWith("image/");

      let messageText = `✅ *File Received\\!*\n\n`;
      messageText += `📁 *Name:* \`${escapeMarkdown(fileName)}\`\n`;
      messageText += `📦 *Size:* ${escapeMarkdown(formatBytes(fileSize))}\n`;
      messageText += `📄 *Type:* ${escapeMarkdown(mimeType)}\n\n`;
      messageText += `🔗 *Links:*\n`;
      messageText += `📥 [Download Link](${downloadLink})\n`;
      if (isMedia) {
        messageText += `▶️ [Stream Link](${streamLink})\n`;
      }
      messageText += `🌐 [View Page](${pageLink})`;

      await ctx.reply(messageText, {
        parse_mode: "MarkdownV2",
        link_preview_options: { is_disabled: true },
      });

      log(`File saved: ${fileName} (${id}) by ${senderName || "unknown"}`, "bot");
    } catch (err) {
      log(`Error handling file: ${err}`, "bot");
      await ctx.reply("Sorry, there was an error processing your file. Please try again.");
    }
  }

  bot.on("message:document", async (ctx) => {
    const doc = ctx.message.document;
    await handleFile(
      ctx,
      doc.file_id,
      doc.file_unique_id,
      getFileName(doc, "document"),
      doc.file_size || 0,
      getMimeType(doc, "application/octet-stream"),
      "document",
      doc.thumbnail?.file_id,
    );
  });

  bot.on("message:video", async (ctx) => {
    const video = ctx.message.video;
    const ext = mime.extension(video.mime_type || "video/mp4") || "mp4";
    await handleFile(
      ctx,
      video.file_id,
      video.file_unique_id,
      getFileName(video, `video_${Date.now()}.${ext}`),
      video.file_size || 0,
      getMimeType(video, "video/mp4"),
      "video",
      video.thumbnail?.file_id,
      video.duration,
      video.width,
      video.height,
    );
  });

  bot.on("message:animation", async (ctx) => {
    const anim = ctx.message.animation;
    await handleFile(
      ctx,
      anim.file_id,
      anim.file_unique_id,
      getFileName(anim, `animation_${Date.now()}.mp4`),
      anim.file_size || 0,
      getMimeType(anim, "video/mp4"),
      "video",
      anim.thumbnail?.file_id,
      anim.duration,
      anim.width,
      anim.height,
    );
  });

  bot.on("message:audio", async (ctx) => {
    const audio = ctx.message.audio;
    const ext = mime.extension(audio.mime_type || "audio/mpeg") || "mp3";
    const title = audio.title || `audio_${Date.now()}`;
    const performer = audio.performer ? `${audio.performer} - ` : "";
    await handleFile(
      ctx,
      audio.file_id,
      audio.file_unique_id,
      getFileName(audio, `${performer}${title}.${ext}`),
      audio.file_size || 0,
      getMimeType(audio, "audio/mpeg"),
      "audio",
      audio.thumbnail?.file_id,
      audio.duration,
    );
  });

  bot.on("message:voice", async (ctx) => {
    const voice = ctx.message.voice;
    await handleFile(
      ctx,
      voice.file_id,
      voice.file_unique_id,
      `voice_${Date.now()}.ogg`,
      voice.file_size || 0,
      getMimeType(voice, "audio/ogg"),
      "audio",
      undefined,
      voice.duration,
    );
  });

  bot.on("message:video_note", async (ctx) => {
    const vn = ctx.message.video_note;
    await handleFile(
      ctx,
      vn.file_id,
      vn.file_unique_id,
      `video_note_${Date.now()}.mp4`,
      vn.file_size || 0,
      "video/mp4",
      "video",
      vn.thumbnail?.file_id,
      vn.duration,
      vn.length,
      vn.length,
    );
  });

  bot.on("message:photo", async (ctx) => {
    const photos = ctx.message.photo;
    const photo = photos[photos.length - 1];
    await handleFile(
      ctx,
      photo.file_id,
      photo.file_unique_id,
      `photo_${Date.now()}.jpg`,
      photo.file_size || 0,
      "image/jpeg",
      "photo",
      undefined,
      undefined,
      photo.width,
      photo.height,
    );
  });

  bot.on("message:sticker", async (ctx) => {
    const sticker = ctx.message.sticker;
    const isAnimated = sticker.is_animated;
    const isVideo = sticker.is_video;
    const ext = isVideo ? "webm" : isAnimated ? "tgs" : "webp";
    await handleFile(
      ctx,
      sticker.file_id,
      sticker.file_unique_id,
      `sticker_${Date.now()}.${ext}`,
      sticker.file_size || 0,
      isVideo ? "video/webm" : `image/${ext}`,
      isVideo ? "video" : "photo",
      sticker.thumbnail?.file_id,
      undefined,
      sticker.width,
      sticker.height,
    );
  });

  bot.catch((err) => {
    log(`Bot error: ${err.message}`, "bot");
  });

  return bot;
}

function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
