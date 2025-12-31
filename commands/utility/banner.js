const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'banner',
  description: "Get a user's banner",
  usage: '[@user]',
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;

    try {
      const fetchedUser = await user.fetch(true);
      const bannerURL = fetchedUser.bannerURL({ dynamic: true, size: 4096 });

      if (!bannerURL) {
        return message.reply(`❌ ${user.tag} doesn't have a banner!`);
      }

      const embed = new EmbedBuilder()
        .setColor(fetchedUser.accentColor || 0x0099ff)
        .setTitle(`${user.tag}'s Banner`)
        .setImage(bannerURL)
        .addFields({
          name: 'Download',
          value: `[Click Here](${bannerURL})`,
          inline: true,
        });

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching banner:', error);
      message.reply('❌ Failed to fetch banner!');
    }
  },
};
