const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'support',
  aliases: ['server'],
  description: 'Get the support server invite',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('💬 Support Server')
      .setDescription(
        'Need help? Have suggestions? Join our support server!\n\n' +
          '**Support Server:** [COMING SOON]\n' +
          '**Email:** vibetbot0@proton.me'
      )
      .setThumbnail(message.client.user.displayAvatarURL())
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
