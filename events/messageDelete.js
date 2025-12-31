const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const snipeCommand = require('../commands/utility/snipe');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    // Store for snipe command
    snipeCommand.storeDeleted(message);
    // Ignore bot messages and messages without content
    if (message.author?.bot) return;
    if (!message.content && message.attachments.size === 0) return;

    const settings = db.get('guild_settings', message.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = message.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setAuthor({
        name: message.author
          ? `${message.author.tag} (${message.author.id})`
          : 'Unknown User',
        iconURL: message.author?.displayAvatarURL(),
      })
      .setTitle('🗑️ Message Deleted')
      .addFields(
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Message ID', value: message.id, inline: true }
      )
      .setTimestamp();

    if (message.content) {
      embed.addFields({
        name: 'Content',
        value: message.content.substring(0, 1024),
        inline: false,
      });
    }

    if (message.attachments.size > 0) {
      const attachments = message.attachments.map(a => a.url).join('\n');
      embed.addFields({
        name: 'Attachments',
        value: attachments.substring(0, 1024),
        inline: false,
      });
    }

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error logging message deletion:', error);
    }
  },
};
