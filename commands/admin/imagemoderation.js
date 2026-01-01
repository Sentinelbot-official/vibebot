const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'imagemoderation',
  description: 'Configure AI-powered image moderation',
  usage: '//imagemoderation <enable/disable/settings/stats>',
  aliases: ['imgmod', 'imagemod'],
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    if (!process.env.OPENAI_API_KEY) {
      return message.reply(
        '❌ This feature requires an OpenAI API key to be configured!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['enable', 'disable', 'settings', 'stats'].includes(action)) {
      return message.reply(
        '❌ Usage: `//imagemoderation <enable/disable/settings/stats>`'
      );
    }

    const config = db.get('image_moderation', message.guild.id) || {
      enabled: false,
      blockNSFW: true,
      logChannel: null,
    };

    if (action === 'enable') {
      config.enabled = true;
      db.set('image_moderation', message.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Image Moderation Enabled')
        .setDescription(
          '🖼️ AI-powered image moderation is now active!\n\n' +
            '**Features:**\n' +
            '• Automatic NSFW detection\n' +
            '• Real-time image analysis\n' +
            '• Powered by OpenAI Vision API\n\n' +
            '**Next Steps:**\n' +
            '• Set a log channel: `//imagemoderation settings logchannel #channel`\n' +
            '• View stats: `//imagemoderation stats`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'disable') {
      config.enabled = false;
      db.set('image_moderation', message.guild.id, config);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('🚫 Image Moderation Disabled')
        .setDescription('AI-powered image moderation has been disabled.')
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'settings') {
      const setting = args[1]?.toLowerCase();
      const value = args.slice(2).join(' ');

      if (!setting) {
        const embed = new EmbedBuilder()
          .setColor(branding.colors.primary)
          .setTitle('⚙️ Image Moderation Settings')
          .addFields(
            {
              name: 'Status',
              value: config.enabled ? '✅ Enabled' : '❌ Disabled',
              inline: true,
            },
            {
              name: 'Block NSFW',
              value: config.blockNSFW ? '✅ Yes' : '❌ No',
              inline: true,
            },
            {
              name: 'Log Channel',
              value: config.logChannel
                ? `<#${config.logChannel}>`
                : 'Not set',
              inline: true,
            }
          )
          .setDescription(
            '**Available Settings:**\n' +
              '• `logchannel <#channel>` - Set log channel\n' +
              '• `blocknsfw <yes/no>` - Toggle NSFW blocking'
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      if (setting === 'logchannel') {
        const channel = message.mentions.channels.first();
        if (!channel) {
          return message.reply('❌ Please mention a channel!');
        }

        config.logChannel = channel.id;
        db.set('image_moderation', message.guild.id, config);

        return message.reply(
          `✅ Log channel set to ${channel}!`
        );
      }

      if (setting === 'blocknsfw') {
        const enabled = value.toLowerCase() === 'yes';
        config.blockNSFW = enabled;
        db.set('image_moderation', message.guild.id, config);

        return message.reply(
          `✅ NSFW blocking ${enabled ? 'enabled' : 'disabled'}!`
        );
      }

      return message.reply('❌ Invalid setting!');
    }

    if (action === 'stats') {
      const stats = db.get('image_mod_stats', message.guild.id) || {
        totalScans: 0,
        totalBlocked: 0,
      };

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📊 Image Moderation Statistics')
        .addFields(
          {
            name: '🔍 Total Scans',
            value: stats.totalScans.toString(),
            inline: true,
          },
          {
            name: '🚫 Images Blocked',
            value: stats.totalBlocked.toString(),
            inline: true,
          },
          {
            name: '✅ Pass Rate',
            value:
              stats.totalScans > 0
                ? `${(((stats.totalScans - stats.totalBlocked) / stats.totalScans) * 100).toFixed(1)}%`
                : 'N/A',
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
