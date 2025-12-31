const { EmbedBuilder } = require('discord.js');

// Store deleted messages (in memory, resets on bot restart)
const deletedMessages = new Map();

module.exports = {
  name: 'snipe',
  aliases: ['s'],
  description: 'View the last deleted message in this channel',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  execute(message, args) {
    const snipedMessage = deletedMessages.get(message.channel.id);

    if (!snipedMessage) {
      return message.reply(
        '❌ There are no recently deleted messages in this channel!'
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setAuthor({
        name: snipedMessage.author.tag,
        iconURL: snipedMessage.author.displayAvatarURL(),
      })
      .setDescription(snipedMessage.content || '*No content*')
      .setFooter({ text: 'Deleted' })
      .setTimestamp(snipedMessage.deletedAt);

    if (snipedMessage.attachments.length > 0) {
      embed.addFields({
        name: 'Attachments',
        value: snipedMessage.attachments.join('\n'),
        inline: false,
      });
    }

    message.reply({ embeds: [embed] });
  },

  // Helper function to store deleted messages (called from event)
  storeDeleted(message) {
    if (message.author.bot) return;

    deletedMessages.set(message.channel.id, {
      content: message.content,
      author: message.author,
      deletedAt: new Date(),
      attachments: message.attachments.map(a => a.url),
    });

    // Clear after 60 seconds
    setTimeout(() => {
      deletedMessages.delete(message.channel.id);
    }, 60000);
  },
};
