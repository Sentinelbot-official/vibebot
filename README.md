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

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/Sentinelbot-official/vibebot.git
cd vibebot
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your bot token
TOKEN=your_bot_token_here
PREFIX=!
```

4. **Start the bot**

```bash
node index.js
```

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

## 🛠️ Creating Commands

1. **Use the template**

```bash
cp template.command.js commands/general/mycommand.js
```

2. **Edit your command**

```javascript
module.exports = {
  name: 'mycommand',
  description: 'My awesome command',
  usage: '[args]',
  category: 'general',
  async execute(message, args) {
    message.reply('Hello World!');
  },
};
```

3. **Restart the bot** - Commands are loaded automatically!

## 💾 Using the Database

```javascript
const db = require('./utils/database');

// Store data
db.set('users', userId, { coins: 100, level: 5 });

// Get data
const user = db.get('users', userId);

// Increment values
db.increment('economy', userId, 50);

// Array operations
db.push('inventory', userId, 'sword');
```

See `utils/README.md` for full database documentation.

## 📝 Logging

```javascript
const logger = require('./utils/logger');

logger.info('Information message');
logger.warn('Warning message');
logger.error('Error message');
logger.success('Success message');
logger.debug('Debug message');
```

Logs are saved to `logs/YYYY-MM-DD.log` files.

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

## 🎨 Customization

### Change Command Prefix

Edit `.env`:

```
PREFIX=?
```

### Add New Categories

1. Create a new folder in `commands/` (e.g., `commands/fun/`)
2. Add commands with `category: 'fun'`
3. Commands will automatically appear in the help menu

### Modify Auto-Escalation

Edit `commands/moderation/warn.js` lines 67-83 to customize warning thresholds.

## 🐛 Troubleshooting

### Bot doesn't respond to commands

- Check that the bot has "Read Messages" and "Send Messages" permissions
- Verify the prefix in your `.env` file
- Enable "Message Content Intent" in Discord Developer Portal

### Database errors

- Ensure the `data/` folder has write permissions
- Check that `better-sqlite3` is properly installed

### Permission errors

- Verify bot role is higher than target user's role
- Check bot has required permissions in the server

## 📦 Dependencies

- `discord.js` - Discord API wrapper
- `better-sqlite3` - SQLite database
- `dotenv` - Environment variable management
- `prettier` - Code formatting (dev)

## 📄 Legal

- **License:** MIT License (see [LICENSE](LICENSE))
- **Terms of Service:** [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md)
- **Privacy Policy:** [PRIVACY_POLICY.md](PRIVACY_POLICY.md)

Use `!terms` and `!privacy` commands in Discord to view summaries.

## 🤝 Contributing

This project was built with the community, for the community! Contributions are welcome:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### 💡 Contribution Ideas

- Add new commands or features
- Improve existing commands
- Fix bugs or issues
- Enhance documentation
- Optimize performance
- Add API integrations

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
✅ Made it open source for the community  
✅ Had fun doing it! 🎉

---

**Vibe Bot v2.0** - Made with ❤️ by Airis and the Twitch Community  
Built Live | Powered by Discord.js v14 | Open Source | Community-Driven

_"This is what happens when a streamer and chat decide to vibe code a Discord bot. Enjoy!"_ - Airis
