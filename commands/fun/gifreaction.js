const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'react',
  aliases: ['reaction', 'gif'],
  description: 'React with GIFs',
  usage: '<emotion>',
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    const emotion = args[0]?.toLowerCase();

    const reactions = {
      happy: '😊',
      sad: '😢',
      angry: '😡',
      laugh: '😂',
      cry: '😭',
      love: '❤️',
      shocked: '😱',
      confused: '😕',
      excited: '🎉',
      tired: '😴',
    };

    if (!emotion || !reactions[emotion]) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('😊 GIF Reactions')
        .setDescription(
          '**React with GIFs!**\n\n' +
            '**Available Reactions:**\n' +
            Object.entries(reactions)
              .map(([e, emoji]) => `${emoji} \`//react ${e}\``)
              .join('\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const emoji = reactions[emotion];

    return message.reply(
      `${emoji} **${message.author.username}** is feeling **${emotion}**!`
    );
  },
};
