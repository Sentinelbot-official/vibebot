const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const twitchApi = require('../../utils/twitchApi');
const branding = require('../../utils/branding');

module.exports = {
  name: 'twitchnotify',
  aliases: ['twitchalert', 'livealert'],
  description: 'Configure Twitch live notifications for your server',
  usage:
    '<enable/disable/add/remove/list/channel/role/message/reward> [options]',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need the **Manage Server** permission to configure Twitch notifications!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (
      !action ||
      ![
        'enable',
        'disable',
        'add',
        'remove',
        'list',
        'channel',
        'role',
        'message',
        'reward',
      ].includes(action)
    ) {
      const settings = db.get('guild_settings', message.guild.id) || {};
      const twitchSettings = settings.twitchNotifications || {};

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🔴 Twitch Live Notifications')
        .setDescription(
          '**Get notified when your favorite streamers go live!**\n\n' +
            '**Commands:**\n' +
            '`//twitchnotify enable` - Enable notifications\n' +
            '`//twitchnotify disable` - Disable notifications\n' +
            '`//twitchnotify channel <#channel>` - Set notification channel\n' +
            '`//twitchnotify add <username>` - Add streamer to track\n' +
            '`//twitchnotify remove <username>` - Remove streamer\n' +
            '`//twitchnotify list` - List tracked streamers\n' +
            '`//twitchnotify role <@role>` - Set mention role (optional)\n' +
            '`//twitchnotify message <text>` - Custom notification message\n' +
            '`//twitchnotify reward <on/off>` - Reward viewers with coins\n\n' +
            '**Custom Message Variables:**\n' +
            '`{streamer}` - Streamer name\n' +
            '`{game}` - Game/category\n' +
            '`{title}` - Stream title\n' +
            '`{url}` - Stream URL\n\n' +
            '**Current Status:**\n' +
            `Enabled: ${twitchSettings.enabled ? '✅' : '❌'}\n` +
            `Channel: ${twitchSettings.channelId ? `<#${twitchSettings.channelId}>` : 'Not set'}\n` +
            `Streamers: ${twitchSettings.streamers?.length || 0}\n` +
            `Mention Role: ${twitchSettings.mentionRole ? `<@&${twitchSettings.mentionRole}>` : 'None'}\n` +
            `Reward Viewers: ${twitchSettings.rewardViewers ? '✅' : '❌'}`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    if (!settings.twitchNotifications) {
      settings.twitchNotifications = {
        enabled: false,
        channelId: null,
        streamers: [],
        mentionRole: null,
        customMessage: null,
        rewardViewers: false,
      };
    }

    if (action === 'enable') {
      if (!settings.twitchNotifications.channelId) {
        return message.reply(
          '❌ Please set a notification channel first using `//twitchnotify channel <#channel>`'
        );
      }

      if (settings.twitchNotifications.streamers.length === 0) {
        return message.reply(
          '❌ Please add at least one streamer using `//twitchnotify add <username>`'
        );
      }

      settings.twitchNotifications.enabled = true;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        "✅ Twitch live notifications enabled! I'll post alerts in <#" +
          settings.twitchNotifications.channelId +
          '>'
      );
    }

    if (action === 'disable') {
      settings.twitchNotifications.enabled = false;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply('✅ Twitch live notifications disabled!');
    }

    if (action === 'channel') {
      const channel =
        message.mentions.channels.first() ||
        message.guild.channels.cache.get(args[1]);

      if (!channel) {
        return message.reply(
          '❌ Please mention a channel or provide a channel ID!'
        );
      }

      if (!channel.isTextBased()) {
        return message.reply('❌ Please provide a text channel!');
      }

      settings.twitchNotifications.channelId = channel.id;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Twitch notifications will be posted in ${channel}!`
      );
    }

    if (action === 'add') {
      const username = args[1];

      if (!username) {
        return message.reply('❌ Please provide a Twitch username!');
      }

      // Verify the user exists
      const user = await twitchApi.getUserByUsername(username);

      if (!user) {
        return message.reply(
          `❌ Twitch user **${username}** not found! Make sure the username is correct.`
        );
      }

      if (settings.twitchNotifications.streamers.includes(user.login)) {
        return message.reply(
          `❌ **${user.display_name}** is already being tracked!`
        );
      }

      settings.twitchNotifications.streamers.push(user.login);
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Added **${user.display_name}** to tracked streamers!\n` +
          `Profile: https://twitch.tv/${user.login}`
      );
    }

    if (action === 'remove') {
      const username = args[1]?.toLowerCase();

      if (!username) {
        return message.reply('❌ Please provide a Twitch username!');
      }

      const index = settings.twitchNotifications.streamers.indexOf(username);

      if (index === -1) {
        return message.reply(`❌ **${username}** is not being tracked!`);
      }

      settings.twitchNotifications.streamers.splice(index, 1);
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Removed **${username}** from tracked streamers!`
      );
    }

    if (action === 'list') {
      const streamers = settings.twitchNotifications.streamers;

      if (streamers.length === 0) {
        return message.reply('📭 No streamers are being tracked!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🔴 Tracked Streamers')
        .setDescription(
          streamers
            .map((s, i) => `${i + 1}. **${s}** - https://twitch.tv/${s}`)
            .join('\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'role') {
      const role = message.mentions.roles.first();

      if (!role) {
        // Remove role mention
        settings.twitchNotifications.mentionRole = null;
        db.set('guild_settings', message.guild.id, settings);

        return message.reply(
          '✅ Role mention removed! Notifications will no longer ping anyone.'
        );
      }

      settings.twitchNotifications.mentionRole = role.id;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ ${role} will be mentioned when streamers go live!`
      );
    }

    if (action === 'message') {
      const customMessage = args.slice(1).join(' ');

      if (!customMessage) {
        // Reset to default
        settings.twitchNotifications.customMessage = null;
        db.set('guild_settings', message.guild.id, settings);

        return message.reply(
          '✅ Custom message reset to default!\n' +
            'Default: `🔴 **{streamer}** is now LIVE!`'
        );
      }

      settings.twitchNotifications.customMessage = customMessage;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Custom notification message set!\n**Preview:** ${customMessage.replace('{streamer}', 'ExampleStreamer').replace('{game}', 'Just Chatting').replace('{title}', 'Example Stream').replace('{url}', 'https://twitch.tv/example')}`
      );
    }

    if (action === 'reward') {
      const toggle = args[1]?.toLowerCase();

      if (!toggle || !['on', 'off'].includes(toggle)) {
        return message.reply(
          '❌ Please specify `on` or `off`!\n' +
            'Example: `//twitchnotify reward on`'
        );
      }

      settings.twitchNotifications.rewardViewers = toggle === 'on';
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        toggle === 'on'
          ? '✅ Viewer rewards enabled! Members in voice channels will receive coins when streams go live!'
          : '✅ Viewer rewards disabled!'
      );
    }
  },
};
