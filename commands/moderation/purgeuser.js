const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'purgeuser',
  aliases: ['prune', 'clearmessages'],
  description: 'Delete messages from a specific user',
  usage: '<@user> [amount]',
  category: 'moderation',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return message.reply('❌ You need Manage Messages permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return message.reply('❌ I need Manage Messages permission!');
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('❌ Usage: `!purgeuser <@user> [amount]`');
    }

    const amount = Math.min(parseInt(args[1]) || 100, 100);

    try {
      const messages = await message.channel.messages.fetch({ limit: amount });
      const userMessages = messages.filter(m => m.author.id === user.id);

      if (userMessages.size === 0) {
        return message.reply(
          `❌ No messages found from ${user.tag} in the last ${amount} messages!`
        );
      }

      await message.channel.bulkDelete(userMessages, true);

      const msg = await message.reply(
        `✅ Deleted **${userMessages.size}** message(s) from ${user.tag}!`
      );
      setTimeout(() => msg.delete().catch(() => {}), 5000);
    } catch (error) {
      console.error('Error purging user messages:', error);
      message.reply('❌ Failed to purge messages!');
    }
  },
};
