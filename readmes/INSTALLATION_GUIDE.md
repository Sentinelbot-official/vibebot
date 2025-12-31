# Vibe Bot v2.1.0 - Installation & Setup Guide

**Last Updated:** December 31, 2025

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- A **Discord Bot Token** (from Discord Developer Portal)
- A **Discord Application Client ID**

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sentinelbot-official/vibebot.git
cd vibebot
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `discord.js` v14.25.1
- `better-sqlite3` v11.8.1
- `dotenv` v17.2.3
- `ms` v2.1.3
- `prettier` v3.7.4 (dev)

### 3. Create Environment File

Create a `.env` file in the root directory:

```env
# Required
TOKEN=your_discord_bot_token_here
CLIENT_ID=your_application_client_id_here

# Optional
PREFIX=!
NODE_ENV=production
LOG_LEVEL=info
MAX_COMMANDS_PER_MINUTE=30
ENABLE_METRICS=false
```

### 4. Configure Bot Settings

Edit `bot.config.json` if needed:

```json
{
  "name": "Vibe Bot",
  "version": "2.1.0",
  "colors": {
    "primary": "#0099ff",
    "success": "#00ff00",
    "warning": "#ffa500",
    "error": "#ff0000",
    "economy": "#ffd700"
  }
}
```

### 5. Start the Bot

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

---

## 🔧 Discord Developer Portal Setup

### 1. Create Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application
4. Go to the "Bot" section
5. Click "Add Bot"

### 2. Get Bot Token

