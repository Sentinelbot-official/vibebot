const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'support',
  aliases: ['server'],
  description: 'Get the support server invite',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('💬 Support Server')
      .setDescription(
        'Need help? Have suggestions? Join our support server!\n\n' +
          '**Support Server:** https://discord.gg/zFMgG6ZN68\n' +
          '**Email:** vibetbot0@proton.me'
      )
      .setThumbnail(message.client.user.displayAvatarURL())
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
