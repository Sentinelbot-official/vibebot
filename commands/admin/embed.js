const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'embed',
  aliases: ['embedcreate', 'createembed'],
  description: 'Create a custom embed message',
  usage: '<title> | <description> | [color] | [footer]',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
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
    const color = parts[2] ? parseInt(parts[2].replace('#', ''), 16) : 0x0099ff;
    const footer = parts[3] || null;

    if (title.length > 256) {
      return message.reply('❌ Title must be 256 characters or less!');
    }

    if (description.length > 4096) {
      return message.reply('❌ Description must be 4096 characters or less!');
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(isNaN(color) ? 0x0099ff : color)
      .setTimestamp();

    if (footer) {
      embed.setFooter({ text: footer });
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
