# 🚀 Bot Features

## ✅ Completed Features

### 🛡️ Moderation System

- **Warn System** - Warn users with auto-escalation (3 warns = timeout, 5 = kick)
- **Kick/Ban** - Full permission checks, role hierarchy, DM notifications
- **Timeout** - Flexible duration (minutes to days)
- **Purge** - Bulk delete messages (1-99)
- **View/Remove Warns** - Full warning management system

### 💰 Economy System

- **Balance** - Check wallet and bank balance
- **Daily Rewards** - Daily coins with streak bonuses
- **Work** - Earn coins every hour (random jobs)
- **Deposit/Withdraw** - Bank system
- **Leaderboard** - Top 10 richest users

### 📊 Leveling System

- **XP Gain** - Earn XP from messages (15-25 XP per message, 1min cooldown)
- **Rank** - Check your level, XP, and server rank
- **Level Leaderboard** - Top 10 highest level users
- **Level Roles** - Auto-assign roles when reaching certain levels
- **Level Up Messages** - Celebrate level ups

### 🎭 Reaction Roles

- **Create Reaction Roles** - Easy setup with emojis
- **Auto Add/Remove** - Automatic role management
- **Multiple Roles** - Support for multiple reaction roles per message

### 🛡️ Auto-Moderation

- **Anti-Spam** - Detects and punishes spam (5+ messages in 5s)
- **Anti-Invite** - Blocks Discord invite links
- **Anti-Links** - Optional link filtering (admins bypass)
- **Anti-Caps** - Blocks excessive caps (>70%)
- **Anti-Mass-Mention** - Blocks mass mentions (>5)
- **Auto-Timeout** - 3 violations = 10min timeout
- **Configurable** - Enable/disable individual features

### ⚙️ System Features

- **Command Cooldowns** - Prevent spam (default 3s, customizable)
- **Command Aliases** - Multiple names for commands
- **Guild-Only Check** - DM protection for server commands
- **Auto-Backup** - Database backup every 6 hours (keeps last 7)
- **Logger** - Color-coded console + file logging
- **Error Handling** - Global error handlers
- **Permission Checks** - Full permission system
- **Role Hierarchy** - Prevents abuse

### ℹ️ Info Commands

- **Help** - Dynamic, categorized command list
- **Ping** - Check bot latency
- **User Info** - Detailed user information (works for non-members)
- **Server Info** - Server statistics and info

## 📋 Command List

### General (7 commands)

- `!help [command]` - Show all commands or command details
- `!ping` - Check bot latency
- `!userinfo [@user]` - Get user information
- `!serverinfo` - Get server information

### Moderation (7 commands)

- `!warn <@user> <reason>` - Warn a user
- `!viewwarns <@user>` - View user warnings
- `!removewarn <@user> <caseId>` - Remove a warning
- `!kick <@user> [reason]` - Kick a user
- `!ban <@user> [reason]` - Ban a user
- `!timeout <@user> <minutes> [reason]` - Timeout a user
- `!purge <amount>` - Delete messages (1-99)

### Economy (6 commands)

- `!balance [@user]` - Check balance (aliases: bal, coins, money)
- `!daily` - Claim daily reward
- `!work` - Work for coins
- `!deposit <amount|all>` - Deposit to bank (alias: dep)
- `!withdraw <amount|all>` - Withdraw from bank (alias: with)
- `!leaderboard` - Wealth leaderboard (aliases: lb, top)

### Leveling (5 commands)

- `!rank [@user]` - Check rank and XP (aliases: level, xp)
- `!levels` - Server level leaderboard (aliases: lvlb, ranktop)
- `!setlevelrole <level> <@role>` - Set level role reward (alias: slr)
- `!removelevelrole <level>` - Remove level role (alias: rlr)

### Admin (2 commands)

- `!reactionrole <emoji> <@role> <description>` - Create reaction role (alias: rr)
- `!automod <enable|disable|settings> [option]` - Configure auto-mod

## 🎯 Feature Highlights

### 🔥 Cooldown System

- Default 3 second cooldown per command
- Customizable per command
- Prevents spam and abuse
- User-friendly error messages

### 🎨 Alias Support

- Multiple names for same command
- Example: `!bal`, `!balance`, `!coins`, `!money` all work
- Makes bot more user-friendly

### 🔒 Security

- Permission checks on all mod commands
- Role hierarchy enforcement
- Owner protection (can't moderate owner)
- Self-action protection (can't moderate yourself)
- Bot protection (can't moderate the bot)

### 💾 Database

- SQLite3 with better-sqlite3
- Fast and reliable
- Auto-backup every 6 hours
- Keeps last 7 backups
- WAL mode for performance

### 📝 Logging

- Color-coded console output
- File logging (one file per day)
- Logs stored in `logs/` folder
- Command execution tracking
- Error tracking with context

### 🎮 XP System

- 15-25 XP per message
- 1 minute cooldown between XP gains
- Level up = Level × 100 XP
- Level up announcements
- Auto role rewards

### 💰 Economy Features

- Wallet + Bank system
- Daily rewards with streaks
- Work system with random jobs
- Leaderboard system
- Safe from theft (bank)

### 🛡️ Auto-Mod Features

- Real-time message scanning
- Configurable rules
- Warning system (3 strikes = timeout)
- Auto-cleanup after 1 hour
- Admin bypass for links

## 📊 Statistics

- **Total Commands:** 27+
- **Command Categories:** 5
- **Event Handlers:** 7
- **Utility Modules:** 5
- **Lines of Code:** 3000+
- **Features:** 10 major systems

## 🎉 What Makes This Bot Special

1. **Production Ready** - Full error handling, logging, backups
2. **Scalable** - SQLite database, efficient caching
3. **User Friendly** - Aliases, cooldowns, helpful errors
4. **Secure** - Full permission system, role hierarchy
5. **Feature Rich** - Economy, leveling, auto-mod, reaction roles
6. **Well Organized** - Clean folder structure, categorized commands
7. **Documented** - Comprehensive README and docs
8. **Modern** - Discord.js v14, latest best practices
9. **Customizable** - Per-guild settings, configurable features
10. **Stream-Ready** - Built live, tested in real-time

---

**Vibe Bot** - Built with ❤️ by Airis using Discord.js v14
