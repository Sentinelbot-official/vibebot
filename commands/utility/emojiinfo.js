const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'emojiinfo',
  aliases: ['einfo'],
  description: 'Get information about an emoji',
  usage: '<emoji>',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  execute(message, args) {
    if (!args[0]) {
      return message.reply('❌ Please provide an emoji!');
    }

    // Parse emoji from message
    const emojiMatch = args[0].match(/<a?:(\w+):(\d+)>/);

    if (!emojiMatch) {
      return message.reply('❌ Please provide a valid custom emoji!');
    }

    const emojiId = emojiMatch[2];
    const emoji = message.guild.emojis.cache.get(emojiId);

    if (!emoji) {
      return message.reply('❌ Emoji not found in this server!');
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Emoji Information: ${emoji.name}`)
      .setThumbnail(emoji.url)
      .addFields(
        { name: 'Name', value: emoji.name, inline: true },
        { name: 'ID', value: emoji.id, inline: true },
        {
          name: 'Animated',
          value: emoji.animated ? 'Yes' : 'No',
          inline: true,
        },
        {
          name: 'Created',
          value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: 'URL', value: `[Click Here](${emoji.url})`, inline: true },
        { name: 'Usage', value: `\`${emoji}\``, inline: true }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
