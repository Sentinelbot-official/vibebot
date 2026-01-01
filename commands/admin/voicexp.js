const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'voicexp',
  description: 'Configure voice XP system',
  usage: '//voicexp <enable/disable/settings>',
  aliases: ['vxp', 'voicexpconfig'],
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['enable', 'disable', 'settings'].includes(action)) {
      return message.reply(
        '❌ Usage: `//voicexp <enable/disable/settings>`'
      );
    }

    const config = db.get('voice_xp_config', message.guild.id) || {
      enabled: true,
      xpPerMinute: 5,
      afkChannelXP: false,
    };

    if (action === 'enable') {
      config.enabled = true;
      db.set('voice_xp_config', message.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Voice XP Enabled')
        .setDescription(
          '🎤 Members will now earn XP for time spent in voice channels!\n\n' +
            `**Current Settings:**\n` +
            `• XP per minute: ${config.xpPerMinute}\n` +
            `• AFK channel XP: ${config.afkChannelXP ? 'Enabled' : 'Disabled'}\n\n` +
            'Use `//voicexp settings` to customize.'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'disable') {
      config.enabled = false;
      db.set('voice_xp_config', message.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('🚫 Voice XP Disabled')
        .setDescription('Members will no longer earn XP from voice channels.')
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'settings') {
      const setting = args[1]?.toLowerCase();
      const value = args[2];

      if (!setting) {
        const embed = new EmbedBuilder()
          .setColor(branding.colors.primary)
          .setTitle('⚙️ Voice XP Settings')
          .addFields(
            {
              name: 'Status',
              value: config.enabled ? '✅ Enabled' : '❌ Disabled',
              inline: true,
            },
            {
              name: 'XP per Minute',
              value: config.xpPerMinute.toString(),
              inline: true,
            },
            {
              name: 'AFK Channel XP',
              value: config.afkChannelXP ? '✅ Enabled' : '❌ Disabled',
              inline: true,
            }
          )
          .setDescription(
            '**Available Settings:**\n' +
              '• `xprate <amount>` - Set XP per minute (1-20)\n' +
              '• `afkchannel <yes/no>` - Toggle XP in AFK channel'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (setting === 'xprate') {
        const amount = parseInt(value);
        if (isNaN(amount) || amount < 1 || amount > 20) {
          return message.reply('❌ XP rate must be between 1 and 20!');
        }

        config.xpPerMinute = amount;
        db.set('voice_xp_config', message.guild.id, config);

        return message.reply(
          `✅ Voice XP rate set to **${amount} XP per minute**!`
        );
      }

      if (setting === 'afkchannel') {
        const enabled = value?.toLowerCase() === 'yes';
        config.afkChannelXP = enabled;
        db.set('voice_xp_config', message.guild.id, config);

        return message.reply(
          `✅ AFK channel XP ${enabled ? 'enabled' : 'disabled'}!`
        );
      }

      return message.reply('❌ Invalid setting!');
    }
  },
};
