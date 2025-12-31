# Vibe Bot 🎵

> **Built Live on Twitch by the Community!** 🎥

A feature-rich, enterprise-level Discord bot with 100+ commands, built entirely live on stream with the help of an amazing Twitch community. This bot showcases what's possible when streamers and viewers collaborate to create something awesome!

## 🌟 About This Project

**Vibe Bot** was created live on [Airis's Twitch stream](https://twitch.tv/projectdraguk) on **December 31, 2025**, with real-time input and suggestions from the community. Every feature, every command, and every line of code was written with chat watching, learning, and contributing ideas.

### 🎬 Stream Highlights

- **100+ commands** built in one session
- **Real-time debugging** with chat's help
- **Community-driven features** based on viewer suggestions
- **Educational coding** - showing the entire development process
- **Open collaboration** - chat voted on features and design decisions

### 💜 Community-Powered Development

This isn't just a bot - it's a testament to what a community can build together. Shoutout to everyone who:

- Suggested features and commands
- Helped debug issues
- Voted on design decisions
- Learned alongside the stream
- Made this project possible!

**Want to see how it was made? Check out the VOD!** _(link coming soon)_

**GitHub Repository:** https://github.com/Sentinelbot-official/vibebot

## 🚀 Features

### 💎 **100+ Commands Across 8 Categories**

**🛡️ Advanced Moderation (19 commands)**

- Warning system with case tracking & history
- Kicks, bans, softbans, massban capabilities
- Timeouts/mutes, slowmode, lock/unlock
- Message purging (bulk & user-specific)
- Role & nickname management
- Complete audit trail system

**💰 Economy System (16 commands)**

- Virtual currency with wallet & bank
- Daily rewards with streak bonuses & milestones
- Work, fish, hunt, dig for earnings
- Shop system, gambling (blackjack, slots, coinflip)
- Gifting, robbing, trading
- Advanced statistics & leaderboards

**📊 Leveling System (4 commands)**

- XP gain from messages
- Level progression with role rewards
- Rank cards & server leaderboards

**🎁 Engagement Features**

- Giveaway system with timed draws
- Reaction roles
- Welcome/goodbye messages
- AFK system, polls, suggestions
- Starboard, reminders, custom tags

**🔧 Utility Commands (34 commands)**

- Server & user analytics
- Advanced statistics & monitoring
- QR codes, website screenshots
- JSON formatter, Base64, hashing, UUID
- Developer tools (GitHub, NPM)
- AI integration ready

**😂 Fun Commands (8 commands)**

- Blackjack, trivia, memes
- Roast, compliment, choose
- Dice, RPS

**⚙️ Admin Tools (15 commands)**

- Custom embeds & announcements
- Ticket & verification systems
- Auto-moderation configuration
- Custom prefix per server

### 🎯 **Advanced Features**

- **Multi-Bonus Systems** - Streak, level, random, weekend bonuses
- **Activity Scoring** - Track user & server engagement
- **Badge System** - Achievements & status indicators
- **Case Management** - Full moderation audit trails
- **Performance Monitoring** - CPU, RAM, network stats
- **Anti-Raid Protection** - Automatic detection & response
- **Auto-Backup** - Database backups every 6 hours
- **Button Interactions** - Modern Discord UI
- **Dynamic Embeds** - Color-coded by context
- **Smart Cooldowns** - Prevent spam & abuse

## 📋 Prerequisites

- Node.js v16.9.0 or higher
- npm or yarn
- A Discord bot token

## 🔧 Usage

**This bot is proprietary software and cannot be self-hosted.**

### Option 1: Invite the Official Bot (Recommended)

[**Invite Vibe Bot to Your Server**](https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_ID_HERE&permissions=8&scope=bot)

### Option 2: View Source Code (Educational Only)

You may view the source code for educational and reference purposes:

```bash
# View the code (READ-ONLY)
# DO NOT clone, fork, or redistribute
```

**Note:** Running your own instance requires explicit written permission from the author.

## 📁 Project Structure

```
projects/
├── commands/           # Command files organized by category
│   ├── general/       # General commands (help, ping, userinfo, etc.)
│   └── moderation/    # Moderation commands (warn, kick, ban, etc.)
├── events/            # Event handlers
│   ├── ready.js       # Bot ready event
│   └── messageCreate.js # Message handling
├── utils/             # Utility modules
│   ├── database.js    # SQLite database manager
│   ├── logger.js      # Logging utility
│   └── README.md      # Utils documentation
├── data/              # Database files (auto-created)
├── logs/              # Log files (auto-created)
├── index.js           # Main bot file
├── template.command.js # Command template
└── package.json       # Dependencies
```

## 🎮 Commands

### General Commands

- `!help [command]` - List all commands or get info about a specific command
- `!ping` - Check bot latency
- `!userinfo [@user]` - Get information about a user
- `!serverinfo` - Get information about the server

### Moderation Commands

- `!warn <@user> <reason>` - Warn a user (with auto-escalation)
- `!viewwarns <@user>` - View a user's warnings
- `!removewarn <@user> <caseId>` - Remove a warning
- `!kick <@user> [reason]` - Kick a user
- `!ban <@user> [reason]` - Ban a user
- `!timeout <@user> <minutes> [reason]` - Timeout a user
- `!purge <amount>` - Delete messages (1-100)

## 🛠️ Command Reference

All commands are documented in the bot using `!help [command]`. The bot includes:

- **19 Moderation Commands** - Full server management
- **16 Economy Commands** - Virtual currency system
- **4 Leveling Commands** - XP and progression
- **34 Utility Commands** - Tools and information
- **8 Fun Commands** - Entertainment and games
- **15 Admin Commands** - Server configuration

Use `!help` in Discord to see all available commands.

## 💾 Database System

The bot uses SQLite3 with automatic backups every 6 hours. All user data is stored securely and complies with our [Privacy Policy](PRIVACY_POLICY.md).

## 📝 Bot Features

The bot includes advanced logging, error handling, and performance monitoring to ensure reliability and uptime.

## 🔐 Required Bot Permissions

- Read Messages/View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Add Reactions
- Manage Messages (for purge)
- Kick Members (for kick command)
- Ban Members (for ban command)
- Moderate Members (for timeout command)

## 🔒 Required Intents

The bot uses the following intents:

- Guilds
- GuildMessages
- MessageContent (Privileged)
- GuildMembers (Privileged)
- GuildVoiceStates
- GuildPresences (Privileged)
- GuildMessageReactions

**Note:** You need to enable privileged intents in the Discord Developer Portal.

## 🎨 Server Customization

Server administrators can customize:

- **Custom Prefix** - Use `!setprefix` to change the command prefix
- **Welcome/Goodbye Messages** - Configure with `!setwelcome` and `!setgoodbye`
- **Auto-Moderation** - Enable/disable rules with `!automod`
- **Reaction Roles** - Set up with `!reactionrole`
- **Ticket System** - Configure with `!setuptickets`
- **Verification System** - Set up with `!setupverify`

All settings are per-server and stored securely.

## 🐛 Troubleshooting

### Bot doesn't respond to commands

- Check that the bot has "Read Messages" and "Send Messages" permissions
- Verify your server's prefix with `@Vibe Bot prefix`
- Ensure the bot role is not restricted by channel permissions

### Permission errors

- Verify bot role is higher than target user's role
- Check bot has required permissions in the server
- Some commands require specific permissions (e.g., `!ban` requires Ban Members)

### Need more help?

Join our support server or open an issue on GitHub!

## 📦 Dependencies

- `discord.js` - Discord API wrapper
- `better-sqlite3` - SQLite database
- `dotenv` - Environment variable management
- `prettier` - Code formatting (dev)

## 📄 Legal

- **License:** Proprietary License - All Rights Reserved (see [LICENSE](LICENSE))
- **Terms of Service:** [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)
- **Privacy Policy:** [PRIVACY_POLICY.md](PRIVACY_POLICY.md)

**⚠️ Important:** This software is proprietary. You may NOT redistribute or host your own instance for public use without explicit written permission. However, you may fork for personal development and submit pull requests.

Use `!terms` and `!privacy` commands in Discord to view summaries.

## 🤝 Contributing

While this is proprietary software, we welcome community contributions!

### How You Can Help:

1. **Fork the Repository** - Create your own fork
2. **Create a Feature Branch** - `git checkout -b feature/AmazingFeature`
3. **Commit Your Changes** - `git commit -m 'Add some AmazingFeature'`
4. **Push to the Branch** - `git push origin feature/AmazingFeature`
5. **Open a Pull Request** - We'll review and merge if approved!

### Contribution Ideas:

- 🐛 **Bug Fixes** - Fix issues and improve stability
- ✨ **New Features** - Add commands or functionality
- 📝 **Documentation** - Improve guides and examples
- 🎨 **UI/UX** - Enhance embeds and user experience
- ⚡ **Performance** - Optimize code and database queries
- 🔒 **Security** - Identify and fix vulnerabilities

**Note:** By contributing, you agree that your contributions will be licensed under the same proprietary license. You retain credit for your work!

## 📞 Support

Need help or want to contribute?

- **Discord Server:** [Join Here](LINK_COMING_SOON)
- **Twitch Stream:** [Watch Live](https://twitch.tv/projectdraguk)
- **GitHub Issues:** [Report Bugs](https://github.com/Sentinelbot-official/vibebot/issues)
- **GitHub Repo:** https://github.com/Sentinelbot-official/vibebot
- **Email:** vibetbot0@proton.me

## 🎥 Stream Info

**Streamer:** Airis  
**Platform:** Twitch  
**Stream Date:** December 31, 2025  
**Development Time:** One epic session!  
**Community:** You amazing people! 💜

### Want to Build Your Own Bot Live?

This project shows that you can build complex, production-ready software live on stream with your community. Some tips:

- **Engage your chat** - Let them suggest features
- **Explain as you code** - Make it educational
- **Debug together** - Chat loves helping solve problems
- **Celebrate wins** - Every working feature is a victory
- **Stay organized** - Good structure makes live coding easier

## 🌟 Special Thanks

Huge shoutout to:

- **The Twitch Community** - For all the suggestions, bug reports, and hype
- **Discord.js Team** - For an amazing library
- **Everyone who watched** - You made this possible!

## 📊 Project Stats

- **100+ Commands** implemented
- **18+ Event Handlers** for automation
- **6 Utility Modules** for core functionality
- **5000+ Lines of Code** written live
- **0 Pre-written Code** - Everything built from scratch on stream
- **∞ Community Input** - Priceless!

## 🏆 Achievements Unlocked

✅ Built a complete Discord bot in one stream  
✅ Implemented 100+ commands  
✅ Created enterprise-level features  
✅ Wrote comprehensive documentation  
✅ Shared the development journey with the community  
✅ Had fun doing it! 🎉

---

**Vibe Bot v2.0** - Made with ❤️ by Airis and the Twitch Community  
Built Live | Powered by Discord.js v14 | Proprietary Software | Community-Inspired

_"This is what happens when a streamer and chat decide to vibe code a Discord bot. Enjoy!"_ - Airis

**© 2025 Airis. All Rights Reserved.**
