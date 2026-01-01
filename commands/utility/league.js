const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

// Rank tier emojis
const rankEmojis = {
  IRON: '🟫',
  BRONZE: '🟤',
  SILVER: '⚪',
  GOLD: '🟡',
  PLATINUM: '💠',
  EMERALD: '💚',
  DIAMOND: '💎',
  MASTER: '🔷',
  GRANDMASTER: '🔶',
  CHALLENGER: '👑',
};

module.exports = {
  name: 'league',
  aliases: ['lol', 'leagueoflegends'],
  description: 'Get League of Legends player stats',
  usage: '<summoner name> [region]',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a summoner name!\n' +
          'Usage: `//league <name> [region]`\n' +
          'Example: `//league Faker na1`\n\n' +
          'Regions: na1, euw1, eun1, kr, br1, jp1, la1, la2, oc1, tr1, ru'
      );
    }

    const apiKey = process.env.RIOT_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ Riot API not configured!\n\n' +
          '**Setup:**\n' +
          '1. Get API key from [Riot Developer Portal](https://developer.riotgames.com/)\n' +
          '2. Add `RIOT_API_KEY=your_key` to .env'
      );
    }

    const region = args[args.length - 1].toLowerCase();
    const validRegions = [
      'na1',
      'euw1',
      'eun1',
      'kr',
      'br1',
      'jp1',
      'la1',
      'la2',
      'oc1',
      'tr1',
      'ru',
    ];

    let summonerName;
    let selectedRegion;

    if (validRegions.includes(region)) {
      summonerName = args.slice(0, -1).join(' ');
      selectedRegion = region;
    } else {
      summonerName = args.join(' ');
      selectedRegion = 'na1'; // Default to NA
    }

    const loading = await message.reply(
      `${branding.emojis.loading} Fetching League stats for **${summonerName}**...`
    );

    try {
      // Get summoner info
      const summonerResponse = await axios.get(
        `https://${selectedRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
        {
          headers: { 'X-Riot-Token': apiKey },
        }
      );

      const summoner = summonerResponse.data;

      // Get ranked stats
      const rankedResponse = await axios.get(
        `https://${selectedRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
        {
          headers: { 'X-Riot-Token': apiKey },
        }
      );

      const rankedData = rankedResponse.data;

      // Get mastery data
      const masteryResponse = await axios.get(
        `https://${selectedRegion}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner.id}`,
        {
          headers: { 'X-Riot-Token': apiKey },
        }
      );

      const masteryData = masteryResponse.data.slice(0, 5); // Top 5 champions

      // Find Solo/Duo and Flex ranks
      const soloQueue = rankedData.find(q => q.queueType === 'RANKED_SOLO_5x5');
      const flexQueue = rankedData.find(q => q.queueType === 'RANKED_FLEX_SR');

      const embed = new EmbedBuilder()
        .setColor(0x0397ab)
        .setAuthor({
          name: `${summoner.name} - Level ${summoner.summonerLevel}`,
          iconURL: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summoner.profileIconId}.png`,
        })
        .setThumbnail(
          `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summoner.profileIconId}.png`
        )
        .addFields({
          name: '🌍 Region',
          value: selectedRegion.toUpperCase(),
          inline: true,
        });

      // Solo/Duo Queue
      if (soloQueue) {
        const rankEmoji =
          rankEmojis[soloQueue.tier] || branding.emojis.sparkles;
        const winrate = (
          (soloQueue.wins / (soloQueue.wins + soloQueue.losses)) *
          100
        ).toFixed(1);

        embed.addFields(
          {
            name: `${rankEmoji} Solo/Duo Queue`,
            value:
              `**${soloQueue.tier} ${soloQueue.rank}** (${soloQueue.leaguePoints} LP)\n` +
              `${soloQueue.wins}W / ${soloQueue.losses}L (${winrate}% WR)`,
            inline: true,
          },
          {
            name: '📈 Series',
            value: soloQueue.miniSeries
              ? `${soloQueue.miniSeries.progress.replace(/N/g, '○').replace(/W/g, '✓').replace(/L/g, '✗')}`
              : 'Not in series',
            inline: true,
          }
        );
      } else {
        embed.addFields({
          name: '🏆 Solo/Duo Queue',
          value: 'Unranked',
          inline: true,
        });
      }

      // Flex Queue
      if (flexQueue) {
        const rankEmoji =
          rankEmojis[flexQueue.tier] || branding.emojis.sparkles;
        const winrate = (
          (flexQueue.wins / (flexQueue.wins + flexQueue.losses)) *
          100
        ).toFixed(1);

        embed.addFields({
          name: `${rankEmoji} Flex Queue`,
          value:
            `**${flexQueue.tier} ${flexQueue.rank}** (${flexQueue.leaguePoints} LP)\n` +
            `${flexQueue.wins}W / ${flexQueue.losses}L (${winrate}% WR)`,
          inline: true,
        });
      } else {
        embed.addFields({
          name: '🏆 Flex Queue',
          value: 'Unranked',
          inline: true,
        });
      }

      // Top Champions
      if (masteryData.length > 0) {
        const championsText = masteryData
          .map(
            (m, i) =>
              `${i + 1}. **Champion ${m.championId}** - ${branding.formatNumber(m.championPoints)} pts (Level ${m.championLevel})`
          )
          .join('\n');

        embed.addFields({
          name: '🎯 Top Champions',
          value: championsText,
          inline: false,
        });
      }

      embed.setFooter(branding.footers.default);
      embed.setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View on OP.GG')
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://www.op.gg/summoners/${selectedRegion}/${encodeURIComponent(summonerName)}`
          )
          .setEmoji('🔗'),
        new ButtonBuilder()
          .setLabel('View on U.GG')
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://u.gg/lol/profile/${selectedRegion}/${encodeURIComponent(summonerName)}/overview`
          )
          .setEmoji('📊')
      );

      return loading.edit({
        content: null,
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error('League API Error:', error.response?.data || error.message);

      let errorMsg = 'Failed to fetch League stats. ';
      if (error.response?.status === 404) {
        errorMsg += `Summoner "${summonerName}" not found in ${selectedRegion.toUpperCase()}!`;
      } else if (error.response?.status === 429) {
        errorMsg += 'Rate limit exceeded. Try again later.';
      } else if (error.response?.status === 403) {
        errorMsg += 'Invalid or expired API key!';
      } else {
        errorMsg += error.message;
      }

      return loading.edit(`${branding.emojis.error} ${errorMsg}`);
    }
  },
};
