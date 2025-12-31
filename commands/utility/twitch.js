const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

// Cache for access token
let twitchAccessToken = null;
let tokenExpiry = 0;

async function getTwitchAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  // Return cached token if still valid
  if (twitchAccessToken && Date.now() < tokenExpiry) {
    return twitchAccessToken;
  }

  try {
    const response = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      null,
      {
        params: {
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
        },
      }
    );

    twitchAccessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000; // Refresh 1 min early

    return twitchAccessToken;
  } catch (error) {
    throw new Error('Failed to get Twitch access token');
  }
}

module.exports = {
  name: 'twitch',
  description: 'Get Twitch stream info',
  usage: '<username>',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Provide a Twitch username!\nUsage: `twitch <username>`\nExample: `twitch ninja`'
      );
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.error)
        .setTitle('❌ Twitch Not Configured')
        .setDescription(
          'Add `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` to your .env file'
        )
        .addFields({
          name: 'Get API Keys',
          value:
            '[Twitch Developer Console](https://dev.twitch.tv/console/apps)',
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const username = args[0].toLowerCase();
    const loadingMsg = await message.reply('📺 Fetching Twitch data...');

    try {
      const accessToken = await getTwitchAccessToken();

      // Get user info
      const userResponse = await axios.get(
        'https://api.twitch.tv/helix/users',
        {
          params: { login: username },
          headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!userResponse.data.data.length) {
        return loadingMsg.edit(`❌ Twitch user **${username}** not found!`);
      }

      const user = userResponse.data.data[0];

      // Check if streaming
      const streamResponse = await axios.get(
        'https://api.twitch.tv/helix/streams',
        {
          params: { user_id: user.id },
          headers: {
            'Client-ID': clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const isLive = streamResponse.data.data.length > 0;
      const stream = isLive ? streamResponse.data.data[0] : null;

      const embed = new EmbedBuilder()
        .setColor(isLive ? 0x9146ff : 0x808080)
        .setAuthor({
          name: user.display_name,
          iconURL: user.profile_image_url,
          url: `https://twitch.tv/${user.login}`,
        })
        .setTitle(isLive ? `🔴 LIVE: ${stream.title}` : '⚫ Offline')
        .setURL(`https://twitch.tv/${user.login}`)
        .setDescription(user.description || 'No description')
        .setThumbnail(user.profile_image_url);

      if (isLive) {
        embed
          .addFields(
            {
              name: '🎮 Game',
              value: stream.game_name || 'Unknown',
              inline: true,
            },
            {
              name: '👥 Viewers',
              value: stream.viewer_count.toLocaleString(),
              inline: true,
            },
            {
              name: '🕐 Started',
              value: `<t:${Math.floor(new Date(stream.started_at).getTime() / 1000)}:R>`,
              inline: true,
            }
          )
          .setImage(
            stream.thumbnail_url
              .replace('{width}', '1280')
              .replace('{height}', '720') + `?t=${Date.now()}`
          );
      } else {
        embed.addFields(
          {
            name: 'View Count',
            value: user.view_count.toLocaleString(),
            inline: true,
          },
          {
            name: 'Broadcaster Type',
            value: user.broadcaster_type || 'Regular',
            inline: true,
          }
        );
      }

      embed.setFooter(branding.footers.default).setTimestamp();

      return loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Twitch API Error:', error.response?.data || error.message);

      let errorMsg = 'Failed to fetch Twitch data. ';

      if (error.response?.status === 401) {
        errorMsg += 'Invalid API credentials.';
      } else if (error.response?.status === 429) {
        errorMsg += 'Rate limit exceeded.';
      } else {
        errorMsg += error.message;
      }

      return loadingMsg.edit(`❌ ${errorMsg}`);
    }
  },
};
