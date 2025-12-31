# Changelog

All notable changes to Vibe Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Support server setup
- API integrations (weather, crypto, AI)
- Music commands
- Custom dashboard

## [2.0.0] - 2025-12-31

### 🎉 Major Release - Built Live on Twitch!

Complete rewrite and expansion of Vibe Bot, built entirely live on stream with community input.

### Added

#### 🛡️ Moderation System (19 commands)

- `warn` - Warning system with auto-escalation
- `removewarn` - Remove specific warnings
- `viewwarn` - View user warnings
- `kick` - Kick members
- `ban` - Ban members with message deletion
- `unban` - Unban users
- `softban` - Ban and immediately unban to clear messages
- `massban` - Ban multiple users at once
- `timeout` / `mute` - Timeout members using Discord's native feature
- `unmute` - Remove timeout
- `purge` - Bulk delete messages
- `purgeuser` - Delete messages from specific user
- `slowmode` - Set channel slowmode
- `lock` - Lock a channel
- `unlock` - Unlock a channel
- `nick` - Change member nicknames
- `addrole` - Add role to member
- `removerole` - Remove role from member
- `case` - View detailed moderation case
- `history` - View complete moderation history

#### 💰 Economy System (16 commands)

- `balance` - Check balance with enhanced stats
- `daily` - Daily rewards with multi-bonus system
- `work` - Work for coins
- `deposit` - Deposit to bank
- `withdraw` - Withdraw from bank
- `leaderboard` - Wealth rankings
- `shop` - View server shop
- `buy` - Purchase items
- `inventory` - View owned items
- `coinflip` - Gambling game
- `slots` - Slot machine
- `gift` - Gift coins to others
- `rob` - Rob other users
- `crime` - Commit crimes for money
- `fish` - Go fishing
- `hunt` - Go hunting

#### 📊 Leveling System (4 commands)

- `rank` - View XP and level
- `leaderboard` - Server level rankings
- `setlevelrole` - Set role rewards for levels
- `removelevelrole` - Remove level role rewards
- Auto-XP system with message tracking

#### 🎁 Engagement Features

- `gstart` - Start giveaways
- `gend` - End giveaways
- `greroll` - Reroll giveaway winner
- `reactionrole` - Setup reaction roles
- `setwelcome` - Configure welcome messages
- `setgoodbye` - Configure goodbye messages
- `afk` - Set AFK status
- `poll` - Create polls
- `suggest` - Submit suggestions
- `setupsuggestions` - Setup suggestion system
- `setupstarboard` - Setup starboard
- `remind` - Set reminders

#### 🔧 Utility Commands (37 commands)

- `help` - Dynamic categorized help
- `ping` - Bot latency
- `userinfo` - User information (works for non-members)
- `serverinfo` - Server statistics
- `botinfo` - Enhanced bot statistics
- `advanced-stats` - Full system metrics
- `serveranalytics` - Comprehensive server analytics
- `useranalytics` - User profile and analytics
- `avatar` - Get user avatar
- `banner` - Get user banner
- `servericon` - Get server icon
- `serverboosts` - Server boost information
- `roleinfo` - Role information
- `channelinfo` - Channel information
- `membercount` - Member statistics
- `emojis` - List server emojis
- `emojiinfo` - Emoji information
- `firstmessage` - Get first message in channel
- `enlarge` - Enlarge custom emojis
- `invite` - Bot invite link
- `support` - Support server link
- `privacy` - Privacy policy
- `terms` - Terms of service
- `uptime` - Bot uptime
- `snipe` - View deleted messages
- `editsnipe` - View edited messages
- `qr` - Generate QR codes
- `screenshot` - Website screenshots
- `json` - Format and validate JSON
- `base64` - Encode/decode base64
- `hash` - Generate hashes (MD5, SHA256, SHA512)
- `uuid` - Generate UUIDs
- `ai` - AI chat assistant (placeholder)
- `shorten` - URL shortener (placeholder)
- `crypto` - Crypto prices (placeholder)
- `github` - GitHub repo info (placeholder)
- `npm` - NPM package info (placeholder)
- `image` - AI image generation (placeholder)

#### 😂 Fun Commands (8 commands)

