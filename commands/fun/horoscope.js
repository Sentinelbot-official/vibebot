const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'horoscope',
  description: 'Get your daily horoscope',
  usage: '<zodiac sign>',
  aliases: ['zodiac', 'astrology'],
  category: 'fun',
  cooldown: 5,
  execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide your zodiac sign!\nUsage: `horoscope <sign>`\n\n**Signs:** Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces'
      );
    }

    const sign = args[0].toLowerCase();

    const zodiacSigns = {
      aries: { emoji: '♈', dates: 'Mar 21 - Apr 19', element: 'Fire' },
      taurus: { emoji: '♉', dates: 'Apr 20 - May 20', element: 'Earth' },
      gemini: { emoji: '♊', dates: 'May 21 - Jun 20', element: 'Air' },
      cancer: { emoji: '♋', dates: 'Jun 21 - Jul 22', element: 'Water' },
      leo: { emoji: '♌', dates: 'Jul 23 - Aug 22', element: 'Fire' },
      virgo: { emoji: '♍', dates: 'Aug 23 - Sep 22', element: 'Earth' },
      libra: { emoji: '♎', dates: 'Sep 23 - Oct 22', element: 'Air' },
      scorpio: { emoji: '♏', dates: 'Oct 23 - Nov 21', element: 'Water' },
      sagittarius: { emoji: '♐', dates: 'Nov 22 - Dec 21', element: 'Fire' },
      capricorn: { emoji: '♑', dates: 'Dec 22 - Jan 19', element: 'Earth' },
      aquarius: { emoji: '♒', dates: 'Jan 20 - Feb 18', element: 'Air' },
      pisces: { emoji: '♓', dates: 'Feb 19 - Mar 20', element: 'Water' },
    };

    if (!zodiacSigns[sign]) {
      return message.reply(
        '❌ Invalid zodiac sign! Please use one of:\nAries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces'
      );
    }

    const horoscopes = {
      love: [
        'Romance is in the air today. Open your heart to new possibilities.',
        'A meaningful conversation could deepen an existing relationship.',
        "Your charm is irresistible today. Don't be afraid to show it.",
        'Someone special may enter your life unexpectedly.',
        'Focus on self-love today, and others will be drawn to your energy.',
        'Communication is key in your relationships today.',
        'A past connection may resurface. Handle with care.',
        'Your emotional intelligence will strengthen your bonds.',
      ],
      career: [
        'Your hard work is about to be recognized. Stay focused.',
        'A new opportunity may present itself. Be ready to seize it.',
        'Collaboration will lead to success today.',
        'Trust your instincts when making important decisions.',
        'Your creativity will impress those around you.',
        'Patience and persistence will pay off in your career.',
        'Network with others today. Connections matter.',
        "Take initiative on that project you've been considering.",
      ],
      health: [
        'Listen to your body today. Rest if you need it.',
        'Physical activity will boost your mood and energy.',
        'Stay hydrated and nourish your body well.',
        'Mental health is just as important as physical health.',
        'A new wellness routine could benefit you greatly.',
        "Balance is key. Don't overexert yourself.",
        'Meditation or mindfulness could bring peace today.',
        'Your energy levels are high. Make the most of it.',
      ],
      general: [
        'Today brings positive energy and new opportunities.',
        'Trust the process. Everything happens for a reason.',
        'Your intuition is especially strong today.',
        'Focus on gratitude and abundance will follow.',
        "Change is coming, and it's for the better.",
        'Your positive attitude will attract good things.',
        'Take time for yourself today. You deserve it.',
        'The universe is aligning in your favor.',
      ],
    };

    const signData = zodiacSigns[sign];
    const loveHoroscope =
      horoscopes.love[Math.floor(Math.random() * horoscopes.love.length)];
    const careerHoroscope =
      horoscopes.career[Math.floor(Math.random() * horoscopes.career.length)];
    const healthHoroscope =
      horoscopes.health[Math.floor(Math.random() * horoscopes.health.length)];
    const generalHoroscope =
      horoscopes.general[Math.floor(Math.random() * horoscopes.general.length)];

    const luckRating = Math.floor(Math.random() * 5) + 1;
    const luckStars = '⭐'.repeat(luckRating) + '☆'.repeat(5 - luckRating);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.primary)
      .setTitle(
        `${signData.emoji} ${sign.charAt(0).toUpperCase() + sign.slice(1)} Horoscope`
      )
      .setDescription(`**${signData.dates}** • Element: ${signData.element}`)
      .addFields(
        { name: '🌟 General', value: generalHoroscope, inline: false },
        { name: '💕 Love', value: loveHoroscope, inline: false },
        { name: '💼 Career', value: careerHoroscope, inline: false },
        { name: '🏥 Health', value: healthHoroscope, inline: false },
        { name: '🍀 Luck Rating', value: luckStars, inline: false }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
