const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'firstmessage',
  aliases: ['firstmsg', 'fm'],
  description: 'Get the first message in this channel',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    try {
      const fetchedMessages = await message.channel.messages.fetch({
        after: '1',
        limit: 1,
      });
      const firstMessage = fetchedMessages.first();

      if (!firstMessage) {
        return message.reply('❌ Could not find the first message!');
      }

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📜 First Message')
        .setDescription(firstMessage.content || '*No content*')
        .setAuthor({
          name: firstMessage.author.tag,
          iconURL: firstMessage.author.displayAvatarURL({ dynamic: true }),
        })
        .addFields(
          { name: 'Author', value: `${firstMessage.author}`, inline: true },
          {
            name: 'Posted',
            value: `<t:${Math.floor(firstMessage.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: 'Link',
            value: `[Jump to Message](${firstMessage.url})`,
            inline: true,
          }
        )
        .setTimestamp(firstMessage.createdTimestamp);

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching first message:', error);
      message.reply('❌ Failed to fetch first message!');
    }
  },
};
