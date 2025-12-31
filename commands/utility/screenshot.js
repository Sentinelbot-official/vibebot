const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'screenshot',
  aliases: ['ss', 'preview'],
  description: 'Take a screenshot of a website',
  usage: '<url>',
  category: 'utility',
  cooldown: 10,
  execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Please provide a URL!');
    }

    const url = args[0];

    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      return message.reply('❌ Please provide a valid URL!');
    }

    // Using free screenshot API
    const screenshotUrl = `https://api.screenshotmachine.com/?key=demo&url=${encodeURIComponent(url)}&dimension=1024x768`;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📸 Website Screenshot')
      .setDescription(`Preview of: ${url}`)
      .setImage(screenshotUrl)
      .setFooter({
        text: 'Note: Using demo API - get your own key for better quality',
      });

    message.reply({ embeds: [embed] });
  },
};
