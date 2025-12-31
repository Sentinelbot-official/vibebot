const { EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'channelUpdate',
  async execute(oldChannel, newChannel) {
    const settings = db.get('guild_settings', newChannel.guild.id) || {};
    if (!settings.logChannel) return;

    const logChannel = newChannel.guild.channels.cache.get(settings.logChannel);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('🔧 Channel Updated')
      .setTimestamp();

    const changes = [];

    // Name changed
    if (oldChannel.name !== newChannel.name) {
      changes.push({
        name: 'Name Changed',
        value: `${oldChannel.name} → ${newChannel.name}`,
        inline: false,
      });
    }

    // Topic changed (text channels)
    if (
      oldChannel.topic !== newChannel.topic &&
      newChannel.type === ChannelType.GuildText
    ) {
      changes.push({
        name: 'Topic Changed',
        value:
          `**Before:** ${oldChannel.topic || '*None*'}\n**After:** ${newChannel.topic || '*None*'}`.substring(
            0,
            1024
          ),
        inline: false,
      });
    }

    // NSFW changed
    if (oldChannel.nsfw !== newChannel.nsfw) {
      changes.push({
        name: 'NSFW',
        value: newChannel.nsfw ? 'Enabled' : 'Disabled',
        inline: true,
      });
    }

    // Slowmode changed
    if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) {
      changes.push({
        name: 'Slowmode',
        value: `${oldChannel.rateLimitPerUser || 0}s → ${newChannel.rateLimitPerUser || 0}s`,
        inline: true,
      });
    }

    // Bitrate changed (voice channels)
    if (oldChannel.bitrate !== newChannel.bitrate) {
      changes.push({
        name: 'Bitrate',
        value: `${oldChannel.bitrate / 1000}kbps → ${newChannel.bitrate / 1000}kbps`,
        inline: true,
      });
    }

    // User limit changed (voice channels)
    if (oldChannel.userLimit !== newChannel.userLimit) {
      changes.push({
        name: 'User Limit',
        value: `${oldChannel.userLimit || 'Unlimited'} → ${newChannel.userLimit || 'Unlimited'}`,
        inline: true,
      });
    }

    if (changes.length === 0) return;

    embed.setDescription(`Channel: ${newChannel}`).addFields(changes);

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error logging channel update:', error);
    }
  },
};
