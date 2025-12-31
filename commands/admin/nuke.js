const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'nuke',
  description: 'Clone and delete the current channel (clears all messages)',
  usage: '[confirmation]',
  category: 'admin',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply('❌ You need Manage Channels permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageChannels
      )
    ) {
      return message.reply('❌ I need Manage Channels permission!');
    }

    if (args[0]?.toLowerCase() !== 'confirm') {
      return message.reply(
        '⚠️ **WARNING:** This will delete and recreate this channel, removing ALL messages!\n' +
          'To confirm, use: `!nuke confirm`'
      );
    }

    const channel = message.channel;
    const position = channel.position;

    try {
      // Clone the channel
      const newChannel = await channel.clone({
        name: channel.name,
        type: channel.type,
        topic: channel.topic,
        nsfw: channel.nsfw,
        bitrate: channel.bitrate,
        userLimit: channel.userLimit,
        rateLimitPerUser: channel.rateLimitPerUser,
        parent: channel.parent,
        permissionOverwrites: channel.permissionOverwrites.cache,
        position: position,
        reason: `Channel nuked by ${message.author.tag}`,
      });

      // Delete the old channel
      await channel.delete();

      // Send confirmation in new channel
      await newChannel.send(`💥 Channel nuked by ${message.author}!`);
    } catch (error) {
      console.error('Error nuking channel:', error);
      message.reply('❌ Failed to nuke channel!');
    }
  },
};
