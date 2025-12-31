const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'valorant',
  description: 'Get Valorant player stats',
  usage: '<name#tag>',
  aliases: ['val', 'valstats'],
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a Valorant username!\nUsage: `valorant <name#tag>`\nExample: `valorant Ninja#1234`'
      );
    }

    const apiKey = process.env.VALORANT_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ Valorant API not configured!\n\n' +
          '**Setup:**\n' +
          "1. Get API key from [Henrik's Valorant API](https://github.com/Henrik-3/unofficial-valorant-api)\n" +
          '2. Add `VALORANT_API_KEY=your_key` to .env\n\n' +
          '**Note:** You can also use the free tier without a key (limited requests)'
      );
    }

    const username = args.join(' ');
    const [name, tag] = username.split('#');

    if (!name || !tag) {
      return message.reply(
        '❌ Invalid format! Use: `name#tag`\nExample: `valorant Ninja#1234`'
      );
    }

    const fetchingMsg = await message.reply('🎮 Fetching Valorant stats...');

    try {
      // Get account info
      const accountResponse = await axios.get(
        `https://api.henrikdev.xyz/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        {
          headers: apiKey ? { Authorization: apiKey } : {},
        }
      );

      const account = accountResponse.data.data;

      // Get MMR (rank) info
      const mmrResponse = await axios.get(
        `https://api.henrikdev.xyz/valorant/v1/mmr/na/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
        {
          headers: apiKey ? { Authorization: apiKey } : {},
        }
      );

      const mmr = mmrResponse.data.data;

      const embed = new EmbedBuilder()
        .setColor(0xff4655)
        .setTitle(`🎮 ${account.name}#${account.tag}`)
        .setThumbnail(account.card.small)
        .addFields(
          {
            name: '🏆 Current Rank',
            value: mmr.currenttierpatched || 'Unranked',
            inline: true,
          },
          {
            name: '📊 RR',
            value: mmr.ranking_in_tier?.toString() || 'N/A',
            inline: true,
          },
          {
            name: '🎯 Peak Rank',
            value: mmr.old || 'N/A',
            inline: true,
          },
          {
            name: '🆔 PUUID',
            value: `\`${account.puuid.substring(0, 20)}...\``,
            inline: false,
          },
          {
            name: '🌍 Region',
            value: account.region.toUpperCase(),
            inline: true,
          },
          {
            name: '📈 Account Level',
            value: account.account_level?.toString() || 'N/A',
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      if (account.card.wide) {
        embed.setImage(account.card.wide);
      }

      return fetchingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error(
        'Valorant API Error:',
        error.response?.data || error.message
      );

      let errorMsg = 'Failed to fetch Valorant stats. ';
      if (error.response?.status === 404) {
        errorMsg += `Player "${username}" not found!`;
      } else if (error.response?.status === 429) {
        errorMsg += 'Rate limit exceeded. Try again later.';
      } else {
        errorMsg += error.message;
      }

      return fetchingMsg.edit(`❌ ${errorMsg}`);
    }
  },
};
