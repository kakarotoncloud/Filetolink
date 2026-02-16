# FileToLink Bot - Deployment Guide

A Telegram bot that converts files into direct download and stream links accessible from any browser.

## Prerequisites

- A Telegram Bot Token (get one from [@BotFather](https://t.me/BotFather))
- A PostgreSQL database
- Node.js 18+ installed

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | Yes | Your Telegram Bot Token from @BotFather |
| `API_ID` | Yes | Telegram API ID from [my.telegram.org](https://my.telegram.org) |
| `API_HASH` | Yes | Telegram API Hash from [my.telegram.org](https://my.telegram.org) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `BASE_URL` | Yes | Your app's public URL (e.g., `https://myapp.herokuapp.com`) |
| `PORT` | No | Port to run the server (default: `5000`) |
| `SESSION_SECRET` | No | Secret for session management |

---

## Option 1: Deploy to Heroku

### Step 1: Create a Heroku Account
1. Go to [heroku.com](https://heroku.com) and sign up
2. Install the Heroku CLI: [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

### Step 2: Prepare Your Repository
```bash
# Clone or download this project
git clone <your-repo-url>
cd filetolink-bot

# Make sure you're logged into Heroku
heroku login
```

### Step 3: Create the Heroku App
```bash
# Create a new Heroku app
heroku create your-app-name

# Add PostgreSQL addon (free tier available)
heroku addons:create heroku-postgresql:essential-0
```

### Step 4: Set Environment Variables
```bash
# Set your bot token
heroku config:set BOT_TOKEN=your_telegram_bot_token_here
heroku config:set API_ID=your_api_id_here
heroku config:set API_HASH=your_api_hash_here

# Set the base URL (use your Heroku app URL)
heroku config:set BASE_URL=https://your-app-name.herokuapp.com

# DATABASE_URL is automatically set by the PostgreSQL addon
```

### Step 5: Deploy
```bash
# Push to Heroku
git push heroku main

# Run database migration
heroku run npm run db:push
```

### Step 6: Verify
```bash
# Check logs
heroku logs --tail

# Open your app
heroku open
```

### Updating the App
```bash
git add .
git commit -m "Update"
git push heroku main
```

---

## Option 2: Deploy to VPS (Ubuntu/Debian)

### Step 1: Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (for reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Setup PostgreSQL Database
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE filetolink;
CREATE USER filetolink WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE filetolink TO filetolink;
\q
```

### Step 3: Clone and Install
```bash
# Clone your repository
cd /home/your_user
git clone <your-repo-url> filetolink-bot
cd filetolink-bot

# Install dependencies
npm install
```

### Step 4: Create Environment File
```bash
# Create .env file
cat > .env << 'EOF'
BOT_TOKEN=your_telegram_bot_token_here
API_ID=your_api_id_here
API_HASH=your_api_hash_here
DATABASE_URL=postgresql://filetolink:your_secure_password@localhost:5432/filetolink
BASE_URL=https://yourdomain.com
PORT=5000
NODE_ENV=production
EOF
```

### Step 5: Build the App
```bash
# Push database schema
npm run db:push

# Build production files
npm run build
```

### Step 6: Setup PM2 (Process Manager)
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'filetolink',
    script: 'dist/index.cjs',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 config so it auto-starts on reboot
pm2 save
pm2 startup
```

### Step 7: Setup Nginx (Reverse Proxy)
```bash
# Create Nginx config
sudo cat > /etc/nginx/sites-available/filetolink << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 2000M;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/filetolink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup SSL (Free with Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renew is set up automatically
```

### Step 9: Verify
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs filetolink

# Test the app
curl https://yourdomain.com/api/bot-info
```

### Updating on VPS
```bash
cd /home/your_user/filetolink-bot
git pull
npm install
npm run build
npm run db:push
pm2 restart filetolink
```

---

## Option 3: Deploy with Docker

### Dockerfile
Create a `Dockerfile` in the project root:
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Docker Compose (with PostgreSQL)
Create a `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - BOT_TOKEN=your_bot_token
      - API_ID=your_api_id
      - API_HASH=your_api_hash
      - DATABASE_URL=postgresql://filetolink:password@db:5432/filetolink
      - BASE_URL=https://yourdomain.com
      - PORT=5000
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: filetolink
      POSTGRES_PASSWORD: password
      POSTGRES_DB: filetolink
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Run with Docker
```bash
docker-compose up -d

# Run database migration
docker-compose exec app npm run db:push
```

---

## Troubleshooting

### Bot not responding
- Check that `BOT_TOKEN` is set correctly
- Look at logs: `heroku logs --tail` or `pm2 logs filetolink`
- Make sure no other instance of the bot is running (only one polling instance allowed)

### Files not downloading
- Telegram has a 20MB file download limit via Bot API
- For larger files, consider using Telegram's MTProto API
- Check that `BASE_URL` is set correctly and publicly accessible

### Database connection errors
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check that PostgreSQL is running
- Ensure the database user has proper permissions

### Heroku specific
- If the app sleeps (free tier), the first request after sleep may be slow
- Use `heroku ps:scale web=1` to ensure a dyno is running

### VPS specific
- Check firewall: `sudo ufw allow 80` and `sudo ufw allow 443`
- Ensure Nginx is running: `sudo systemctl status nginx`
- Check PM2: `pm2 status` and `pm2 logs`
