const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'invite',
  description: 'Get the bot invite link',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    const invite = `https://discord.com/api/oauth2/authorize?client_id=${message.client.user.id}&permissions=268446806&scope=bot`;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('🤖 Invite Vibe Bot')
      .setDescription(
        'Click the link below to invite me to your server!\n\n' +
          `[Invite Vibe Bot](${invite})`
      )
      .setThumbnail(message.client.user.displayAvatarURL())
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
