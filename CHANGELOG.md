# Changelog

All notable changes to Vibe Bot will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- Support server setup
- Web dashboard

## [2.7.0] - 2026-01-01

### 🤖 Enhanced AI & Voice Features - Q1 2026 Complete!

Completed the entire Q1 2026 roadmap with advanced AI and voice features!

### Added

#### 🤖 Enhanced AI Features (v2.6 Complete)

- **OpenAI Moderation API Integration** - Real AI-powered content filtering
  - Detects: sexual content, hate speech, harassment, self-harm, violence
  - 10+ content categories with confidence scores
  - Falls back to enhanced pattern matching if API unavailable
  - Shows detection method (AI vs Pattern) in logs
- **AI Conversation Memory System** - Context-aware AI chat
  - Stores last 20 messages per user (24hr expiry)
  - `//conversationhistory` command to view/clear history
  - AI remembers previous conversations for better responses
  - Automatic cleanup of old conversations
- **AI Image Analysis** - Vision-powered moderation
  - `//analyzeimage` command for image analysis
  - Automatic NSFW image detection and removal
  - Object recognition and text extraction
  - `//imagemoderation` command for admin configuration
  - Per-server settings and statistics

#### 🎤 Voice Features (v2.7 Complete)

- **Voice XP System** - Reward voice activity
  - Earn XP for time spent in voice channels (default 5 XP/min)
  - Voice level-up notifications
  - `//voicestats` command to view statistics
  - `//voicexp` command for admin configuration
  - Ignores muted/deafened users
  - Optional AFK channel XP
  - Auto-awards XP every 5 minutes
- **Soundboard System** - Custom sound effects
  - Play custom sounds in voice channels
  - `//soundboard add/remove/list` commands
  - Per-server sound library
  - Supports MP3/WAV files
  - Auto-disconnect after playing
- **Voice Recording** - Record voice channels (VIP only)
  - `//record start/stop` commands
  - Per-user audio streams
  - Consent warnings for all participants
  - Saves recordings locally
  - Legal compliance notices

### Technical Improvements

- Added `conversationMemory` utility for chat history tracking
- Enhanced AI moderation with OpenAI's official API
- Integrated OpenAI Vision API for image analysis
- Voice state tracking for XP system
- Audio player management for soundboard
- Recording stream management with prism-media

### Fixed

- Added missing branding imports to music commands
- Fixed music command consistency

## [2.6.0] - 2025-12-31

### 🎵 Music System - Complete Implementation

Full-featured music system with YouTube, Spotify, and SoundCloud support!

### Added

#### 🎵 Music Commands (10 commands)

- `//play` - Play music from YouTube, Spotify, or SoundCloud
- `//pause` - Pause current song
- `//resume` - Resume paused song
- `//skip` - Skip to next song
- `//stop` - Stop and leave voice channel
- `//queue` - View queue with pagination
- `//volume` - Adjust volume (0-100%)
- `//loop` - Toggle song loop
- `//loopqueue` - Toggle queue loop
- `//nowplaying` - Show current song details

#### 🎶 Music Features

- **Multi-Platform Support**: YouTube (videos & playlists), Spotify (tracks, albums & playlists), SoundCloud
- **Queue Management**: Paginated queue display, up to 50 songs per playlist
- **Playback Controls**: Full control with pause, resume, skip, stop
- **Loop Modes**: Loop single song or entire queue
- **Volume Control**: Real-time volume adjustment (0-100%)
- **Auto-Disconnect**: Leaves after 5 minutes of inactivity
- **Rich Embeds**: Beautiful song information display
- **Error Handling**: Robust error recovery and user feedback
- **Memory Safe**: Proper cleanup and no memory leaks
- **Reconnection**: Automatic reconnection on voice drops

#### 🔧 Technical Improvements

- Built with `@discordjs/voice` (official library)
- Uses `play-dl` for reliable streaming
- FFmpeg for high-quality audio processing
- Opus codec for efficient encoding
- Sodium encryption for voice data
- Performance packages: `tweetnacl`, `bufferutil`, `utf-8-validate`, `zlib-sync`, `erlpack`

### Fixed

- Critical voice connection event listener bug
- Memory leak from disconnect timers
- Spotify playlist edge case handling
- Deprecation warnings for ephemeral flags

### Performance

- 10-20% faster WebSocket operations
- 5-15% lower CPU usage
- Smoother audio playback
- Better connection stability

## [2.5.0] - 2025-12-31

### 🎮 Premium System Phase 2 - Complete Feature Set

Massive expansion adding advanced economy, analytics, and premium features!

