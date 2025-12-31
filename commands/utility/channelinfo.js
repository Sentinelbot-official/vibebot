const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  name: 'channelinfo',
  aliases: ['cinfo', 'channel'],
  description: 'Get information about a channel',
  usage: '[#channel]',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  execute(message, args) {
    const channel = message.mentions.channels.first() || message.channel;

    const typeNames = {
      [ChannelType.GuildText]: 'Text Channel',
      [ChannelType.GuildVoice]: 'Voice Channel',
      [ChannelType.GuildCategory]: 'Category',
      [ChannelType.GuildAnnouncement]: 'Announcement Channel',
      [ChannelType.GuildStageVoice]: 'Stage Channel',
      [ChannelType.GuildForum]: 'Forum Channel',
    };

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Channel Information: #${channel.name}`)
      .addFields(
        { name: 'ID', value: channel.id, inline: true },
        {
          name: 'Type',
          value: typeNames[channel.type] || 'Unknown',
          inline: true,
        },
        {
          name: 'Created',
          value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:R>`,
          inline: true,
        }
      );

    if (channel.topic) {
      embed.addFields({
        name: 'Topic',
        value: channel.topic.substring(0, 1024),
        inline: false,
      });
    }

    if (channel.type === ChannelType.GuildText) {
      embed.addFields(
        { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
        {
          name: 'Slowmode',
          value: channel.rateLimitPerUser
            ? `${channel.rateLimitPerUser}s`
            : 'Off',
          inline: true,
        }
      );
    }

    if (channel.type === ChannelType.GuildVoice) {
      embed.addFields(
        {
          name: 'Bitrate',
          value: `${channel.bitrate / 1000}kbps`,
          inline: true,
        },
        {
          name: 'User Limit',
          value: channel.userLimit ? `${channel.userLimit}` : 'Unlimited',
          inline: true,
        },
        { name: 'Members', value: `${channel.members.size}`, inline: true }
      );
    }

    if (channel.parent) {
      embed.addFields({
        name: 'Category',
        value: channel.parent.name,
        inline: true,
      });
    }

    embed.addFields({
      name: 'Position',
      value: `${channel.position}`,
      inline: true,
    });

    message.reply({ embeds: [embed] });
  },
};
