const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'antiraid',
  description: 'Configure anti-raid protection',
  usage: '<enable|disable|settings> [threshold] [timeWindow]',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    const antiRaid = settings.antiRaid || {
      enabled: false,
      threshold: 5,
      timeWindow: 10,
    };

    const action = args[0]?.toLowerCase();

    if (!action) {
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🛡️ Anti-Raid Settings')
        .addFields(
          {
            name: 'Status',
            value: antiRaid.enabled ? '✅ Enabled' : '❌ Disabled',
            inline: true,
          },
          {
            name: 'Threshold',
            value: `${antiRaid.threshold} joins`,
            inline: true,
          },
          {
            name: 'Time Window',
            value: `${antiRaid.timeWindow} seconds`,
            inline: true,
          },
          {
            name: 'How It Works',
            value:
              'If the threshold of joins is reached within the time window, all recent joiners will be kicked.',
            inline: false,
          },
          {
            name: 'Usage',
            value:
              '`antiraid enable` - Enable protection\n`antiraid disable` - Disable protection\n`antiraid settings <threshold> <timeWindow>` - Configure settings',
            inline: false,
          }
        )
        .setFooter({ text: 'Protects against mass join raids' });

      return message.reply({ embeds: [embed] });
    }

    if (action === 'enable') {
      antiRaid.enabled = true;
      settings.antiRaid = antiRaid;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Anti-raid protection **enabled**! (${antiRaid.threshold} joins in ${antiRaid.timeWindow}s)`
      );
    }

    if (action === 'disable') {
      antiRaid.enabled = false;
      settings.antiRaid = antiRaid;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply('❌ Anti-raid protection **disabled**.');
    }

    if (action === 'settings') {
      const threshold = parseInt(args[1]);
      const timeWindow = parseInt(args[2]);

      if (isNaN(threshold) || threshold < 3 || threshold > 20) {
        return message.reply('❌ Threshold must be between 3 and 20!');
      }

      if (isNaN(timeWindow) || timeWindow < 5 || timeWindow > 60) {
        return message.reply(
          '❌ Time window must be between 5 and 60 seconds!'
        );
      }

      antiRaid.threshold = threshold;
      antiRaid.timeWindow = timeWindow;
      settings.antiRaid = antiRaid;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Anti-Raid Settings Updated')
        .addFields(
          { name: 'Threshold', value: `${threshold} joins`, inline: true },
          { name: 'Time Window', value: `${timeWindow} seconds`, inline: true },
          {
            name: 'Status',
            value: antiRaid.enabled
              ? '✅ Enabled'
              : '❌ Disabled (use `antiraid enable`)',
            inline: false,
          }
        );

      return message.reply({ embeds: [embed] });
    }

    message.reply('❌ Invalid action! Use: `enable`, `disable`, or `settings`');
  },
};
