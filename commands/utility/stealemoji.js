const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'stealemoji',
  description: 'Add an emoji from another server to this server',
  usage: '<emoji> [name]',
  aliases: ['addemoji', 'steal', 'yoink'],
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuildExpressions
      )
    ) {
      return message.reply('❌ You need Manage Emojis permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageGuildExpressions
      )
    ) {
      return message.reply('❌ I need Manage Emojis permission!');
    }

    if (args.length < 1) {
      return message.reply('❌ Usage: `stealemoji <emoji> [name]`');
    }

    const emojiMatch = args[0].match(/<?(a)?:?(\w+):(\d{17,19})>?/);

    if (!emojiMatch) {
      return message.reply('❌ Please provide a valid custom emoji!');
    }

    const [, animated, emojiName, emojiId] = emojiMatch;
    const customName = args[1] || emojiName;

    // Validate name
    if (!/^[a-zA-Z0-9_]{2,32}$/.test(customName)) {
      return message.reply(
        '❌ Emoji name must be 2-32 characters and contain only letters, numbers, and underscores!'
      );
    }

    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? 'gif' : 'png'}`;

    try {
      const newEmoji = await message.guild.emojis.create({
        attachment: emojiUrl,
        name: customName,
        reason: `Emoji stolen by ${message.author.tag}`,
      });

      message.reply(`✅ Successfully added ${newEmoji} as \`:${customName}:\`!`);
    } catch (error) {
      console.error('Error stealing emoji:', error);

      if (error.code === 30008) {
        return message.reply(
          '❌ Maximum number of emojis reached for this server!'
        );
      }

      message.reply('❌ Failed to add emoji. Make sure the emoji is valid!');
    }
  },
};
