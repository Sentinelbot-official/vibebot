const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

module.exports = {
  name: 'steam',
  aliases: ['steamprofile', 'steamstats'],
  description: 'Get Steam profile information',
  usage: '<steam id or profile url>',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a Steam ID or profile URL!\n' +
          'Usage: `//steam <id or url>`\n' +
          'Example: `//steam 76561198000000000`\n' +
          'Or: `//steam https://steamcommunity.com/id/username`'
      );
    }

    const apiKey = process.env.STEAM_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ Steam API not configured!\n\n' +
          '**Setup:**\n' +
          '1. Get API key from [Steam Web API](https://steamcommunity.com/dev/apikey)\n' +
          '2. Add `STEAM_API_KEY=your_key` to .env'
      );
    }

    const input = args.join(' ');
    const loading = await message.reply(
      `${branding.emojis.loading} Fetching Steam profile...`
    );

    try {
      let steamId;

      // Check if input is a URL
      if (input.includes('steamcommunity.com')) {
        // Extract custom URL or ID from URL
        const customUrlMatch = input.match(/\/id\/([^\/]+)/);
        const steamIdMatch = input.match(/\/profiles\/(\d+)/);

        if (customUrlMatch) {
          // Resolve custom URL to Steam ID
          const resolveResponse = await axios.get(
            'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/',
            {
              params: {
                key: apiKey,
                vanityurl: customUrlMatch[1],
              },
            }
          );

          if (resolveResponse.data.response.success === 1) {
            steamId = resolveResponse.data.response.steamid;
          } else {
            return loading.edit(
              `${branding.emojis.error} Could not find Steam profile with custom URL: ${customUrlMatch[1]}`
            );
          }
        } else if (steamIdMatch) {
          steamId = steamIdMatch[1];
        }
      } else {
        // Assume it's a Steam ID
        steamId = input;
      }

      if (!steamId) {
        return loading.edit(
          `${branding.emojis.error} Invalid Steam ID or profile URL!`
        );
      }

      // Get player summary
      const summaryResponse = await axios.get(
        'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
        {
          params: {
            key: apiKey,
            steamids: steamId,
          },
        }
      );

      const player = summaryResponse.data.response.players[0];

      if (!player) {
        return loading.edit(
          `${branding.emojis.error} Steam profile not found!`
        );
      }

      // Get owned games count
      const gamesResponse = await axios.get(
        'https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/',
        {
          params: {
            key: apiKey,
            steamid: steamId,
            include_appinfo: 1,
            include_played_free_games: 1,
          },
        }
      );

      const games = gamesResponse.data.response.games || [];
      const totalGames = gamesResponse.data.response.game_count || 0;

      // Get recently played games
      const recentResponse = await axios.get(
        'https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/',
        {
          params: {
            key: apiKey,
            steamid: steamId,
            count: 5,
          },
        }
      );

      const recentGames = recentResponse.data.response.games || [];

      // Status mapping
      const statusMap = {
        0: '🔴 Offline',
        1: '🟢 Online',
        2: '🟡 Busy',
        3: '🔵 Away',
        4: '💤 Snooze',
        5: '🎮 Looking to trade',
        6: '🎮 Looking to play',
      };

      const embed = new EmbedBuilder()
        .setColor(0x1b2838)
        .setAuthor({
          name: player.personaname,
          iconURL: player.avatarfull,
          url: player.profileurl,
        })
        .setThumbnail(player.avatarfull)
        .setDescription(
          `**Status:** ${statusMap[player.personastate] || 'Unknown'}\n` +
            `**Profile:** [View on Steam](${player.profileurl})\n` +
            `**Steam ID:** \`${steamId}\``
        )
        .addFields(
          {
            name: '🎮 Games',
            value: `**Total:** ${branding.formatNumber(totalGames)}`,
            inline: true,
          },
          {
            name: '📅 Account Created',
            value: player.timecreated
              ? `<t:${player.timecreated}:D>`
              : 'Private',
            inline: true,
          },
          {
            name: '🌍 Country',
            value: player.loccountrycode || 'Unknown',
            inline: true,
          }
        );

      // Add recently played games
      if (recentGames.length > 0) {
        const recentText = recentGames
          .map(game => {
            const hours = (game.playtime_forever / 60).toFixed(1);
            const recentHours = (game.playtime_2weeks / 60).toFixed(1);
            return `**${game.name}**\n${hours}h total | ${recentHours}h (2 weeks)`;
          })
          .join('\n\n');

        embed.addFields({
          name: '🕹️ Recently Played',
          value: recentText,
          inline: false,
        });
      }

      // Add most played games
      if (games.length > 0) {
        const mostPlayed = games
          .sort((a, b) => b.playtime_forever - a.playtime_forever)
          .slice(0, 5);

        const mostPlayedText = mostPlayed
          .map((game, i) => {
            const hours = (game.playtime_forever / 60).toFixed(1);
            return `${i + 1}. **${game.name}** - ${hours}h`;
          })
          .join('\n');

        embed.addFields({
          name: '⭐ Most Played',
          value: mostPlayedText,
          inline: false,
        });
      }

      // Calculate total playtime
      const totalMinutes = games.reduce(
        (sum, game) => sum + game.playtime_forever,
        0
      );
      const totalHours = (totalMinutes / 60).toFixed(1);

      embed.addFields({
        name: '⏱️ Total Playtime',
        value: `${branding.formatNumber(totalHours)} hours`,
        inline: true,
      });

      embed.setFooter(branding.footers.default);
      embed.setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View Profile')
          .setStyle(ButtonStyle.Link)
          .setURL(player.profileurl)
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setLabel('Add Friend')
          .setStyle(ButtonStyle.Link)
          .setURL(`steam://friends/add/${steamId}`)
          .setEmoji('➕')
      );

      return loading.edit({
        content: null,
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error('Steam API Error:', error.response?.data || error.message);

      let errorMsg = 'Failed to fetch Steam profile. ';
      if (error.response?.status === 403) {
        errorMsg += 'Invalid or expired API key!';
      } else if (error.response?.status === 429) {
        errorMsg += 'Rate limit exceeded. Try again later.';
      } else {
        errorMsg += error.message;
      }

      return loading.edit(`${branding.emojis.error} ${errorMsg}`);
    }
  },
};
