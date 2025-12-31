const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'minecraft',
  description: 'Get Minecraft player stats',
  usage: '<username>',
  aliases: ['mc', 'mcstats'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a Minecraft username!\nUsage: `minecraft <username>`\nExample: `minecraft Notch`'
      );
    }

    const username = args[0];
    const fetchingMsg = await message.reply('🎮 Fetching Minecraft stats...');

    try {
      // Get UUID from username
      const uuidResponse = await axios.get(
        `https://api.mojang.com/users/profiles/minecraft/${username}`
      );

      const uuid = uuidResponse.data.id;
      const correctName = uuidResponse.data.name;

      // Get skin/avatar
      const skinUrl = `https://crafatar.com/renders/body/${uuid}?overlay`;
      const faceUrl = `https://crafatar.com/avatars/${uuid}?overlay`;

      // Get name history
      const historyResponse = await axios.get(
        `https://api.mojang.com/user/profiles/${uuid}/names`
      );

      const nameHistory = historyResponse.data
        .slice(-5)
        .reverse()
        .map(n => n.name)
        .join(', ');

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle(`🎮 Minecraft Player: ${correctName}`)
        .setThumbnail(faceUrl)
        .setImage(skinUrl)
        .addFields(
          {
            name: '🆔 UUID',
            value: `\`${uuid}\``,
            inline: false,
          },
          {
            name: '📝 Name History',
            value: nameHistory || correctName,
            inline: false,
          },
          {
            name: '🔗 Links',
            value:
              `[NameMC](https://namemc.com/profile/${uuid})\n` +
              `[Plancke](https://plancke.io/hypixel/player/stats/${correctName})`,
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return fetchingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error(
        'Minecraft API Error:',
        error.response?.data || error.message
      );

      let errorMsg = 'Failed to fetch Minecraft stats. ';
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
