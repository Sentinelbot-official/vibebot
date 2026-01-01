const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'enlarge',
  aliases: ['bigemoji', 'jumbo'],
  description: 'Enlarge a custom emoji',
  usage: '<emoji>',
  category: 'utility',
  cooldown: 3,
  execute(message, args) {
    if (!args[0]) {
      return message.reply('❌ Please provide an emoji!');
    }

    // Parse emoji from message
    const emojiMatch = args[0].match(/<a?:(\w+):(\d+)>/);

    if (!emojiMatch) {
      return message.reply('❌ Please provide a valid custom emoji!');
    }

    const emojiName = emojiMatch[1];
    const emojiId = emojiMatch[2];
    const isAnimated = args[0].startsWith('<a:');
    const extension = isAnimated ? 'gif' : 'png';
    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle(`:${emojiName}:`)
      .setImage(emojiUrl)
      .addFields(
        { name: 'ID', value: emojiId, inline: true },
        { name: 'Animated', value: isAnimated ? 'Yes' : 'No', inline: true },
        { name: 'Link', value: `[Download](${emojiUrl})`, inline: true }
      );

    message.reply({ embeds: [embed] });
  },
};