### Added

#### ⭐ XP Multipliers

- Premium: 1.5x XP gain on all messages
- VIP: 2x XP gain on all messages
- XP bonuses displayed in level-up messages
- Integrated with existing leveling system

#### 🎉 Premium Giveaway System

- Full giveaway management (`//giveaway start/end/reroll/list`)
- **Premium users get 2x entries**
- **VIP users get 3x entries**
- Automatic winner selection with premium multipliers
- Duration support: minutes, hours, days
- Automatic giveaway ending
- Reroll functionality

#### 📈 Stock Market System (VIP Only)

- 6 stocks with realistic volatility
- Buy/sell stocks (`//stocks buy/sell`)
- Portfolio management
- Real-time price fluctuations (5-minute intervals)
- Profit/loss tracking
- Seeded random for consistent prices

#### 🏢 Business Ownership (VIP Only)

- 6 business types (Café, Restaurant, Gym, Hotel, Casino, Tech Startup)
- Passive income generation (collect every 6 hours)
- Business upgrades (increase income)
- Buy/sell businesses
- Level system for businesses

#### 📊 Server Analytics Dashboard (VIP Only)

- **Overview:** Members, channels, activity, commands
- **Members:** Growth tracking, retention rates
- **Activity:** Messages, reactions, voice time
- **Commands:** Usage statistics, top commands
- **Growth:** Daily join tracking
- Comprehensive insights for server owners

#### 🎨 Premium Profile Customization

- 8 custom profile themes (Fire, Ocean, Forest, Sunset, Galaxy, Gold, Ruby)
- Custom badges (20 characters)
- Custom bio (200 characters)
- Enhanced profile display
- Theme-based colors

#### 🛡️ Advanced Moderation (Premium)

- Extended audit logs (90 days vs 30 days)
- Moderation insights & statistics
- Top moderators tracking
- Action trends (7-day, 30-day)
- Advanced auto-mod configuration

### Enhanced

- `events/levelSystem.js` - Added premium XP multipliers
- All premium features integrated with tier system
- Automatic giveaway checker (runs every minute)

### New Commands

- `//giveaway` - Create and manage giveaways with premium bonuses
- `//stocks` - VIP stock market trading
- `//business` - VIP business ownership and management
- `//analytics` - VIP server analytics dashboard
- `//profilecustom` - Premium profile customization
- `//advancedmod` - Premium advanced moderation tools

### Event Handlers

- `events/giveawayChecker.js` - Automatically end giveaways

### Documentation

- Updated all version numbers to 2.5.0
- Updated README with Phase 2 features
- Updated website with new features

### Technical Improvements

- Seeded random for consistent stock prices
- Business income collection system
- Analytics data tracking
- Profile theme system
- Extended audit log retention

## [2.4.0] - 2025-12-31

### 🚀 Premium System Expansion

Major update expanding the premium system with comprehensive perks, multipliers, and exclusive features!

### Added

#### 💎 Premium Perks System

- `utils/premiumPerks.js` - Comprehensive premium perks management system
- **Economy Multipliers:**
  - Premium: 1.5x economy, 2x daily rewards
  - VIP: 2x economy, 3x daily rewards
- **Cooldown Reductions:**
  - Premium: 50% faster cooldowns
  - VIP: 75% faster cooldowns
- **Shop Discounts:**
  - Premium: 10% discount on all items
  - VIP: 25% discount on all items
- **AI Image Generation Limits:**
  - Free: 5 images/day
  - Premium: 50 images/day
  - VIP: Unlimited images

#### 🎮 Enhanced Economy Commands

- Updated `daily` command with premium multipliers and bonus display
- Updated `work` command with premium earnings and reduced cooldowns
- Updated `shop` command with premium discounts and exclusive items
- Updated `buy` command with automatic discount application
- **Premium-Exclusive Shop Items:**
  - 💎 Premium Badge (25,000 coins)
  - 👑 VIP Pass (50,000 coins)
  - ✈️ Private Jet (500,000 coins, VIP only)

#### 🎨 New Premium Commands

- `premiumstats` - View detailed premium status, multipliers, and limits
- `customembed` - Create custom embeds (Premium: 25/day, VIP: 100/day)
- `autopost` - Schedule automatic posts (VIP only)
- `customcommand` - Create custom commands (VIP: up to 50 commands)
- `aichat` - Chat with AI powered by GPT-3.5 (VIP only)

#### 🤖 AI Features

- AI chatbot integration with OpenAI GPT-3.5 (VIP only)
- Conversation history tracking (last 20 messages)
- Auto-response mode for designated channels
- Custom system prompts for Discord context

