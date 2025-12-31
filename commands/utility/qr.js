const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'qr',
  aliases: ['qrcode'],
  description: 'Generate a QR code from text or URL',
  usage: '<text/url>',
  category: 'utility',
  cooldown: 5,
  execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Please provide text or a URL!');
    }

    const data = encodeURIComponent(args.join(' '));

    // Using free QR code API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${data}`;

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('📱 QR Code Generated')
      .setDescription(
        `Scan this QR code to access:\n\`\`\`${args.join(' ').substring(0, 100)}\`\`\``
      )
      .setImage(qrUrl)
      .setFooter(branding.footers.default);

    message.reply({ embeds: [embed] });
  },
};
