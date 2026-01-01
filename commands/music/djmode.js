const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'djmode',
  aliases: ['dj', 'djcontrols'],
  description: 'Enable DJ mode with advanced controls',
  usage: '<enable/disable/settings>',
  category: 'music',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['enable', 'disable', 'settings'].includes(action)) {
      const djConfig = db.get('dj_mode', message.guild.id) || {
        enabled: false,
      };

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎧 DJ Mode')
        .setDescription(
          `**Status:** ${djConfig.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
            '**Features:**\n' +
            '• 🎛️ Crossfade between songs\n' +
            '• 🔊 Volume normalization\n' +
            '• ⏭️ Smart queue management\n' +
            '• 🎵 Auto-DJ (plays similar songs)\n' +
            '• 🎪 DJ role restrictions\n\n' +
            '**Commands:**\n' +
            '`//djmode enable` - Enable DJ mode\n' +
            '`//djmode disable` - Disable DJ mode\n' +
            '`//djmode settings` - Configure settings'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need **Manage Server** permission to manage DJ mode!'
      );
    }

    if (action === 'enable') {
      const djConfig = db.get('dj_mode', message.guild.id) || {};

      djConfig.enabled = true;
      djConfig.crossfade = djConfig.crossfade !== false;
      djConfig.autoVolume = djConfig.autoVolume !== false;
      djConfig.autoDJ = djConfig.autoDJ || false;
      djConfig.djRole = djConfig.djRole || null;

      db.set('dj_mode', message.guild.id, djConfig);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ DJ Mode Enabled!')
        .setDescription(
          '**Active Features:**\n' +
            `${djConfig.crossfade ? '✅' : '❌'} Crossfade\n` +
            `${djConfig.autoVolume ? '✅' : '❌'} Auto Volume\n` +
            `${djConfig.autoDJ ? '✅' : '❌'} Auto-DJ\n` +
            `${djConfig.djRole ? `✅ DJ Role: <@&${djConfig.djRole}>` : '❌ No DJ Role'}\n\n` +
            'Use `//djmode settings` to customize!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'disable') {
      const djConfig = db.get('dj_mode', message.guild.id) || {};
      djConfig.enabled = false;
      db.set('dj_mode', message.guild.id, djConfig);

      return message.reply('✅ DJ mode has been disabled.');
    }

    if (action === 'settings') {
      const djConfig = db.get('dj_mode', message.guild.id) || {
        enabled: false,
        crossfade: true,
        autoVolume: true,
        autoDJ: false,
        djRole: null,
      };

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('⚙️ DJ Mode Settings')
        .setDescription(
          `**Status:** ${djConfig.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n` +
            '**Current Settings:**\n' +
            `🎛️ **Crossfade:** ${djConfig.crossfade ? 'On' : 'Off'}\n` +
            `🔊 **Auto Volume:** ${djConfig.autoVolume ? 'On' : 'Off'}\n` +
            `🎵 **Auto-DJ:** ${djConfig.autoDJ ? 'On' : 'Off'}\n` +
            `🎪 **DJ Role:** ${djConfig.djRole ? `<@&${djConfig.djRole}>` : 'Not set'}\n\n` +
            '**To Configure:**\n' +
            '`//djmode settings crossfade <on/off>`\n' +
            '`//djmode settings autovolume <on/off>`\n' +
            '`//djmode settings autodj <on/off>`\n' +
            '`//djmode settings role <@role>`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      // Handle setting changes
      if (args[1]) {
        const setting = args[1].toLowerCase();
        const value = args[2]?.toLowerCase();

        if (setting === 'crossfade' && (value === 'on' || value === 'off')) {
          djConfig.crossfade = value === 'on';
          db.set('dj_mode', message.guild.id, djConfig);
          return message.reply(
            `✅ Crossfade ${value === 'on' ? 'enabled' : 'disabled'}!`
          );
        }

        if (setting === 'autovolume' && (value === 'on' || value === 'off')) {
          djConfig.autoVolume = value === 'on';
          db.set('dj_mode', message.guild.id, djConfig);
          return message.reply(
            `✅ Auto volume ${value === 'on' ? 'enabled' : 'disabled'}!`
          );
        }

        if (setting === 'autodj' && (value === 'on' || value === 'off')) {
          djConfig.autoDJ = value === 'on';
          db.set('dj_mode', message.guild.id, djConfig);
          return message.reply(
            `✅ Auto-DJ ${value === 'on' ? 'enabled' : 'disabled'}!`
          );
        }

        if (setting === 'role') {
          const role = message.mentions.roles.first();
          if (role) {
            djConfig.djRole = role.id;
            db.set('dj_mode', message.guild.id, djConfig);
            return message.reply(`✅ DJ role set to ${role}!`);
          }
        }
      }

      return message.reply({ embeds: [embed] });
    }
  },
};
