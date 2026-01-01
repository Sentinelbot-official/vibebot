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

  // Try OpenAI Moderation API first (if available)
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ input: content }),
      });

      if (response.ok) {
        const data = await response.json();
        const result = data.results[0];

        if (result.flagged) {
          const categories = result.categories;
          const scores = result.category_scores;

          // Determine primary violation type
          let type = 'toxicity';
          let reason = 'Inappropriate content detected';
          let confidence = 0;

          if (categories.sexual && config.nsfw) {
            type = 'nsfw';
            reason = 'Sexual content detected';
            confidence = scores.sexual;
          } else if (categories['sexual/minors']) {
            type = 'nsfw';
            reason = 'Illegal content detected';
            confidence = 1.0; // Always flag
          } else if (categories.hate && config.toxicity) {
            type = 'toxicity';
            reason = 'Hate speech detected';
            confidence = scores.hate;
          } else if (categories['hate/threatening'] && config.toxicity) {
            type = 'toxicity';
            reason = 'Threatening hate speech detected';
            confidence = scores['hate/threatening'];
          } else if (categories.harassment && config.toxicity) {
            type = 'toxicity';
            reason = 'Harassment detected';
            confidence = scores.harassment;
          } else if (categories['harassment/threatening'] && config.toxicity) {
            type = 'toxicity';
            reason = 'Threatening harassment detected';
            confidence = scores['harassment/threatening'];
          } else if (categories['self-harm'] && config.toxicity) {
            type = 'toxicity';
            reason = 'Self-harm content detected';
            confidence = scores['self-harm'];
          } else if (categories.violence && config.toxicity) {
            type = 'toxicity';
            reason = 'Violent content detected';
            confidence = scores.violence;
          } else if (categories['violence/graphic'] && config.toxicity) {
            type = 'toxicity';
            reason = 'Graphic violence detected';
            confidence = scores['violence/graphic'];
          }

          return {
            flagged: true,
            type,
            confidence,
            reason,
            aiPowered: true,
          };
        }
      }
    } catch (error) {
      console.error('OpenAI moderation API error:', error);
      // Fall back to keyword detection
    }
  }

  // Fallback: Keyword-based detection (enhanced patterns)
  // NSFW Detection
  if (config.nsfw) {
    const nsfwPatterns = [
      /\bp[o0]rn\b/i,
      /\bnsfw\b/i,
      /\bxxx\b/i,
      /\bs[e3]x\b/i,
      /\bnud[e3]\b/i,
      /\bnak[e3]d\b/i,
      /\b[e3]xplicit\b/i,
      /\bonlyfans\b/i,
      /\bfans\.ly\b/i,
    ];
    for (const pattern of nsfwPatterns) {
      if (pattern.test(content)) {
        return {
          flagged: true,
          type: 'nsfw',
          confidence: 0.75,
          reason: 'NSFW content detected',
          aiPowered: false,
        };
      }
    }
  }

  // Toxicity Detection (enhanced)
  if (config.toxicity) {
    const toxicPatterns = [
      /\bk[i1]ll\s*y[o0]urs[e3]lf\b/i,
      /\bkys\b/i,
      /\bd[i1][e3]\b/i,
      /\bh[a4]t[e3]\s*y[o0]u\b/i,
      /\bstup[i1]d\b/i,
      /\b[i1]d[i1][o0]t\b/i,
      /\br[e3]t[a4]rd\b/i,
      /\bm[o0]r[o0]n\b/i,
      /\bdumb\b/i,
      /\bl[o0]s[e3]r\b/i,
      /\btr[a4]sh\b/i,
      /\bg[a4]rb[a4]g[e3]\b/i,
      /\bf[a4]gg[o0]t\b/i,
      /\bn[i1]gg[e3]r\b/i,
      /\bc[u]nt\b/i,
    ];
    for (const pattern of toxicPatterns) {
      if (pattern.test(content)) {
        return {
          flagged: true,
          type: 'toxicity',
          confidence: 0.7,
          reason: 'Toxic language detected',
          aiPowered: false,
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
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
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
  if (
    config.action === 'delete' ||
    config.action === 'warn' ||
    config.action === 'timeout'
  ) {
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
      await message.member.timeout(
        5 * 60 * 1000,
        `AI Moderation: ${analysis.reason}`
      );
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
        .setTitle(
          analysis.aiPowered
            ? '🤖 AI Moderation Action (OpenAI Powered)'
            : '🤖 AI Moderation Action (Pattern Match)'
        )
        .setDescription(
          `**User:** ${message.author} (${message.author.tag})\n` +
            `**Channel:** ${message.channel}\n` +
            `**Type:** ${analysis.type.toUpperCase()}\n` +
            `**Reason:** ${analysis.reason}\n` +
            `**Confidence:** ${(analysis.confidence * 100).toFixed(0)}%\n` +
            `**Detection:** ${analysis.aiPowered ? 'OpenAI API' : 'Pattern Matching'}\n` +
            `**Action:** ${config.action}\n\n` +
            `**Message Content:**\n\`\`\`${message.content.substring(0, 500)}\`\`\``
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  }
}
