const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'triviatournament',
  aliases: ['triviatorney', 'quiztourney'],
  description: 'Competitive trivia tournaments',
  usage: '<start/join/answer>',
  category: 'fun',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle('🎯 Trivia Tournament')
      .setDescription(
        '**Compete in trivia tournaments!**\n\n' +
          '**How to Play:**\n' +
          '1. Wait for tournament announcement\n' +
          '2. Join with `//triviatournament join`\n' +
          '3. Answer questions quickly\n' +
          '4. Earn points for correct answers\n\n' +
          '**Scoring:**\n' +
          '• Correct answer: 100 pts\n' +
          '• Speed bonus: Up to 50 pts\n' +
          '• Streak bonus: 25 pts per streak\n\n' +
          '**Prizes:**\n' +
          '🥇 1st: 10,000 coins\n' +
          '🥈 2nd: 5,000 coins\n' +
          '🥉 3rd: 2,500 coins'
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
