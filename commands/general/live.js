const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'live',
  aliases: ['stream', 'twitch', 'islive'],
  description: 'Check if the bot creator is live on Twitch',
  usage: '',
  category: 'general',
  cooldown: 30,
  async execute(message, args) {
    const twitchUsername = 'projectdraguk'; // Your Twitch username
    const twitchClientId = process.env.TWITCH_CLIENT_ID;
    const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

    // Check if Twitch API credentials are configured
    if (!twitchClientId || !twitchClientSecret) {
      const embed = new EmbedBuilder()
        .setColor(0x9146ff)
        .setTitle('🔴 24/7 Live Stream')
        .setDescription(
          `**Airis is streaming 24/7 on Twitch!**\n\n` +
            `🔴 **ALWAYS LIVE:** https://twitch.tv/${twitchUsername}\n\n` +
            `This bot was built live on stream with the global community!\n` +
            `Join anytime - we're coding around the clock! 🌍`
        )
        .setThumbnail('https://static-cdn.jtvnw.net/jtv_user_pictures/8d8f0d3e-7d3a-4b3e-9b3e-3e3e3e3e3e3e-profile_image-300x300.png')
        .setFooter({
          text: 'Built with ❤️ by Airis & The 24/7 Community',
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    try {
      // Get OAuth token
      const tokenResponse = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: twitchClientId,
            client_secret: twitchClientSecret,
            grant_type: 'client_credentials',
          },
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Check if user is live
      const streamResponse = await axios.get(
        `https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`,
        {
          headers: {
            'Client-ID': twitchClientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const streamData = streamResponse.data.data[0];

      if (streamData) {
        // Stream is live!
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('🔴 LIVE NOW on Twitch!')
          .setURL(`https://twitch.tv/${twitchUsername}`)
          .setDescription(
            `**${streamData.user_name}** is currently live!\n\n` +
              `**${streamData.title}**`
          )
          .addFields(
            {
              name: '🎮 Category',
              value: streamData.game_name || 'Just Chatting',
              inline: true,
            },
            {
              name: '👥 Viewers',
              value: streamData.viewer_count.toLocaleString(),
              inline: true,
            },
            {
              name: '⏱️ Uptime',
              value: getUptime(streamData.started_at),
              inline: true,
            }
          )
          .setImage(
            streamData.thumbnail_url
              .replace('{width}', '1920')
              .replace('{height}', '1080')
          )
          .setFooter({
            text: 'Click the title to watch! | Built 24/7 with the community',
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } else {
        // Stream is offline
        const embed = new EmbedBuilder()
          .setColor(0x808080)
          .setTitle('📴 Currently Offline')
          .setDescription(
            `**Airis** is not currently streaming, but we're live 24/7!\n\n` +
              `🔴 **Check the stream:** https://twitch.tv/${twitchUsername}\n\n` +
              `This bot was built live on stream with viewers from around the world!\n` +
              `We might be back online any moment - check the link above! 🌍`
          )
          .setFooter({
            text: 'Built with ❤️ by Airis & The 24/7 Community',
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error checking Twitch stream:', error);

      const embed = new EmbedBuilder()
        .setColor(0x9146ff)
        .setTitle('🔴 24/7 Live Stream')
        .setDescription(
          `**Airis streams 24/7 on Twitch!**\n\n` +
            `🔴 **Watch now:** https://twitch.tv/${twitchUsername}\n\n` +
            `This bot was built live on stream with the global community!\n` +
            `Join anytime - we're coding around the clock! 🌍\n\n` +
            `*Unable to check live status right now, but check the link above!*`
        )
        .setFooter({
          text: 'Built with ❤️ by Airis & The 24/7 Community',
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};

/**
 * Calculate stream uptime
 * @param {string} startedAt - ISO timestamp
 * @returns {string} Formatted uptime
 */
function getUptime(startedAt) {
  const start = new Date(startedAt);
  const now = new Date();
  const diff = now - start;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
