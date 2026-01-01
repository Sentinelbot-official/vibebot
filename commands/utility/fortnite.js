const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const axios = require('axios');
const branding = require('../../utils/branding');

module.exports = {
  name: 'fortnite',
  aliases: ['fn', 'fortnitestats'],
  description: 'Get Fortnite player stats',
  usage: '<epic name>',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide an Epic Games username!\n' +
          'Usage: `//fortnite <name>`\n' +
          'Example: `//fortnite Ninja`'
      );
    }

    const apiKey = process.env.FORTNITE_API_KEY;

    if (!apiKey) {
      return message.reply(
        '❌ Fortnite API not configured!\n\n' +
          '**Setup:**\n' +
          '1. Get API key from [Fortnite-API.com](https://fortnite-api.com/)\n' +
          '2. Add `FORTNITE_API_KEY=your_key` to .env\n\n' +
          '**Note:** Free tier available with limited requests'
      );
    }

    const username = args.join(' ');
    const loading = await message.reply(
      `${branding.emojis.loading} Fetching Fortnite stats for **${username}**...`
    );

    try {
      // Get player stats
      const response = await axios.get(
        `https://fortnite-api.com/v2/stats/br/v2`,
        {
          params: {
            name: username,
          },
          headers: {
            Authorization: apiKey,
          },
        }
      );

      const data = response.data.data;
      const account = data.account;
      const stats = data.stats.all.overall;

      // Calculate K/D
      const kd = (stats.kills / Math.max(stats.deaths, 1)).toFixed(2);
      const winRate = ((stats.wins / Math.max(stats.matches, 1)) * 100).toFixed(
        1
      );

      const embed = new EmbedBuilder()
        .setColor(0x9146ff)
        .setAuthor({
          name: `${account.name} - Fortnite Stats`,
          iconURL:
            'https://cdn2.unrealengine.com/Fortnite%2Ffn-game-icon-1200x1200-c1b5e4f5c4a3.png',
        })
        .setDescription(
          `**Account Level:** ${account.level || 'N/A'}\n` +
            `**Battle Pass Level:** ${data.battlePass?.level || 'N/A'}`
        )
        .addFields(
          {
            name: '🎮 Overall Stats',
            value:
              `**Matches:** ${branding.formatNumber(stats.matches)}\n` +
              `**Wins:** ${branding.formatNumber(stats.wins)} (${winRate}%)\n` +
              `**Top 3:** ${branding.formatNumber(stats.top3)}\n` +
              `**Top 5:** ${branding.formatNumber(stats.top5)}\n` +
              `**Top 10:** ${branding.formatNumber(stats.top10)}`,
            inline: true,
          },
          {
            name: '⚔️ Combat Stats',
            value:
              `**Kills:** ${branding.formatNumber(stats.kills)}\n` +
              `**Deaths:** ${branding.formatNumber(stats.deaths)}\n` +
              `**K/D:** ${kd}\n` +
              `**Kill/Match:** ${(stats.kills / Math.max(stats.matches, 1)).toFixed(1)}\n` +
              `**Win Streak:** ${stats.winStreak || 0}`,
            inline: true,
          },
          {
            name: '⏱️ Time Stats',
            value:
              `**Minutes Played:** ${branding.formatNumber(stats.minutesPlayed)}\n` +
              `**Hours:** ${(stats.minutesPlayed / 60).toFixed(1)}h\n` +
              `**Avg Match Time:** ${(stats.minutesPlayed / Math.max(stats.matches, 1)).toFixed(1)} min`,
            inline: true,
          }
        );

      // Add mode-specific stats if available
      if (data.stats.all.solo) {
        const solo = data.stats.all.solo;
        const soloKD = (solo.kills / Math.max(solo.deaths, 1)).toFixed(2);
        const soloWR = ((solo.wins / Math.max(solo.matches, 1)) * 100).toFixed(
          1
        );

        embed.addFields({
          name: '👤 Solo',
          value:
            `Matches: ${branding.formatNumber(solo.matches)} | ` +
            `Wins: ${branding.formatNumber(solo.wins)} (${soloWR}%) | ` +
            `K/D: ${soloKD}`,
          inline: false,
        });
      }

      if (data.stats.all.duo) {
        const duo = data.stats.all.duo;
        const duoKD = (duo.kills / Math.max(duo.deaths, 1)).toFixed(2);
        const duoWR = ((duo.wins / Math.max(duo.matches, 1)) * 100).toFixed(1);

        embed.addFields({
          name: '👥 Duo',
          value:
            `Matches: ${branding.formatNumber(duo.matches)} | ` +
            `Wins: ${branding.formatNumber(duo.wins)} (${duoWR}%) | ` +
            `K/D: ${duoKD}`,
          inline: false,
        });
      }

      if (data.stats.all.squad) {
        const squad = data.stats.all.squad;
        const squadKD = (squad.kills / Math.max(squad.deaths, 1)).toFixed(2);
        const squadWR = (
          (squad.wins / Math.max(squad.matches, 1)) *
          100
        ).toFixed(1);

        embed.addFields({
          name: '👨‍👩‍👦‍👦 Squad',
          value:
            `Matches: ${branding.formatNumber(squad.matches)} | ` +
            `Wins: ${branding.formatNumber(squad.wins)} (${squadWR}%) | ` +
            `K/D: ${squadKD}`,
          inline: false,
        });
      }

      embed.setFooter(branding.footers.default);
      embed.setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('View on Fortnite Tracker')
          .setStyle(ButtonStyle.Link)
          .setURL(
            `https://fortnitetracker.com/profile/all/${encodeURIComponent(username)}`
          )
          .setEmoji('🔗')
      );

      return loading.edit({
        content: null,
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error(
        'Fortnite API Error:',
        error.response?.data || error.message
      );

      let errorMsg = 'Failed to fetch Fortnite stats. ';
      if (error.response?.status === 404) {
        errorMsg += `Player "${username}" not found!`;
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
