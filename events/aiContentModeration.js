const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const branding = require('../utils/branding');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const config = db.get('ai_moderation', message.guild.id);

    if (!config || !config.enabled) return;

    try {
      // Get or initialize stats
      const stats = db.get('ai_mod_stats', message.guild.id) || {
        totalScans: 0,
        totalBlocked: 0,
        nsfw: 0,
        toxicity: 0,
        phishing: 0,
        spam: 0,
      };

      stats.totalScans++;

      // Analyze message content
      const analysis = await analyzeContent(message.content, config);

      if (analysis.flagged) {
        stats.totalBlocked++;
        stats[analysis.type]++;
        db.set('ai_mod_stats', message.guild.id, stats);

        // Take action
        await handleViolation(message, analysis, config);
      } else {
        db.set('ai_mod_stats', message.guild.id, stats);
      }
    } catch (error) {
      console.error('AI moderation error:', error);
    }
  },
};

async function analyzeContent(content, config) {
  const contentLower = content.toLowerCase();

  // NSFW Detection (keyword-based for now)
  if (config.nsfw) {
    const nsfwKeywords = [
      'porn',
      'nsfw',
      'xxx',
      'sex',
      'nude',
      'naked',
      'explicit',
    ];
    for (const keyword of nsfwKeywords) {
      if (contentLower.includes(keyword)) {
        return {
          flagged: true,
          type: 'nsfw',
          confidence: 0.85,
          reason: 'NSFW content detected',
        };
      }
    }
  }

  // Toxicity Detection
  if (config.toxicity) {
    const toxicKeywords = [
      'kill yourself',
      'kys',
      'die',
      'hate you',
      'stupid',
      'idiot',
      'retard',
      'moron',
      'dumb',
      'loser',
      'trash',
      'garbage',
    ];
    for (const keyword of toxicKeywords) {
      if (contentLower.includes(keyword)) {
        return {
          flagged: true,
          type: 'toxicity',
          confidence: 0.8,
          reason: 'Toxic language detected',
        };
      }
    }
  }

  // Phishing Detection
  if (config.phishing) {
    const phishingPatterns = [
      /free\s*nitro/i,
      /discord\s*gift/i,
      /claim\s*your/i,
      /won\s*\$\d+/i,
      /click\s*here\s*to\s*claim/i,
      /steam\s*gift/i,
      /urgent\s*security/i,
    ];
    for (const pattern of phishingPatterns) {
      if (pattern.test(content)) {
        return {
          flagged: true,
          type: 'phishing',
          confidence: 0.9,
          reason: 'Potential phishing attempt detected',
        };
      }
    }
  }

  // Spam Detection
  if (config.spam) {
    // Check for excessive caps
    const capsRatio =
      (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      return {
        flagged: true,
        type: 'spam',
        confidence: 0.75,
        reason: 'Excessive caps detected',
      };
    }

    // Check for repeated characters
    if (/(.)\1{10,}/.test(content)) {
      return {
        flagged: true,
        type: 'spam',
        confidence: 0.8,
        reason: 'Repeated characters detected',
      };
    }

    // Check for excessive mentions
    const mentions = content.match(/<@!?\d+>/g) || [];
    if (mentions.length > 5) {
      return {
        flagged: true,
        type: 'spam',
        confidence: 0.85,
        reason: 'Excessive mentions detected',
      };
    }
  }

  return { flagged: false };
}

async function handleViolation(message, analysis, config) {
  // Check confidence threshold
  if (analysis.confidence < config.threshold) {
    return;
  }

  // Delete message
  if (config.action === 'delete' || config.action === 'warn' || config.action === 'timeout') {
    try {
      await message.delete();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }

  // Warn user
  if (config.action === 'warn') {
    const warnings = db.get('warnings', message.author.id) || [];
    warnings.push({
      id: Date.now().toString(),
      guildId: message.guild.id,
      reason: `AI Moderation: ${analysis.reason}`,
      moderator: message.client.user.id,
      timestamp: Date.now(),
      decayDate: Date.now() + 90 * 24 * 60 * 60 * 1000,
    });
    db.set('warnings', message.author.id, warnings);
  }

  // Timeout user
  if (config.action === 'timeout') {
    try {
      await message.member.timeout(5 * 60 * 1000, `AI Moderation: ${analysis.reason}`);
    } catch (error) {
      console.error('Failed to timeout user:', error);
    }
  }

  // Send DM to user
  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(branding.colors.error)
      .setTitle('⚠️ Message Removed')
      .setDescription(
        `Your message in **${message.guild.name}** was removed by AI moderation.\n\n` +
          `**Reason:** ${analysis.reason}\n` +
          `**Confidence:** ${(analysis.confidence * 100).toFixed(0)}%\n\n` +
          'Please review the server rules and avoid posting similar content.'
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    await message.author.send({ embeds: [dmEmbed] });
  } catch (error) {
    // User has DMs disabled
  }

  // Log to channel
  if (config.logChannel) {
    const logChannel = message.guild.channels.cache.get(config.logChannel);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('🤖 AI Moderation Action')
        .setDescription(
          `**User:** ${message.author} (${message.author.tag})\n` +
            `**Channel:** ${message.channel}\n` +
            `**Type:** ${analysis.type.toUpperCase()}\n` +
            `**Reason:** ${analysis.reason}\n` +
            `**Confidence:** ${(analysis.confidence * 100).toFixed(0)}%\n` +
            `**Action:** ${config.action}\n\n` +
            `**Message Content:**\n\`\`\`${message.content.substring(0, 500)}\`\`\``
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
}
