const { EmbedBuilder } = require('discord.js');

// Store edited messages (in memory, resets on bot restart)
const editedMessages = new Map();

module.exports = {
  name: 'editsnipe',
  aliases: ['esnipe', 'es'],
  description: 'View the last edited message in this channel',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  execute(message, args) {
    const snipedEdit = editedMessages.get(message.channel.id);

    if (!snipedEdit) {
      return message.reply(
        '❌ There are no recently edited messages in this channel!'
      );
    }

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setAuthor({
        name: snipedEdit.author.tag,
        iconURL: snipedEdit.author.displayAvatarURL(),
      })
      .addFields(
        {
          name: 'Before',
          value: snipedEdit.before.substring(0, 1024) || '*No content*',
          inline: false,
        },
        {
          name: 'After',
          value: snipedEdit.after.substring(0, 1024) || '*No content*',
          inline: false,
        }
      )
      .setFooter({ text: 'Edited' })
      .setTimestamp(snipedEdit.editedAt);

    message.reply({ embeds: [embed] });
  },

  // Helper function to store edited messages (called from event)
  storeEdited(oldMessage, newMessage) {
    if (newMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;

    editedMessages.set(newMessage.channel.id, {
      before: oldMessage.content,
      after: newMessage.content,
      author: newMessage.author,
      editedAt: new Date(),
    });

    // Clear after 60 seconds
    setTimeout(() => {
      editedMessages.delete(newMessage.channel.id);
    }, 60000);
  },
};
