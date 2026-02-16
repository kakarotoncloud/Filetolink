# FileToLink Bot - Complete Deployment Guide

This guide is written for **absolute beginners** - no coding experience needed. Just follow each step exactly as written.

---

## Table of Contents

- [Before You Start - Get Your Keys](#before-you-start---get-your-keys)
- [Option 1: Deploy to Heroku](#option-1-deploy-to-heroku-easiest)
- [Option 2: Deploy to VPS](#option-2-deploy-to-vps-ubuntudebian)
- [Option 3: Deploy with Docker](#option-3-deploy-with-docker)
- [Option 4: Deploy via Google Colab](#option-4-deploy-via-google-colab-one-click)
- [Troubleshooting](#troubleshooting)

---

## Before You Start - Get Your Keys

You need **3 things** from Telegram before deploying. Get them all first, then start deploying.

### 1. Get Your Bot Token (from BotFather)

1. Open Telegram on your phone or computer
2. Search for **@BotFather** in the search bar and open the chat
3. Send the message: `/newbot`
4. BotFather will ask you for a **name** - type any name you want (example: `My File Bot`)
5. BotFather will ask you for a **username** - this must end with `bot` (example: `myfile_dl_bot`)
6. BotFather will give you a **Bot Token** - it looks like this: `7123456789:AAHx2kjd8s9dh3kJHD9sdkj`
7. **Copy this token and save it somewhere safe** - you'll need it later

### 2. Get Your API ID and API Hash (from Telegram)

1. Open your browser and go to: **https://my.telegram.org**
2. Enter your phone number (with country code, like +91xxxxxxxxxx)
3. Telegram will send you a code in the Telegram app - enter it on the website
4. Click on **"API development tools"**
5. Fill in the form:
   - **App title**: anything (example: `FileToLink`)
   - **Short name**: anything (example: `filetolink`)
   - **Platform**: choose `Other`
6. Click **Create Application**
7. You'll see two important values:
   - **App api_id**: a number like `12345678` - **save this**
   - **App api_hash**: a long text like `a1b2c3d4e5f6g7h8i9j0k1l2m3` - **save this**

### 3. Summary of What You Need

| Key | Example | Where You Got It |
|-----|---------|-----------------|
| Bot Token | `7123456789:AAHx2...` | @BotFather on Telegram |
| API ID | `12345678` | my.telegram.org |
| API Hash | `a1b2c3d4e5f6...` | my.telegram.org |

**Keep these values handy - you'll paste them during deployment.**

---

## Option 1: Deploy to Heroku (Easiest)

Heroku is a cloud platform that runs your bot 24/7. It's the easiest option if you don't have your own server.

### Important: Heroku Rules (Read This First)

- Heroku is a **paid service** - the cheapest plan (Eco) costs ~$5/month
- Your bot is a **legitimate web application** that serves files - this is 100% allowed on Heroku
- Heroku automatically provides a database and SSL (https) for you
- The bot runs 24/7 without needing your computer to be on

### Step 1: Create a Heroku Account

1. Go to **https://heroku.com** in your browser
2. Click **"Sign Up"** in the top right corner
3. Fill in your details (name, email, etc.)
4. Choose **"Student"** or **"Hobbyist"** as your role
5. Verify your email address
6. Log in to your new account
7. **Add a payment method** - Go to Account Settings > Billing > Add a credit card
   - This is required even for the cheapest plan
   - You won't be charged until you create an app

### Step 2: Install Heroku on Your Computer

**For Windows:**
1. Go to **https://devcenter.heroku.com/articles/heroku-cli**
2. Click the **Windows** download button
3. Run the installer - click Next, Next, Next, Install
4. Open **Command Prompt** (search "cmd" in Start menu)
5. Type `heroku --version` and press Enter - you should see a version number

**For Mac:**
1. Open **Terminal** (search "Terminal" in Spotlight)
2. Paste this and press Enter:
   ```
   brew tap heroku/brew && brew install heroku
   ```
3. Type `heroku --version` and press Enter to verify

**For Linux:**
1. Open Terminal
2. Paste this and press Enter:
   ```
   curl https://cli-assets.heroku.com/install.sh | sh
   ```

### Step 3: Install Node.js and Git

**You also need Node.js and Git installed.**

**Node.js:**
1. Go to **https://nodejs.org**
2. Download the **LTS** version (the green button)
3. Run the installer - click Next, Next, Next, Install
4. Open Command Prompt and type `node --version` - you should see a number like `v20.x.x`

**Git:**
1. Go to **https://git-scm.com/downloads**
2. Download for your system and install it
3. Open Command Prompt and type `git --version` - you should see a version number

### Step 4: Download the Bot Code

1. Open Command Prompt (or Terminal on Mac/Linux)
2. Type these commands one by one (press Enter after each):

```
git clone https://github.com/kakarotoncloud/Filetolink.git
```

```
cd Filetolink
```

This downloads the bot code to your computer.

### Step 5: Login to Heroku

1. In the same Command Prompt, type:
```
heroku login
```
2. It will open your browser - click **"Log In"**
3. Go back to Command Prompt - it should say you're logged in

### Step 6: Create Your Heroku App

Type these commands one by one:

```
heroku create your-app-name
```
Replace `your-app-name` with a unique name (lowercase, no spaces). Example: `myfilebot-2024`

**If it says the name is taken, try a different name.**

### Step 7: Add a Database

```
heroku addons:create heroku-postgresql:essential-0 --app your-app-name
```
Replace `your-app-name` with the name you chose above.

This creates a database for your bot. It costs ~$5/month.

### Step 8: Set Your Bot's Keys

Now paste your keys. Replace the values with your actual keys from the "Before You Start" section:

```
heroku config:set BOT_TOKEN=your_bot_token_here --app your-app-name
```

```
heroku config:set API_ID=your_api_id_here --app your-app-name
```

```
heroku config:set API_HASH=your_api_hash_here --app your-app-name
```

```
heroku config:set BASE_URL=https://your-app-name.herokuapp.com --app your-app-name
```

```
heroku config:set NODE_ENV=production --app your-app-name
```

### Step 9: Deploy the Bot

```
heroku buildpacks:set heroku/nodejs --app your-app-name
```

```
git push heroku main
```

**This will take 2-3 minutes.** You'll see a lot of text scrolling - that's normal. Wait until it says "deployed" or "Verifying deploy... done."

### Step 10: Set Up the Database

```
heroku run npm run db:push --app your-app-name
```

This creates the necessary tables in your database. You should see "Changes applied" in the output.

### Step 11: Start the Bot

```
heroku ps:scale web=1 --app your-app-name
```

### Step 12: Check If It's Working

```
heroku logs --tail --app your-app-name
```

Look for these lines in the output:
- `Bot started as @yourbotname` - means the bot is running
- `MTProto client initialized` - means large file downloads work
- `serving on port 5000` - means the website is working

**Press Ctrl+C to stop watching logs.**

### Step 13: Test Your Bot

1. Open Telegram and find your bot (search for the username you created with BotFather)
2. Send it any file (photo, video, document, etc.)
3. The bot should reply with a download link
4. Open the link in your browser - you should see a download page

**Congratulations! Your bot is now running 24/7 on Heroku!**

### How to Update Your Bot Later

If there's an update to the bot code:
```
cd Filetolink
git pull origin main
git push heroku main
```

### How to Check Your Bot's Status

```
heroku ps --app your-app-name
heroku logs --tail --app your-app-name
```

### How to Stop Your Bot

```
heroku ps:scale web=0 --app your-app-name
```

### How to Restart Your Bot

```
heroku restart --app your-app-name
```

---

## Option 2: Deploy to VPS (Ubuntu/Debian)

A VPS (Virtual Private Server) is a remote computer you rent. This gives you full control over your bot. Popular VPS providers:

- **Oracle Cloud** - has a free tier (always free)
- **DigitalOcean** - starts at $4/month
- **Vultr** - starts at $3.50/month
- **Hetzner** - starts at ~$4/month
- **AWS Lightsail** - starts at $3.50/month

### What You Need
- A VPS running **Ubuntu 22.04** or **Ubuntu 24.04** (choose this when creating your VPS)
- A way to connect to your VPS (usually SSH)
- Optionally, a domain name (like mybotsite.com)

### Step 1: Connect to Your VPS

**On Windows:**
1. Download **PuTTY** from https://putty.org
2. Open PuTTY
3. In "Host Name" field, paste your VPS's **IP address** (you get this from your VPS provider)
4. Click "Open"
5. Login with username `root` and the password your VPS provider gave you

**On Mac/Linux:**
1. Open Terminal
2. Type: `ssh root@YOUR_VPS_IP_ADDRESS`
3. Enter the password when asked

### Step 2: Update Your Server

Once connected, paste these commands one at a time and press Enter:

```
sudo apt update
```

```
sudo apt upgrade -y
```

This updates your server's software. Wait until each command finishes before typing the next.

### Step 3: Install Node.js

```
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

```
sudo apt install -y nodejs
```

Verify it worked:
```
node --version
```
You should see something like `v20.x.x`

### Step 4: Install PostgreSQL (Database)

```
sudo apt install -y postgresql postgresql-contrib
```

Now create a database for your bot:

```
sudo -u postgres psql
```

This opens the database program. Now type these commands inside it (one at a time):

```sql
CREATE DATABASE filetolink;
```

```sql
CREATE USER filetolinkuser WITH PASSWORD 'MAKE_UP_A_STRONG_PASSWORD_HERE';
```

**Replace `MAKE_UP_A_STRONG_PASSWORD_HERE` with an actual password you make up** (example: `MyStr0ngP@ss2024`). Remember this password!

```sql
GRANT ALL PRIVILEGES ON DATABASE filetolink TO filetolinkuser;
```

```sql
ALTER DATABASE filetolink OWNER TO filetolinkuser;
```

```sql
\q
```

The last command (`\q`) exits the database program.

### Step 5: Install Other Required Tools

```
sudo apt install -y git nginx
```

```
sudo npm install -g pm2
```

- **git** = downloads the bot code
- **nginx** = makes your bot accessible on the internet
- **pm2** = keeps your bot running 24/7, even if it crashes

### Step 6: Download the Bot Code

```
cd /home
```

```
git clone https://github.com/kakarotoncloud/Filetolink.git filetolink-bot
```

```
cd filetolink-bot
```

```
npm install
```

The last command installs all the bot's dependencies. This takes 1-2 minutes.

### Step 7: Set Up Your Configuration

Create a settings file with your keys:

```
nano .env
```

This opens a text editor. Paste the following (replace the values with your actual keys):

```
BOT_TOKEN=your_bot_token_from_botfather
API_ID=your_api_id_from_telegram
API_HASH=your_api_hash_from_telegram
DATABASE_URL=postgresql://filetolinkuser:YOUR_PASSWORD@localhost:5432/filetolink
BASE_URL=http://YOUR_VPS_IP_ADDRESS
PORT=5000
NODE_ENV=production
```

**Replace:**
- `your_bot_token_from_botfather` with your actual Bot Token
- `your_api_id_from_telegram` with your actual API ID
- `your_api_hash_from_telegram` with your actual API Hash
- `YOUR_PASSWORD` with the database password you created in Step 4
- `YOUR_VPS_IP_ADDRESS` with your VPS's IP address

**To save the file:**
1. Press `Ctrl+X`
2. Press `Y` (for yes)
3. Press `Enter`

### Step 8: Set Up the Database Tables

```
npm run db:push
```

This creates the necessary tables in your database. You should see "Changes applied" or similar success message.

### Step 9: Build the Bot

```
npm run build
```

This prepares the bot for production. Wait until it finishes (about 30 seconds).

### Step 10: Start the Bot with PM2

First, create a PM2 configuration file:

```
nano ecosystem.config.cjs
```

Paste this:

```javascript
module.exports = {
  apps: [{
    name: 'filetolink',
    script: 'dist/index.cjs',
    env_file: '.env',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M'
  }]
};
```

Save the file (Ctrl+X, Y, Enter).

Now start the bot:

```
pm2 start ecosystem.config.cjs
```

Make it auto-start when the server reboots:

```
pm2 save
```

```
pm2 startup
```

If `pm2 startup` shows you a command to copy and run, do that.

Check if it's running:
```
pm2 status
```

You should see `filetolink` with status `online`. If you see `errored`, check the logs:
```
pm2 logs filetolink
```

### Step 11: Set Up Nginx (Makes Your Bot Accessible on the Internet)

```
sudo nano /etc/nginx/sites-available/filetolink
```

Paste this (replace `YOUR_VPS_IP_ADDRESS` with your actual IP):

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP_ADDRESS;

    client_max_body_size 2000M;

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
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
}
```

Save the file (Ctrl+X, Y, Enter).

Now activate it:

```
sudo ln -sf /etc/nginx/sites-available/filetolink /etc/nginx/sites-enabled/
```

```
sudo rm -f /etc/nginx/sites-enabled/default
```

```
sudo nginx -t
```

You should see `syntax is ok` and `test is successful`. If not, check for typos in the file.

```
sudo systemctl restart nginx
```

```
sudo systemctl enable nginx
```

### Step 12: Open the Firewall

```
sudo ufw allow 22
```

```
sudo ufw allow 80
```

```
sudo ufw allow 443
```

```
sudo ufw enable
```

When it asks "are you sure", type `y` and press Enter.

### Step 13: Test Your Bot

1. Open your browser and go to: `http://YOUR_VPS_IP_ADDRESS`
2. You should see the FileToLink landing page
3. Open Telegram and send a file to your bot
4. You should get a download link that works in any browser

### (Optional) Step 14: Add a Domain Name with Free SSL

If you have a domain name (like `mybotsite.com`), you can set it up with free HTTPS:

**First, point your domain to your VPS:**
1. Go to your domain registrar (where you bought the domain)
2. Find DNS settings
3. Add an **A record** pointing to your VPS IP address
4. Wait 5-30 minutes for it to take effect

**Then, update your Nginx config:**
```
sudo nano /etc/nginx/sites-available/filetolink
```
Change the `server_name` line from your IP to your domain:
```
server_name mybotsite.com;
```
Save and restart nginx:
```
sudo nginx -t && sudo systemctl restart nginx
```

**Install free SSL certificate:**
```
sudo apt install -y certbot python3-certbot-nginx
```

```
sudo certbot --nginx -d mybotsite.com
```

Follow the prompts (enter your email, agree to terms). Certbot will automatically configure HTTPS for you.

**Update your .env file with the new URL:**
```
nano /home/filetolink-bot/.env
```
Change `BASE_URL` to:
```
BASE_URL=https://mybotsite.com
```
Save and restart:
```
pm2 restart filetolink
```

### Useful VPS Commands

| What you want to do | Command |
|---------------------|---------|
| Check if bot is running | `pm2 status` |
| See bot logs (live) | `pm2 logs filetolink` |
| Restart the bot | `pm2 restart filetolink` |
| Stop the bot | `pm2 stop filetolink` |
| Start the bot | `pm2 start filetolink` |
| Update the bot | See "How to Update" below |

### How to Update Your Bot on VPS

```
cd /home/filetolink-bot
git pull origin main
npm install
npm run build
npm run db:push
pm2 restart filetolink
```

---

## Option 3: Deploy with Docker

Docker is for users who already know what Docker is. If you don't, use Option 1 (Heroku) or Option 2 (VPS) instead.

### Prerequisites
- Docker and Docker Compose installed on your server
- Your Telegram keys (Bot Token, API ID, API Hash)

### Step 1: Clone the Repository

```
git clone https://github.com/kakarotoncloud/Filetolink.git
cd Filetolink
```

### Step 2: Edit Docker Compose

```
nano docker-compose.yml
```

Replace the placeholder values with your actual keys:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - BOT_TOKEN=your_bot_token_here
      - API_ID=your_api_id_here
      - API_HASH=your_api_hash_here
      - DATABASE_URL=postgresql://filetolink:password@db:5432/filetolink
      - BASE_URL=https://yourdomain.com
      - PORT=5000
      - NODE_ENV=production
    depends_on:
      - db
    restart: always

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: filetolink
      POSTGRES_PASSWORD: password
      POSTGRES_DB: filetolink
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always

volumes:
  pgdata:
```

### Step 3: Deploy

```
docker-compose up -d
```

```
docker-compose exec app npm run db:push
```

### Step 4: Verify

```
docker-compose logs -f app
```

Look for `Bot started` and `MTProto client initialized`.

---

## Option 4: Deploy via Google Colab (One Click)

If you want to deploy to Heroku without installing anything on your computer, you can use Google Colab.

1. Open the notebook: [Deploy_to_Heroku.ipynb](Deploy_to_Heroku.ipynb) in this repository
2. Click **"Open in Colab"** button at the top
3. Fill in your keys in Step 1
4. Click **Runtime > Run all** to deploy

Everything happens in your browser - no installations needed.

---

## Troubleshooting

### "Bot not responding to messages"

- **Check your Bot Token** - Make sure you copied it correctly from BotFather
- **Check logs** - Use `heroku logs --tail` or `pm2 logs filetolink` to see error messages
- **Only one instance** - Make sure your bot isn't running in two places at once (it can only run in one place)

### "Download links don't work" or "File not found"

- **Check BASE_URL** - This must be the exact URL where your app is accessible
  - Heroku: `https://your-app-name.herokuapp.com`
  - VPS: `http://YOUR_IP` or `https://yourdomain.com`
- **Check if the app is running** - Visit your BASE_URL in a browser, you should see the landing page

### "Large files (over 20MB) don't download"

- This means MTProto didn't connect. Check logs for `MTProto init failed`
- **Make sure API_ID and API_HASH are correct** - These are numbers and text from my.telegram.org
- **Rate limited** - If you see "wait of X seconds", just wait - the bot will auto-retry

### "Database connection error"

- **Heroku**: The database URL is set automatically. Run `heroku config --app your-app-name` to check
- **VPS**: Make sure PostgreSQL is running: `sudo systemctl status postgresql`
- **Check password**: Make sure the password in DATABASE_URL matches what you created

### "App crashes on Heroku"

- Run `heroku logs --tail --app your-app-name` to see the error
- Try restarting: `heroku restart --app your-app-name`
- Make sure all environment variables are set: `heroku config --app your-app-name`

### "Nginx shows 502 Bad Gateway" (VPS only)

- The bot isn't running. Check: `pm2 status`
- If it shows `errored`, check logs: `pm2 logs filetolink`
- Restart it: `pm2 restart filetolink`

### "SSL certificate error" (VPS only)

- Make sure your domain's DNS is pointing to your VPS IP
- Wait 30 minutes after changing DNS, then try certbot again
- Check if port 80 and 443 are open: `sudo ufw status`

---

## Monthly Costs Summary

| Platform | Cost | What You Get |
|----------|------|-------------|
| Heroku (Eco + DB) | ~$10/month | Fully managed, automatic SSL, easy setup |
| Oracle Cloud VPS | Free | Free tier forever, full control |
| DigitalOcean VPS | ~$4/month | Good performance, full control |
| Vultr VPS | ~$3.50/month | Cheap, full control |
| Replit Reserved VM | ~$7/month | Easy setup, managed platform |

---

## Need Help?

If you're stuck, check the [Issues](https://github.com/kakarotoncloud/Filetolink/issues) page on GitHub or create a new issue describing your problem.
