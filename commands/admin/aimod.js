const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'aimod',
  aliases: ['aimoderation', 'smartmod'],
  description: 'Configure AI-powered content moderation',
  usage: '<enable/disable/config/stats>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageGuild],
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action) {
      const config = db.get('ai_moderation', message.guild.id) || {
        enabled: false,
      };

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🤖 AI Moderation System')
        .setDescription(
          '**Intelligent content filtering powered by AI**\n\n' +
            `**Status:** ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
            '**Features:**\n' +
            '• 🔞 NSFW content detection\n' +
            '• ☠️ Toxicity & hate speech detection\n' +
            '• 🎣 Phishing & scam detection\n' +
            '• 📢 Spam pattern recognition\n' +
            '• 🔗 Malicious link scanning\n\n' +
            '**Commands:**\n' +
            '`//aimod enable` - Enable AI moderation\n' +
            '`//aimod disable` - Disable AI moderation\n' +
            '`//aimod config` - Configure settings\n' +
            '`//aimod stats` - View moderation stats'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'enable') {
      const config = db.get('ai_moderation', message.guild.id) || {};

      config.enabled = true;
      config.nsfw = config.nsfw !== false;
      config.toxicity = config.toxicity !== false;
      config.phishing = config.phishing !== false;
      config.spam = config.spam !== false;
      config.threshold = config.threshold || 0.7;
      config.action = config.action || 'delete';
      config.logChannel = config.logChannel || null;

      db.set('ai_moderation', message.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ AI Moderation Enabled!')
        .setDescription(
          '**Your server is now protected by AI!**\n\n' +
            '**Active Filters:**\n' +
            `${config.nsfw ? '✅' : '❌'} NSFW Content\n` +
            `${config.toxicity ? '✅' : '❌'} Toxicity Detection\n` +
            `${config.phishing ? '✅' : '❌'} Phishing Detection\n` +
            `${config.spam ? '✅' : '❌'} Spam Detection\n\n` +
            `**Confidence Threshold:** ${(config.threshold * 100).toFixed(0)}%\n` +
            `**Action:** ${config.action}\n\n` +
            'Use `//aimod config` to customize settings.'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'disable') {
      const config = db.get('ai_moderation', message.guild.id) || {};
      config.enabled = false;
      db.set('ai_moderation', message.guild.id, config);

      return message.reply('✅ AI moderation has been disabled.');
    }

    if (action === 'config') {
      const config = db.get('ai_moderation', message.guild.id) || {
        enabled: false,
        nsfw: true,
        toxicity: true,
        phishing: true,
        spam: true,
        threshold: 0.7,
        action: 'delete',
      };

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('⚙️ AI Moderation Configuration')
        .setDescription(
          '**Current Settings:**\n\n' +
            `**Status:** ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n` +
            `**NSFW Filter:** ${config.nsfw ? '✅ On' : '❌ Off'}\n` +
            `**Toxicity Filter:** ${config.toxicity ? '✅ On' : '❌ Off'}\n` +
            `**Phishing Filter:** ${config.phishing ? '✅ On' : '❌ Off'}\n` +
            `**Spam Filter:** ${config.spam ? '✅ On' : '❌ Off'}\n` +
            `**Confidence Threshold:** ${(config.threshold * 100).toFixed(0)}%\n` +
            `**Action:** ${config.action}\n` +
            `**Log Channel:** ${config.logChannel ? `<#${config.logChannel}>` : 'Not set'}\n\n` +
            '**To Configure:**\n' +
            '`//aimod config nsfw <on/off>`\n' +
            '`//aimod config toxicity <on/off>`\n' +
            '`//aimod config phishing <on/off>`\n' +
            '`//aimod config spam <on/off>`\n' +
            '`//aimod config threshold <0-100>`\n' +
            '`//aimod config action <delete/warn/timeout>`\n' +
            '`//aimod config log <#channel>`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      if (args[1]) {
        const setting = args[1].toLowerCase();
        const value = args[2]?.toLowerCase();

        if (setting === 'nsfw' || setting === 'toxicity' || setting === 'phishing' || setting === 'spam') {
          if (value === 'on' || value === 'off') {
            config[setting] = value === 'on';
            db.set('ai_moderation', message.guild.id, config);
            return message.reply(`✅ ${setting} filter ${value === 'on' ? 'enabled' : 'disabled'}!`);
          }
        }

        if (setting === 'threshold') {
          const threshold = parseInt(value);
          if (threshold >= 0 && threshold <= 100) {
            config.threshold = threshold / 100;
            db.set('ai_moderation', message.guild.id, config);
            return message.reply(`✅ Confidence threshold set to ${threshold}%`);
          }
        }

        if (setting === 'action') {
          if (['delete', 'warn', 'timeout'].includes(value)) {
            config.action = value;
            db.set('ai_moderation', message.guild.id, config);
            return message.reply(`✅ Action set to: ${value}`);
          }
        }

        if (setting === 'log') {
          const channel = message.mentions.channels.first();
          if (channel) {
            config.logChannel = channel.id;
            db.set('ai_moderation', message.guild.id, config);
            return message.reply(`✅ Log channel set to ${channel}`);
          }
        }
      }

      return message.reply({ embeds: [embed] });
    }

    if (action === 'stats') {
      const stats = db.get('ai_mod_stats', message.guild.id) || {
        totalScans: 0,
        totalBlocked: 0,
        nsfw: 0,
        toxicity: 0,
        phishing: 0,
        spam: 0,
      };

      const blockRate =
        stats.totalScans > 0
          ? ((stats.totalBlocked / stats.totalScans) * 100).toFixed(2)
          : 0;

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📊 AI Moderation Statistics')
        .setDescription(
          `**Total Messages Scanned:** ${branding.formatNumber(stats.totalScans)}\n` +
            `**Total Blocked:** ${branding.formatNumber(stats.totalBlocked)}\n` +
            `**Block Rate:** ${blockRate}%\n\n` +
            '**Breakdown:**\n' +
            `🔞 NSFW: ${branding.formatNumber(stats.nsfw)}\n` +
            `☠️ Toxicity: ${branding.formatNumber(stats.toxicity)}\n` +
            `🎣 Phishing: ${branding.formatNumber(stats.phishing)}\n` +
            `📢 Spam: ${branding.formatNumber(stats.spam)}`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
