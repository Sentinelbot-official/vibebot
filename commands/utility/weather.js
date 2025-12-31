const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'weather',
  description: 'Get weather information for a location (mock data)',
  usage: '<location>',
  aliases: ['w', 'forecast'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Usage: `weather <location>`');
    }

    const location = args.join(' ');

    // Mock weather data (for demonstration)
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Snowy', 'Partly Cloudy', 'Stormy'];
    const emojis = {
      Sunny: '☀️',
      Cloudy: '☁️',
      Rainy: '🌧️',
      Snowy: '❄️',
      'Partly Cloudy': '⛅',
      Stormy: '⛈️',
    };

    // Generate deterministic weather based on location
    const hash = location.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const condition = conditions[Math.abs(hash) % conditions.length];
    const temp = 10 + (Math.abs(hash) % 30); // 10-40°C
    const humidity = 30 + (Math.abs(hash) % 60); // 30-90%
    const windSpeed = 5 + (Math.abs(hash) % 30); // 5-35 km/h

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`${emojis[condition]} Weather in ${location}`)
      .setDescription(`Current conditions`)
      .addFields(
        {
          name: 'Condition',
          value: condition,
          inline: true,
        },
        {
          name: 'Temperature',
          value: `${temp}°C / ${Math.round((temp * 9) / 5 + 32)}°F`,
          inline: true,
        },
        {
          name: 'Humidity',
          value: `${humidity}%`,
          inline: true,
        },
        {
          name: 'Wind Speed',
          value: `${windSpeed} km/h`,
          inline: true,
        },
        {
          name: 'Feels Like',
          value: `${temp - 2}°C`,
          inline: true,
        },
        {
          name: 'Visibility',
          value: '10 km',
          inline: true,
        }
      )
      .setFooter({
        text: 'Note: This is mock weather data for demonstration',
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