1. In the Bot section, click "Reset Token"
2. Copy the token (you'll only see it once!)
3. Add it to your `.env` file as `TOKEN`

### 3. Get Client ID

1. Go to "General Information"
2. Copy the "Application ID"
3. Add it to your `.env` file as `CLIENT_ID`

### 4. Enable Intents

In the Bot section, enable these **Privileged Gateway Intents**:

- ✅ **Presence Intent**
- ✅ **Server Members Intent**
- ✅ **Message Content Intent**

### 5. Set Bot Permissions

Recommended permissions integer: `8` (Administrator)

Or select specific permissions:
- Manage Roles
- Manage Channels
- Kick Members
- Ban Members
- Manage Messages
- Moderate Members
- Read Messages/View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Add Reactions
- Use External Emojis
- Connect (Voice)
- Speak (Voice)
- Move Members (Voice)

### 6. Generate Invite Link

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot
```

Replace `YOUR_CLIENT_ID` with your actual client ID.

---

## 📁 Project Structure

```
vibebot/
├── commands/           # All bot commands
│   ├── admin/         # Admin commands (15)
│   ├── economy/       # Economy commands (18)
│   ├── fun/           # Fun commands (14)
│   ├── general/       # General commands (7)
│   ├── giveaway/      # Giveaway commands (3)
│   ├── leveling/      # Leveling commands (4)
│   ├── moderation/    # Moderation commands (19)
│   ├── social/        # Social commands (7)
│   └── utility/       # Utility commands (52)
├── events/            # Event handlers (30+)
├── utils/             # Utility modules (16)
├── data/              # Database files (auto-created)
├── backups/           # Database backups (auto-created)
├── logs/              # Log files (auto-created)
├── readmes/           # Documentation
├── index.js           # Main entry point
├── package.json       # Dependencies
├── bot.config.json    # Bot configuration
└── .env               # Environment variables (create this)
```

---

## 🗄️ Database

The bot uses **SQLite3** with automatic:
- Database creation on first run
- Backups every 6 hours
- WAL mode for better performance

Database file: `data/database.db`

### Collections

- `kv_store` - Key-value storage
- `users` - User data
- `guilds` - Guild data
- `economy` - Economy system
- `leveling` - XP and levels
- `warns` - Warning system
- `marriages` - Marriage system
- `reputation` - Reputation points
- `profiles` - User profiles
- `pets` - Virtual pets
- `voice_stats` - Voice XP tracking
- `guild_settings` - Server settings
- `role_menus` - Role menu configs

---

## ⚙️ Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TOKEN` | ✅ Yes | - | Discord bot token |
| `CLIENT_ID` | ✅ Yes | - | Discord application ID |
| `PREFIX` | ❌ No | `!` | Command prefix |
| `NODE_ENV` | ❌ No | `production` | Environment mode |
| `LOG_LEVEL` | ❌ No | `info` | Logging level |
| `MAX_COMMANDS_PER_MINUTE` | ❌ No | `30` | Rate limit |
| `ENABLE_METRICS` | ❌ No | `false` | Enable metrics |

### Bot Config (bot.config.json)

```json
{
  "name": "Your Bot Name",
  "version": "2.1.0",
  "colors": {
    "primary": "#0099ff",
    "success": "#00ff00",
    "warning": "#ffa500",
    "error": "#ff0000",
    "economy": "#ffd700"
  }
}
```

---

## 🎮 First Commands

After inviting the bot, try these commands:

```
!help                    # View all commands
!ping                    # Check bot latency
!serverinfo              # View server info
!botinfo                 # View bot statistics
!setprefix <prefix>      # Change command prefix (admin)
```

---

## 🔧 Admin Setup

### 1. Set Custom Prefix

```
!setprefix ?
```

### 2. Configure Logging

```
!setlogs #logs-channel
```

### 3. Setup Welcome Messages

```
!setwelcome #welcome-channel Welcome {user}!
```

### 4. Setup Auto-Roles

```
!autorole add @Member
```

### 5. Configure Auto-Moderation

```
!automod enable
!automod config spam true
!automod config links true
```

### 6. Setup Word Filter

```
!wordfilter add badword
```

### 7. Setup Role Menu

```
!rolemenu create Color Roles | Choose your color! | @Red:🔴:Red | @Blue:🔵:Blue
```

---

## 🐛 Troubleshooting

### Bot Won't Start

**Error: Missing environment variables**
- Solution: Create `.env` file with `TOKEN` and `CLIENT_ID`

**Error: Invalid token**
- Solution: Regenerate token in Discord Developer Portal

**Error: Cannot find module**
- Solution: Run `npm install`

### Bot Not Responding

**Commands don't work**
- Check prefix with `@BotName prefix`
- Ensure bot has "Read Messages" permission
- Check Message Content Intent is enabled

**Bot offline**
- Check console for errors
- Verify token is correct
- Check internet connection

### Permission Errors

**Bot can't kick/ban**
- Ensure bot role is higher than target role
- Check bot has required permissions
- Verify bot role isn't restricted

### Database Issues

**Database locked**
- Close other instances of the bot
- Check file permissions

**Corrupted database**
- Restore from `backups/` folder
- Copy backup to `data/database.db`

---

## 📊 Monitoring

### View Logs

```bash
tail -f logs/$(date +%Y-%m-%d).log
```

### Health Check

```bash
npm run health
```

### Create Manual Backup

```bash
npm run db:backup
```

---

## 🔄 Updating

### Pull Latest Changes

```bash
git pull origin main
npm install
```

### Restart Bot

```bash
# Stop current instance (Ctrl+C)
npm start
```

---

## 🚀 Production Deployment

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start index.js --name vibebot

# View logs
pm2 logs vibebot

# Restart
pm2 restart vibebot

# Auto-start on boot
pm2 startup
pm2 save
```

### Using Docker

```bash
# Build image
docker build -t vibebot .

# Run container
docker run -d --name vibebot \
  --env-file .env \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/backups:/app/backups \
  -v $(pwd)/logs:/app/logs \
  vibebot

# View logs
docker logs -f vibebot
```

### Using systemd

Create `/etc/systemd/system/vibebot.service`:

```ini
[Unit]
Description=Vibe Bot Discord Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/vibebot
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable vibebot
sudo systemctl start vibebot
sudo systemctl status vibebot
```

---

## 📚 Additional Resources

- [Discord.js Guide](https://discordjs.guide/)
- [Discord Developer Portal](https://discord.com/developers)
- [Bot Documentation](./COMPLETE_FEATURES.md)
- [Feature List](./V2.1_PROGRESS.md)

---

## 💡 Tips

1. **Backup Regularly** - Backups are automatic, but manual backups are good too
2. **Monitor Logs** - Check logs daily for errors
3. **Update Dependencies** - Run `npm update` monthly
4. **Test in Dev Server** - Test new features before production
5. **Read Changelogs** - Check `CHANGELOG.md` before updating

---

## 🆘 Getting Help

- **GitHub Issues**: [Report bugs](https://github.com/Sentinelbot-official/vibebot/issues)
- **Email**: vibetbot0@proton.me
- **Discord**: Support server (coming soon)

---

**Built with ❤️ by Airis and the Community**
