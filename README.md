# FileToLink Telegram Bot

A Telegram bot that converts files shared via Telegram into direct download and stream links accessible from any browser. Supports files up to **2GB** with high-speed downloads, pause/resume support, and built-in media streaming.

## Features

- **All File Types** - Documents, videos, audio, photos, stickers, voice messages, video notes, animations
- **Large Files up to 2GB** - Uses MTProto (Telegram's native protocol) for files beyond the 20MB Bot API limit
- **High-Speed Downloads** - Parallel chunk downloading with 1MB chunks and 16 concurrent workers
- **Pause & Resume** - Full HTTP Range request support on all download and stream endpoints
- **Media Streaming** - Built-in video and audio players with seek support
- **Direct Links** - Shareable download and stream links for any file
- **Beautiful Web UI** - Modern React frontend with file info, media preview, and one-click downloads

## Screenshots

Send any file to the bot on Telegram and receive instant download/stream links that work in any browser.

## Tech Stack

- **Frontend**: React + Vite, shadcn/ui, TailwindCSS
- **Backend**: Express.js
- **Bot**: Grammy (Telegram Bot Framework)
- **Large Files**: GramJS (MTProto)
- **Database**: PostgreSQL + Drizzle ORM

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- API ID & Hash from [my.telegram.org](https://my.telegram.org)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/filetolink-bot.git
cd filetolink-bot

# Install dependencies
npm install

# Set environment variables
export BOT_TOKEN=your_bot_token
export API_ID=your_api_id
export API_HASH=your_api_hash
export DATABASE_URL=postgresql://user:password@localhost:5432/filetolink
export BASE_URL=https://yourdomain.com

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Telegram Bot Token from @BotFather |
| `API_ID` | Yes | Telegram API ID from [my.telegram.org](https://my.telegram.org) |
| `API_HASH` | Yes | Telegram API Hash from [my.telegram.org](https://my.telegram.org) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BASE_URL` | Yes | Public URL of the app |
| `PORT` | No | Server port (default: 5000) |

## API Endpoints

| Route | Description |
|-------|-------------|
| `GET /` | Landing page |
| `GET /file/:id` | File info page with download/stream UI |
| `GET /dl/:id` | Direct file download (supports Range requests) |
| `GET /stream/:id` | File streaming (supports Range requests) |
| `GET /api/file/:id` | File metadata JSON |
| `GET /api/stats` | Bot statistics |
| `GET /api/bot-info` | Bot username/name |

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment guides:

- **Heroku** - One-click cloud deployment
- **VPS (Ubuntu/Debian)** - Self-hosted with Nginx + SSL
- **Docker** - Container-based deployment with Docker Compose

## How It Works

1. User sends a file to the Telegram bot
2. Bot stores file metadata (ID, size, type) in PostgreSQL
3. Bot replies with a direct web link
4. When someone opens the link, the server fetches the file from Telegram and streams it to the browser
5. For files under 20MB, uses Telegram Bot API; for larger files, uses MTProto with parallel downloads

## License

MIT
