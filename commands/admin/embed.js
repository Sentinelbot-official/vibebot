const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'embed',
  aliases: ['embedcreate', 'createembed'],
  description: 'Create a custom embed message',
  usage: '<title> | <description> | [color] | [footer]',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.reply('❌ You need Manage Messages permission!');
    }

    if (!args.length) {
      return message.reply(
        '❌ Usage: `embed <title> | <description> | [color] | [footer]`\n' +
          'Example: `!embed Welcome | Welcome to our server! | #00ff00 | Thanks for joining`'
      );
    }

    const parts = args
      .join(' ')
      .split('|')
      .map(p => p.trim());

    if (parts.length < 2) {
      return message.reply(
        '❌ You must provide at least a title and description separated by `|`'
      );
    }

    const title = parts[0];
    const description = parts[1];
    let color = 0x0099ff;
    
    // Parse color safely
    if (parts[2]) {
      const colorStr = parts[2].replace('#', '');
      const parsedColor = parseInt(colorStr, 16);
      if (!isNaN(parsedColor) && parsedColor >= 0 && parsedColor <= 0xFFFFFF) {
        color = parsedColor;
      }
    }
    
    const footer = parts[3] || null;

    if (!title || title.length === 0) {
      return message.reply('❌ Title cannot be empty!');
    }

    if (!description || description.length === 0) {
      return message.reply('❌ Description cannot be empty!');
    }

    if (title.length > 256) {
      return message.reply('❌ Title must be 256 characters or less!');
    }

    if (description.length > 4096) {
      return message.reply('❌ Description must be 4096 characters or less!');
    }

    if (footer && footer.length > 2048) {
      return message.reply('❌ Footer must be 2048 characters or less!');
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color)
      .setTimestamp();

    if (footer) {
      embed.setFooter({ text: footer.substring(0, 2048) });
    }

    try {
      await message.channel.send({ embeds: [embed] });
      await message.delete().catch(() => {});
    } catch (error) {
      console.error('Error sending embed:', error);
      message.reply('❌ Failed to send embed!');
    }
  },
};
