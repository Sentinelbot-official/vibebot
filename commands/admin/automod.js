const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'automod',
  description: 'Configure auto-moderation settings',
  usage: '<enable|disable|settings> [option]',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(
        '❌ You need Administrator permission to use this command!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action) {
      return message.reply(
        '❌ Usage: `automod <enable|disable|settings> [option]`'
      );
    }

    // Get guild settings
    const settings = db.get('guild_settings', message.guild.id) || {};
    if (!settings.automod) {
      settings.automod = {
        enabled: false,
        antiSpam: true,
        antiInvites: true,
        antiLinks: false,
        antiCaps: true,
        antiMassMention: true,
      };
    }

    if (action === 'enable') {
      settings.automod.enabled = true;
      db.set('guild_settings', message.guild.id, settings);
      return message.reply('✅ Auto-moderation enabled!');
    }

    if (action === 'disable') {
      settings.automod.enabled = false;
      db.set('guild_settings', message.guild.id, settings);
      return message.reply('✅ Auto-moderation disabled!');
    }

    if (action === 'settings') {
      const option = args[1]?.toLowerCase();

      if (!option) {
        // Show current settings
        const embed = new EmbedBuilder()
          .setColor(branding.colors.info)
          .setTitle('🛡️ Auto-Mod Settings')
          .addFields(
            {
              name: 'Status',
              value: settings.automod.enabled ? '✅ Enabled' : '❌ Disabled',
              inline: true,
            },
            {
              name: 'Anti-Spam',
              value: settings.automod.antiSpam ? '✅' : '❌',
              inline: true,
            },
            {
              name: 'Anti-Invites',
              value: settings.automod.antiInvites ? '✅' : '❌',
              inline: true,
            },
            {
              name: 'Anti-Links',
              value: settings.automod.antiLinks ? '✅' : '❌',
              inline: true,
            },
            {
              name: 'Anti-Caps',
              value: settings.automod.antiCaps ? '✅' : '❌',
              inline: true,
            },
            {
              name: 'Anti-Mass-Mention',
              value: settings.automod.antiMassMention ? '✅' : '❌',
              inline: true,
            }
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // Toggle specific setting
      const validOptions = [
        'antispam',
        'antiinvites',
        'antilinks',
        'anticaps',
        'antimassmention',
      ];
      if (!validOptions.includes(option.replace('-', ''))) {
        return message.reply(
          '❌ Invalid option! Valid options: antiSpam, antiInvites, antiLinks, antiCaps, antiMassMention'
        );
      }

      const settingKey = option.replace('-', '');
      const camelCase = settingKey.replace(/([A-Z])/g, (match, p1, offset) =>
        offset === 0 ? match.toLowerCase() : match
      );

      // Find the correct key
      let key = null;
      for (const k of Object.keys(settings.automod)) {
        if (k.toLowerCase() === camelCase.toLowerCase()) {
          key = k;
          break;
        }
      }

      if (key) {
        settings.automod[key] = !settings.automod[key];
        db.set('guild_settings', message.guild.id, settings);
        return message.reply(
          `✅ ${key} is now ${settings.automod[key] ? 'enabled' : 'disabled'}!`
        );
      }
    }

    return message.reply(
      '❌ Invalid action! Use: enable, disable, or settings'
    );
  },
};
