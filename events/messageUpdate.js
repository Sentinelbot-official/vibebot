const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const editsnipeCommand = require('../commands/utility/editsnipe');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    // Store for editsnipe command
    editsnipeCommand.storeEdited(oldMessage, newMessage);
    // Ignore bot messages and non-text changes
    if (newMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const settings = db.get('guild_settings', newMessage.guild.id) || {};
    if (!settings.logChannel) return;

    const logChannel = newMessage.guild.channels.cache.get(settings.logChannel);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setAuthor({
        name: `${newMessage.author.tag} (${newMessage.author.id})`,
        iconURL: newMessage.author.displayAvatarURL({ dynamic: true }),
      })
      .setTitle('📝 Message Edited')
      .addFields(
        { name: 'Channel', value: `${newMessage.channel}`, inline: true },
        { name: 'Message ID', value: newMessage.id, inline: true },
        {
          name: 'Jump to Message',
          value: `[Click Here](${newMessage.url})`,
          inline: true,
        },
        {
          name: 'Before',
          value: oldMessage.content.substring(0, 1024) || '*No content*',
          inline: false,
        },
        {
          name: 'After',
          value: newMessage.content.substring(0, 1024) || '*No content*',
          inline: false,
        }
      )
      .setTimestamp();

    try {
      await logChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error logging message edit:', error);
    }
  },
};
