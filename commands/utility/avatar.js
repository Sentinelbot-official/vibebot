const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'avatar',
  aliases: ['av', 'pfp'],
  description: "Get a user's avatar",
  usage: '[@user]',
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    const user = message.mentions.users.first() || message.author;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`${user.username}'s Avatar`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setDescription(
        `[PNG](${user.displayAvatarURL({ extension: 'png', size: 4096 })}) | ` +
          `[JPG](${user.displayAvatarURL({ extension: 'jpg', size: 4096 })}) | ` +
          `[WEBP](${user.displayAvatarURL({ extension: 'webp', size: 4096 })})`
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
