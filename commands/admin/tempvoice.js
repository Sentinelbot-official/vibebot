const {
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'tempvoice',
  description: 'Setup temporary voice channels',
  usage: '<setup/disable> [#channel]',
  aliases: ['tempvc'],
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('❌ You need Manage Channels permission!');
    }

    const action = args[0]?.toLowerCase();
    const settings = db.get('guild_settings', message.guild.id) || {};

    if (action === 'setup') {
      const channel = message.mentions.channels.first();
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        return message.reply('❌ Please mention a voice channel!');
      }

      settings.tempVoice = { enabled: true, channelId: channel.id };
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Temp voice setup! Join ${channel} to create your own channel.`
      );
    }

    if (action === 'disable') {
      settings.tempVoice = { enabled: false };
      db.set('guild_settings', message.guild.id, settings);
      return message.reply('✅ Temp voice disabled!');
    }

    const status = settings.tempVoice?.enabled ? 'Enabled' : 'Disabled';
    return message.reply(
      `Temp voice is ${status}. Use \`tempvoice setup #channel\` to enable.`
    );
  },
};