#### 🔧 Custom Commands System

- VIP-exclusive custom command builder
- Variable support: `{user}`, `{server}`, `{channel}`, `{membercount}`, `{args}`
- Usage tracking and statistics
- Edit and remove commands
- Up to 50 custom commands per VIP server

#### 📢 Auto-Posting System

- Schedule automatic posts (VIP only)
- Intervals: 1h, 6h, 12h, 24h, 7d
- Multiple auto-posts per server
- Channel-specific posting

### Enhanced

- `imagine` command now respects daily AI image limits
- All economy commands display premium bonuses
- Shop shows discounted prices for premium users
- Premium-exclusive items locked behind tier requirements
- Website updated with comprehensive premium feature showcase

### Event Handlers

- `events/customCommands.js` - Process custom command executions
- `events/aiAutoResponse.js` - Handle AI auto-responses in designated channels

### Documentation

- Updated website premium section with detailed feature lists
- Added premium command showcase to website
- Updated FAQ with premium information

### Technical Improvements

- Centralized premium perks management
- Efficient multiplier calculations
- Daily limit tracking for AI features
- Conversation history management
- Custom command variable parsing

## [2.3.0] - 2025-12-31

### 🎨 Premium Features & Sharding

Major update adding premium-exclusive features and Discord.js v14 sharding support!

### Added

#### 💎 Premium Features

- `customstatus` - Custom bot status for Premium/VIP servers
- `premiumbadge` - Premium badge/role system
- `earlyaccess` - Early access feature system for beta features
- Premium-exclusive features framework
- Early access feature gating system

#### 🔷 Sharding Support

- `shard.js` - Discord.js ShardingManager implementation
- Auto-sharding for large bots (2,500+ servers)
- Shard health monitoring and statistics
- Auto-restart on shard crashes
- Cross-shard communication support
- Shard-aware logging and metrics

#### 🌐 Website Enhancements

- Command showcase section with 12 featured commands
- Feature comparison table (Free vs Premium vs VIP)
- Roadmap section with timeline
- Enhanced changelog with version badges
- Ko-fi widget integration
- Scroll-to-top button
- SEO meta tags and Open Graph support
- Favicon and PWA support
- Privacy Policy page
- Terms of Service page
- Custom 404 error page

#### 🔧 New Utilities

- `utils/earlyAccess.js` - Early access feature management
- Enhanced `utils/premium.js` with better key validation

### Enhanced

- `index.js` - Removed shard config (handled by ShardingManager)
- `events/ready.js` - Added shard information logging
- `package.json` - Added sharded mode scripts (`start:sharded`, `dev:sharded`)
- `docs/index.html` - Major UI/UX improvements
- `docs/styles.css` - Enhanced styling for new sections
- `docs/script.js` - Improved interactivity and animations

### Documentation

- `readmes/SHARDING.md` - Comprehensive sharding guide
- `readmes/PREMIUM_FEATURES.md` - Premium features documentation
- Updated `README.md` with sharding information

### Technical Improvements

- Better separation of concerns (sharding vs single-instance)
- Improved error handling for sharded environments
- Enhanced logging for multi-shard deployments
- Better resource management

## [2.2.0] - 2025-12-31

### 💎 Premium System & Website Launch

Major update introducing the premium activation key system and full website!

### Added

#### 💎 Premium System

- Per-server activation key system
- Premium and VIP tiers
- Ko-fi integration for purchases
- `activate` - Activate premium with a key
- `premium` - Check server premium status
- `genkey` - Generate activation keys (owner-only)
- `listkeys` - List all generated keys (owner-only)
- `listservers` - List premium servers (owner-only)
- `revokepremium` - Revoke server premium (owner-only)

#### 🌐 GitHub Pages Website

- Beautiful responsive website at `docs/`
- Live bot statistics via Stats API
- Twitch stream embed
- Dark/light theme toggle
- Mobile-responsive navbar
- FAQ section
- Testimonials section
- Command search and filtering
- Premium pricing tiers
- Activation key instructions
- Legal pages (Privacy Policy, Terms of Service)

#### 📊 Stats API

- `utils/statsApi.js` - HTTP server for bot statistics
- Real-time server/user/command counts
- Memory and uptime metrics
- CORS support for website integration
- Health check endpoints

#### 🔧 New Utilities

- `utils/premium.js` - Premium key management
- `utils/statsApi.js` - Stats API server

### Enhanced

