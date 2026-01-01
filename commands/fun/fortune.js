const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'fortune',
  description: 'Get your daily fortune',
  aliases: ['dailyfortune', 'luck'],
  category: 'fun',
  cooldown: 5,
  execute(message) {
    const fortunes = [
      '🌟 A pleasant surprise is waiting for you.',
      '🎯 Your hard work will soon pay off.',
      '💫 Good things come to those who wait.',
      '🍀 Luck is on your side today!',
      '🌈 A rainbow follows every storm.',
      '✨ Your creativity will shine today.',
      '🎨 Express yourself and others will listen.',
      '🎭 Today is a great day to try something new.',
      '🎪 Adventure awaits around the corner.',
      '🎯 Focus on your goals and success will follow.',
      '💎 You are more valuable than you think.',
      '🌸 Kindness will open new doors for you.',
      '🦋 Change is coming, embrace it.',
      '🌺 Beauty surrounds you, take time to notice.',
      '🎁 A gift or surprise is heading your way.',
      '📚 Knowledge gained today will serve you well.',
      '🎵 Music will bring joy to your day.',
      '🌙 Trust your intuition tonight.',
      '☀️ Your positive energy is contagious.',
      '🌟 Someone looks up to you more than you know.',
      '💝 Love is closer than you think.',
      '🎊 Celebration is in your near future.',
      '🏆 Victory is within reach.',
      "🌻 Plant seeds today for tomorrow's harvest.",
      '🦄 Magic happens when you believe.',
      '🎈 Your enthusiasm inspires others.',
      '🌠 Make a wish, it might come true.',
      '🎯 Your determination will overcome obstacles.',
      '💪 You are stronger than your challenges.',
      '🌏 The world is full of opportunities for you.',
      '🎨 Your unique perspective is valuable.',
      '🌺 Bloom where you are planted.',
      '🎭 Life is your stage, perform with confidence.',
      '🎪 Take risks, the rewards will be worth it.',
      '🌈 After darkness comes light.',
      '✨ Your dreams are valid and achievable.',
      '🎁 Generosity will return to you tenfold.',
      '🦋 Transformation is a beautiful process.',
      '🌸 Peace will find you today.',
      '💫 The universe is conspiring in your favor.',
    ];

    const luckyNumbers = Array.from(
      { length: 6 },
      () => Math.floor(Math.random() * 99) + 1
    );
    const luckyColor = [
      'Red',
      'Blue',
      'Green',
      'Yellow',
      'Purple',
      'Orange',
      'Pink',
      'Gold',
      'Silver',
      'White',
    ][Math.floor(Math.random() * 10)];
    const luckyDay = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ][Math.floor(Math.random() * 7)];

    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    const embed = new EmbedBuilder()
      .setColor(branding.colors.premium)
      .setTitle('🔮 Your Daily Fortune')
      .setDescription(fortune)
      .addFields(
        {
          name: '🎲 Lucky Numbers',
          value: luckyNumbers.join(', '),
          inline: false,
        },
        { name: '🎨 Lucky Color', value: luckyColor, inline: true },
        { name: '📅 Lucky Day', value: luckyDay, inline: true }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
