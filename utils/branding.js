/**
 * Vibe Bot Branding & Personality
 * Centralized branding elements for consistent personality across the bot
 * Built 24/7 live on Twitch with the community!
 */

module.exports = {
  // Brand Colors
  colors: {
    primary: 0x9b59b6, // Purple
    success: 0x2ecc71, // Green
    error: 0xe74c3c, // Red
    warning: 0xf39c12, // Orange
    info: 0x3498db, // Blue
    twitch: 0x9146ff, // Twitch Purple
    premium: 0xffd700, // Gold
  },

  // Emojis
  emojis: {
    vibe: '🎵',
    live: '🔴',
    community: '💜',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    loading: '⏳',
    star: '⭐',
    fire: '🔥',
    sparkles: '✨',
    heart: '💖',
    rocket: '🚀',
    party: '🎉',
    music: '🎶',
    twitch: '🎬',
  },

  // Footer Templates
  footers: {
    default: {
      text: '🔴 Built 24/7 live on Twitch • twitch.tv/projectdraguk',
      iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-70x70.png',
    },
    community: {
      text: '💜 Made with love by the 24/7 global community',
      iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-70x70.png',
    },
    premium: {
      text: '💎 Premium Feature • Support the 24/7 stream!',
      iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-70x70.png',
    },
    music: {
      text: '🎵 Music system coded live on Twitch!',
      iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-70x70.png',
    },
  },

  // Fun Response Arrays
  responses: {
    success: [
      'Done! 🎉',
      'All set! ✨',
      'Got it! 💜',
      'Success! 🚀',
      'Vibing! 🎵',
      'Perfect! ⭐',
      'Nailed it! 🔥',
      'Boom! 💥',
    ],
    thinking: [
      'Let me check that...',
      'Processing vibes...',
      'Working on it...',
      'One moment...',
      'Calculating...',
      'Checking the stream...',
      'Consulting chat...',
    ],
    error: [
      'Oops! Something went wrong.',
      'Uh oh! That didn\'t work.',
      'Hmm, that\'s not right...',
      'Error detected!',
      'Houston, we have a problem...',
      'That\'s a bug! (We\'ll fix it live!)',
    ],
    loading: [
      '⏳ Loading vibes...',
      '⏳ Fetching data from the stream...',
      '⏳ Consulting the community...',
      '⏳ Processing...',
      '⏳ One sec...',
    ],
  },

  // Taglines
  taglines: [
    'Built 24/7 live on Twitch!',
    'Coded with the community!',
    'Every feature has a story!',
    'Not just a bot - a journey!',
    'Made by viewers, for viewers!',
    'Built live, every timezone!',
    'Community-powered vibes!',
  ],

  // Get random response
  getRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  // Get random success message
  getSuccessMessage() {
    return this.getRandom(this.responses.success);
  },

  // Get random thinking message
  getThinkingMessage() {
    return this.getRandom(this.responses.thinking);
  },

  // Get random error message
  getErrorMessage() {
    return this.getRandom(this.responses.error);
  },

  // Get random loading message
  getLoadingMessage() {
    return this.getRandom(this.responses.loading);
  },

  // Get random tagline
  getTagline() {
    return this.getRandom(this.taglines);
  },

  // Create branded embed base
  createEmbed(options = {}) {
    const embed = {
      color: options.color || this.colors.primary,
      timestamp: options.timestamp !== false ? new Date() : undefined,
    };

    // Add footer if not explicitly disabled
    if (options.footer !== false) {
      embed.footer = options.footer || this.footers.default;
    }

    // Add author with tagline if requested
    if (options.withTagline) {
      embed.author = {
        name: this.getTagline(),
        icon_url: this.footers.default.iconURL,
      };
    }

    return embed;
  },

  // Format command usage with personality
  formatUsage(command) {
    return (
      `**Usage:** \`//${command.name} ${command.usage || ''}\`\n` +
      (command.aliases?.length
        ? `**Aliases:** ${command.aliases.map(a => `\`//${a}\``).join(', ')}\n`
        : '') +
      `**Category:** ${command.category}\n` +
      (command.cooldown ? `**Cooldown:** ${command.cooldown}s\n` : '') +
      `\n💜 *Built live on Twitch with the community!*`
    );
  },

  // Create error embed
  createErrorEmbed(title, description, options = {}) {
    return {
      color: this.colors.error,
      title: `${this.emojis.error} ${title}`,
      description: description,
      footer: options.footer || this.footers.default,
      timestamp: new Date(),
    };
  },

  // Create success embed
  createSuccessEmbed(title, description, options = {}) {
    return {
      color: this.colors.success,
      title: `${this.emojis.success} ${title}`,
      description: description,
      footer: options.footer || this.footers.default,
      timestamp: new Date(),
    };
  },

  // Create info embed
  createInfoEmbed(title, description, options = {}) {
    return {
      color: this.colors.info,
      title: `${this.emojis.vibe} ${title}`,
      description: description,
      footer: options.footer || this.footers.default,
      timestamp: new Date(),
    };
  },

  // Add personality to numbers
  formatNumber(num) {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M 🔥`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K ✨`;
    }
    return num.toLocaleString();
  },

  // Add personality to time
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s ⏱️`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s ⏱️`;
    }
    return `${secs}s ⏱️`;
  },

  // Easter eggs for specific inputs
  easterEggs: {
    '69': 'Nice. 😏',
    '420': 'Blaze it! 🌿',
    '666': 'Spooky! 👻',
    '777': 'Lucky! 🍀',
    '1337': 'Elite hacker vibes! 💻',
    '9000': 'It\'s over 9000! 💥',
  },

  // Check for easter egg
  checkEasterEgg(input) {
    const str = input.toString();
    return this.easterEggs[str] || null;
  },
};