- `bot.config.json` - Added invite link with specific permissions
- `utils/config.js` - Added Stats API configuration
- `utils/shutdown.js` - Registered Stats API cleanup
- `index.js` - Initialize Stats API on startup

### Documentation

- `readmes/PREMIUM_SYSTEM.md` - Premium system guide
- `readmes/STATS_API.md` - Stats API documentation
- `docs/activate.html` - Premium activation guide
- `docs/privacy.html` - Privacy Policy
- `docs/terms.html` - Terms of Service
- `docs/404.html` - Custom 404 page

## [2.1.0] - 2025-12-31

### 🚀 Major Feature Expansion

Massive expansion adding 70+ new commands and advanced systems!

### Added

#### 🔧 Utility Enhancements (20+ new commands)

- `weather` - Weather forecasts with API integration
- `crypto` - Cryptocurrency price tracking
- `github` - GitHub repository information
- `npm` - NPM package information
- `shorten` - URL shortener
- `voicestats` - Voice activity statistics
- `voiceleaderboard` - Voice activity leaderboards
- `serveranalytics` - Comprehensive server analytics
- `pagination` - Improved pagination with buttons
- `ai` - AI chat integration (requires API key)
- `imagine` - AI image generation (requires API key)
- `imagemanip` - Image manipulation commands
- `twitch` - Twitch stream information

#### 💰 Economy Expansion (10+ new features)

- `trade` - Trading system with button confirmations
- `prestige` - Prestige system with multipliers
- `job` - Jobs/professions system
- `stocks` - Virtual stock market
- `property` - Virtual property/land ownership
- `craft` - Item crafting system
- `achievements` - Achievement/badge system with rewards

#### 🎭 Social Features (7 new commands)

- `marry` - Marriage system with proposals
- `divorce` - End marriages
- `marriage` - View marriage status
- `rep` - Give reputation points
- `reputation` - View reputation
- `profile` - Detailed user profiles
- `setbio` - Custom profile bios

#### 🎮 Fun & Games (15+ new commands)

- `hangman` - Word guessing game
- `wordle` - Wordle clone
- `pet` - Virtual pet system with leveling
- `fortune` - Daily fortune teller
- `horoscope` - Zodiac horoscopes
- `fact` - Random facts
- `quote` - Inspirational quotes

#### 🛠️ Admin Tools (10+ new commands)

- `autorole` - Auto-role for new members
- `accountage` - Account age verification
- `rolemenu` - Interactive role menus with buttons
- `autoresponder` - Custom auto-responses
- `wordfilter` - Word blacklist management
- `regexfilter` - Regex-based filtering
- `tempvoice` - Temporary voice channel system
- `premium` - Premium/VIP member management
- `language` - Server language settings (i18n)
- `modmail` - Private modmail system

#### 🎯 New Systems

- **Voice XP Tracking** - Track voice channel activity
- **Achievements System** - Unlockable achievements with rewards
- **Marriage System** - User marriages with proposals
- **Premium System** - VIP/Premium member management
- **Temporary Voice Channels** - Auto-created voice channels
- **Word & Regex Filters** - Advanced content filtering
- **Internationalization** - Multi-language support (EN, ES, FR)
- **Server Analytics** - Comprehensive server statistics
- **Voice Statistics** - Voice activity tracking and leaderboards

#### 📊 New Events

- `voiceXP.js` - Voice XP tracking
- `wordFilter.js` - Word and regex filtering
- `tempVoice.js` - Temporary voice channel management

#### 🔧 New Utilities

- `utils/i18n.js` - Internationalization system

### Enhanced

- **Button Interactions** - Added button support for trades, role menus, pagination
- **Database System** - Expanded to support new features
- **Event Handlers** - Enhanced interaction handling
- **Command System** - Better organization and categorization
- **Documentation** - Comprehensive guides in `readmes/` folder

### Technical Improvements

- Removed ESLint (user preference)
- Improved error handling
- Better code organization
- Enhanced logging
- Performance optimizations

### Documentation

- `readmes/V2.1_PROGRESS.md` - Development progress tracking
- `readmes/V2.1_SUMMARY.md` - Feature summary
- `readmes/FINAL_SUMMARY_V2.1.md` - Final comprehensive summary
- `readmes/COMPLETE_FEATURES_V2.1.md` - Complete feature list

### Statistics

- **70+ new commands** added
- **200+ total commands** across all categories
- **32 event handlers** for comprehensive functionality
- **15+ utility modules** for shared functionality
- **10+ mini-games** for entertainment
- **5+ external API integrations** ready to use
- **3 languages** supported (i18n)

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
