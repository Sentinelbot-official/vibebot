const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'purge',
  description: 'Purge messages from the channel.',
  usage: '<amount>',
  category: 'moderation',
  async execute(message, args) {
    // Permission check
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return message.reply('❌ You do not have permission to purge messages.');
    }

    // Bot permission check
    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageMessages
      )
    ) {
      return message.reply('❌ I do not have permission to manage messages.');
    }

    // Parse amount
    const amount = parseInt(args[0]);
    if (isNaN(amount)) {
      return message.reply(
        '❌ Please enter a valid number of messages to purge.'
      );
    }

    if (amount < 1 || amount > 99) {
      return message.reply('❌ Please enter a number between 1 and 99.');
    }

    try {
      // Delete messages (add 1 to include the command message, max 100 total)
      const deleteCount = Math.min(amount + 1, 100);
      const deleted = await message.channel.bulkDelete(deleteCount, true);
      const actualDeleted = deleted.size - 1; // Subtract the command message

      // Send confirmation (will auto-delete)
      const reply = await message.channel.send(
        `✅ Successfully purged ${actualDeleted} message${actualDeleted !== 1 ? 's' : ''}.`
      );

      // Auto-delete confirmation after 5 seconds
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);
    } catch (error) {
      console.error('Error purging messages:', error);

      // Handle specific error cases
      if (error.code === 50034) {
        return message.reply('❌ Cannot delete messages older than 14 days.');
      }

      return message.reply('❌ Failed to purge messages.');
    }
  },
};
