const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: 'shutdown',
  aliases: ['stop', 'kill'],
  description: 'Gracefully shutdown the bot (Owner Only)',
  usage: '[reason]',
  category: 'owner',
  ownerOnly: true,
  cooldown: 0,
  async execute(message, args) {
    const reason = args.join(' ') || 'Manual shutdown by owner';

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🔴 Bot Shutting Down')
      .setDescription(
        `**Initiated by:** ${message.author.tag}\n` +
          `**Reason:** ${reason}\n\n` +
          `The bot will shut down gracefully in 3 seconds...`
      )
      .setTimestamp()
      .setFooter({
        text: '🔴 Owner Command | Vibe Bot',
        iconURL: message.client.user.displayAvatarURL(),
      });

    await message.reply({ embeds: [embed] });

    logger.warn(`🔴 Bot shutdown initiated by ${message.author.tag}`);
    logger.warn(`Reason: ${reason}`);

    // Give time for the message to send
    setTimeout(() => {
      logger.info('Shutting down...');
      process.exit(0);
    }, 3000);
  },
};
