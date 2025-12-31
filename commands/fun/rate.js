const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'rate',
  description: 'Rate something or someone',
  usage: '<thing>',
  aliases: ['rating'],
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Please provide something to rate!');
    }

    const thing = args.join(' ');

    // Create a deterministic rating based on the thing
    const hash = thing.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const rating = Math.abs(hash % 11); // 0-10

    // Generate rating bar
    const filledStars = '⭐'.repeat(rating);
    const emptyStars = '☆'.repeat(10 - rating);
    const ratingBar = filledStars + emptyStars;

    // Rating messages
    const messages = {
      0: 'Absolutely terrible! 😱',
      1: 'Really bad... 😞',
      2: 'Not good at all 😕',
      3: 'Pretty poor 😐',
      4: 'Below average 🙁',
      5: 'Mediocre 😶',
      6: 'Decent enough 🙂',
      7: 'Pretty good! 😊',
      8: 'Really good! 😄',
      9: 'Excellent! 🤩',
      10: 'ABSOLUTELY PERFECT! 🌟',
    };

    const embed = new EmbedBuilder()
      .setColor(rating >= 7 ? 0x00ff00 : rating >= 4 ? 0xffa500 : 0xff0000)
      .setTitle('⭐ Rating')
      .setDescription(
        `**${thing}**\n\n` +
          `${ratingBar}\n\n` +
          `**${rating}/10** - ${messages[rating]}`
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