- `blackjack` - Interactive card game
- `dice` - Roll dice
- `rps` - Rock paper scissors
- `trivia` - Trivia questions
- `choose` - Choose between options
- `meme` - Random memes from Reddit
- `roast` - Roast someone
- `compliment` - Give compliments

#### ⚙️ Admin Commands (15 commands)

- `setuptickets` - Setup ticket system with buttons
- `setupverify` - Setup verification system
- `setprefix` - Custom prefix per server
- `automod` - Configure auto-moderation
- `antiraid` - Configure anti-raid protection
- `setlogs` - Setup server logs
- `embed` - Create custom embeds
- `announce` - Send announcements
- `say` - Make bot say something
- `nuke` - Clone and delete channel
- `additem` - Add shop items

#### 🎯 Advanced Systems

- **Multi-Bonus System** - Streak, level, random, weekend bonuses
- **Activity Scoring** - Track user and server engagement
- **Badge System** - Achievements and status indicators
- **Case Management** - Full moderation audit trails
- **Performance Monitoring** - CPU, RAM, network stats
- **Anti-Raid Protection** - Automatic detection and response
- **Auto-Backup** - Database backups every 6 hours
- **Button Interactions** - Modern Discord UI
- **Dynamic Embeds** - Color-coded by context
- **Smart Cooldowns** - Prevent spam and abuse

#### 📝 Event Handlers (20 events)

- `ready` - Bot startup
- `messageCreate` - Command handling
- `messageUpdate` - Message edit logging and snipe cache
- `messageDelete` - Message deletion logging and snipe cache
- `voiceStateUpdate` - Voice channel tracking
- `guildMemberUpdate` - Member update logging
- `channelUpdate` - Channel change logging
- `levelSystem` - XP tracking
- `automod` - Auto-moderation enforcement
- `antiRaid` - Raid detection
- `reactionRoles` - Reaction role assignment
- `reactionRolesRemove` - Reaction role removal
- `welcome` - Welcome messages
- `goodbye` - Goodbye messages
- `afkSystem` - AFK detection
- `starboard` - Starboard system
- `serverLogs` - Comprehensive logging
- `ticketButtons` - Ticket button interactions
- `verificationButton` - Verification button interactions
- `blackjackButtons` - Blackjack game interactions

#### 🔧 Utility Modules

- `database.js` - SQLite3 database manager
- `logger.js` - Advanced logging system
- `cooldowns.js` - Cooldown management
- `backup.js` - Auto-backup system
- `automod.js` - Auto-moderation logic
- `permissions.js` - Permission utilities
- `formatting.js` - Text and data formatting

#### 📄 Documentation & Legal

- `README.md` - Comprehensive documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `CODE_OF_CONDUCT.md` - Community standards
- `SECURITY.md` - Security policy
- `LICENSE` - Proprietary license with contribution allowance
- `TERMS_OF_SERVICE.md` - User terms
- `PRIVACY_POLICY.md` - Privacy policy
- `CHANGELOG.md` - Version history
- GitHub issue templates (bug, feature, question)
- Pull request template

### Changed

- Migrated from JSON to SQLite3 database
- Updated to Discord.js v14
- Modernized all commands to 2025 standards
- Enhanced error handling and logging
- Improved permission checks and security
- Updated license to proprietary with contribution allowance

### Removed

- Outdated commands (reverse, ascii, kiss, pat, weather, define, translate, old meme, beg, dig, hug, joke, color, calc, timestamp, tag commands, 8ball, flip)
- Replaced with modern, functional alternatives

### Security

- Implemented role hierarchy checks
- Added owner and self-protection
- Enhanced input validation
- Secure database operations
- Rate limiting and cooldowns

## [1.0.0] - 2025-12-30

### Added

- Initial bot structure
- Basic command handler
- Event handler
- Template command file
- JSON database system
- Basic moderation commands (warn, kick, ban, purge, timeout)
- General commands (help, ping, userinfo, serverinfo)

---

**Note:** Version 2.0.0 was built entirely live on [Airis's Twitch stream](https://twitch.tv/projectdraguk) with community input!

[Unreleased]: https://github.com/Sentinelbot-official/vibebot/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/Sentinelbot-official/vibebot/releases/tag/v2.0.0
[1.0.0]: https://github.com/Sentinelbot-official/vibebot/releases/tag/v1.0.0
