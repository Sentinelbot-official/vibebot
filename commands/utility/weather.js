const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  name: 'weather',
  description: 'Get current weather and forecast for a location',
  usage: '<location>',
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a location! Usage: `weather <location>`'
      );
    }

    const location = args.join(' ');

    try {
      // Using wttr.in API (free, no API key required)
      const weatherData = await fetchWeather(location);

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`🌤️ Weather for ${weatherData.location}`)
        .setDescription(weatherData.condition)
        .addFields(
          { name: '🌡️ Temperature', value: weatherData.temp, inline: true },
          { name: '🌡️ Feels Like', value: weatherData.feelsLike, inline: true },
          { name: '💧 Humidity', value: weatherData.humidity, inline: true },
          { name: '💨 Wind', value: weatherData.wind, inline: true },
          {
            name: '👁️ Visibility',
            value: weatherData.visibility,
            inline: true,
          },
          { name: '🌅 UV Index', value: weatherData.uv, inline: true }
        )
        .setFooter({ text: 'Powered by wttr.in' })
        .setTimestamp();

      if (weatherData.forecast) {
        embed.addFields({
          name: '📅 3-Day Forecast',
          value: weatherData.forecast,
          inline: false,
        });
      }

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Weather command error:', error);
      return message.reply(
        '❌ Could not fetch weather data. Please check the location and try again.'
      );
    }
  },
};

function fetchWeather(location) {
  return new Promise((resolve, reject) => {
    const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;

    https
      .get(url, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const json = JSON.parse(data);

            if (!json.current_condition || !json.current_condition[0]) {
              return reject(new Error('Invalid location'));
            }

            const current = json.current_condition[0];
            const nearest = json.nearest_area?.[0];

            const weatherData = {
              location: nearest
                ? `${nearest.areaName[0].value}, ${nearest.country[0].value}`
                : location,
              condition: current.weatherDesc[0].value,
              temp: `${current.temp_C}°C / ${current.temp_F}°F`,
              feelsLike: `${current.FeelsLikeC}°C / ${current.FeelsLikeF}°F`,
              humidity: `${current.humidity}%`,
              wind: `${current.windspeedKmph} km/h ${current.winddir16Point}`,
              visibility: `${current.visibility} km`,
              uv: current.uvIndex,
            };

            // Add 3-day forecast
            if (json.weather && json.weather.length >= 3) {
              const forecast = json.weather
                .slice(0, 3)
                .map((day, index) => {
                  const date =
                    index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Day 3';
                  return `**${date}**: ${day.maxtempC}°/${day.mintempC}°C - ${day.hourly[4].weatherDesc[0].value}`;
                })
                .join('\n');
              weatherData.forecast = forecast;
            }

            resolve(weatherData);
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}
