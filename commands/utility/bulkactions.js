const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'bulk',
  aliases: ['bulkaction', 'mass'],
  description: 'Perform bulk message operations',
  usage: '<delete/pin/unpin> <amount>',
  category: 'utility',
  cooldown: 30,
  guildOnly: true,
  userPermissions: [PermissionFlagsBits.ManageMessages],
  botPermissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    const action = args[0]?.toLowerCase();
    const amount = parseInt(args[1]);

    if (!action || !['delete', 'pin', 'unpin'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🔧 Bulk Actions')
        .setDescription(
          '**Perform bulk message operations!**\n\n' +
            '**Commands:**\n' +
            '`//bulk delete <amount>` - Delete messages\n' +
            '`//bulk pin <amount>` - Pin recent messages\n' +
            '`//bulk unpin <amount>` - Unpin messages\n\n' +
            '**Limits:**\n' +
            '• Delete: 2-100 messages\n' +
            '• Pin: 1-50 messages\n' +
            '• Requires Manage Messages permission\n\n' +
            '**Examples:**\n' +
            '`//bulk delete 50` - Delete 50 messages\n' +
            '`//bulk pin 5` - Pin 5 recent messages'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (isNaN(amount) || amount < 1) {
      return message.reply('❌ Please provide a valid amount!');
    }

    if (action === 'delete') {
      if (amount < 2 || amount > 100) {
        return message.reply('❌ Amount must be between 2 and 100!');
      }

      const loadingMsg = await message.reply('🗑️ Deleting messages...');

      try {
        const deleted = await message.channel.bulkDelete(amount, true);

        await loadingMsg.edit(
          `✅ Deleted **${deleted.size}** message${deleted.size !== 1 ? 's' : ''}!`
        );

        setTimeout(() => loadingMsg.delete().catch(() => {}), 5000);
      } catch (error) {
        console.error('Bulk delete error:', error);
        await loadingMsg.edit('❌ Failed to delete messages!');
      }
    }

    if (action === 'pin') {
      if (amount < 1 || amount > 50) {
        return message.reply('❌ Amount must be between 1 and 50!');
      }

      const loadingMsg = await message.reply('📌 Pinning messages...');

      try {
        const messages = await message.channel.messages.fetch({
          limit: amount,
        });
        let pinned = 0;

        for (const msg of messages.values()) {
          if (!msg.pinned) {
            await msg.pin();
            pinned++;
          }
        }

        await loadingMsg.edit(
          `✅ Pinned **${pinned}** message${pinned !== 1 ? 's' : ''}!`
        );
      } catch (error) {
        console.error('Bulk pin error:', error);
        await loadingMsg.edit('❌ Failed to pin messages!');
      }
    }

    if (action === 'unpin') {
      const loadingMsg = await message.reply('📌 Unpinning messages...');

      try {
        const pinnedMessages = await message.channel.messages.fetchPinned();
        const toUnpin = Array.from(pinnedMessages.values()).slice(0, amount);

        for (const msg of toUnpin) {
          await msg.unpin();
        }

        await loadingMsg.edit(
          `✅ Unpinned **${toUnpin.length}** message${toUnpin.length !== 1 ? 's' : ''}!`
        );
      } catch (error) {
        console.error('Bulk unpin error:', error);
        await loadingMsg.edit('❌ Failed to unpin messages!');
      }
    }
  },
};
