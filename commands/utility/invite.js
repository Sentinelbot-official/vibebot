const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'invite',
  description: 'Get the bot invite link',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    const invite = `https://discord.com/api/oauth2/authorize?client_id=${message.client.user.id}&permissions=8&scope=bot`;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🤖 Invite Vibe Bot')
      .setDescription(
        `Click the link below to invite me to your server!\n\n` +
          `[Invite Vibe Bot](${invite})`
      )
      .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'Thanks for using Vibe Bot!' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
