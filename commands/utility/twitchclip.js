const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const twitchApi = require('../../utils/twitchApi');
const branding = require('../../utils/branding');

module.exports = {
  name: 'twitchclip',
  aliases: ['clip', 'clips'],
  description: 'Get recent clips from a Twitch streamer',
  usage: '<username> [amount]',
  category: 'utility',
  cooldown: 10,
  async execute(message, args) {
    const username = args[0];
    const amount = parseInt(args[1]) || 5;

    if (!username) {
      return message.reply(
        '❌ Please provide a Twitch username!\n' +
          'Example: `//twitchclip projectdraguk`'
      );
    }

    if (amount < 1 || amount > 10) {
      return message.reply('❌ Amount must be between 1 and 10!');
    }

    const loading = await message.reply(
      `${branding.emojis.rocket} Fetching clips from **${username}**...`
    );

    try {
      const clips = await twitchApi.getClips(username, amount);

      if (clips.length === 0) {
        return loading.edit(
          `❌ No clips found for **${username}**! Make sure the username is correct.`
        );
      }

      let currentPage = 0;

      const generateEmbed = page => {
        const clip = clips[page];

        const embed = new EmbedBuilder()
          .setColor('#9146FF')
          .setAuthor({
            name: `${username}'s Clips`,
            iconURL: branding.getTwitchIconURL(),
            url: `https://twitch.tv/${username}/clips`,
          })
          .setTitle(clip.title || 'Untitled Clip')
          .setURL(clip.url)
          .setDescription(
            `**Clipped by:** ${clip.creator}\n` +
              `**Views:** ${branding.formatNumber(clip.views)}\n` +
              `**Duration:** ${clip.duration.toFixed(1)}s\n` +
              `**Created:** <t:${Math.floor(clip.createdAt.getTime() / 1000)}:R>`
          )
          .setImage(clip.thumbnailUrl)
          .setFooter({
            text: branding.getFooterText(`Clip ${page + 1} of ${clips.length}`),
            iconURL: branding.getTwitchIconURL(),
          })
          .setTimestamp(clip.createdAt);

        return embed;
      };

      const generateButtons = page => {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev_clip')
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId('watch_clip')
            .setLabel('Watch Clip')
            .setStyle(ButtonStyle.Link)
            .setURL(clips[page].url)
            .setEmoji('🎬'),
          new ButtonBuilder()
            .setCustomId('next_clip')
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === clips.length - 1)
        );

        return row;
      };

      const reply = await loading.edit({
        content: null,
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });

      if (clips.length === 1) return;

      const collector = reply.createMessageComponentCollector({
        filter: i => i.user.id === message.author.id,
        time: 5 * 60 * 1000, // 5 minutes
      });

      collector.on('collect', async interaction => {
        if (interaction.customId === 'prev_clip') {
          currentPage--;
        } else if (interaction.customId === 'next_clip') {
          currentPage++;
        }

        await interaction.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
      });

      collector.on('end', () => {
        reply
          .edit({
            components: [],
          })
          .catch(() => {});
      });
    } catch (error) {
      console.error('Error fetching Twitch clips:', error);
      return loading.edit(
        `${branding.emojis.error} Failed to fetch clips! The Twitch API might be down or the username is invalid.`
      );
    }
  },
};
