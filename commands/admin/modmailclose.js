const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'modmailclose',
  description: 'Close a modmail ticket',
  usage: '//modmailclose <ticket_id> [reason]',
  aliases: ['mmclose', 'closemail'],
  category: 'admin',
  permissions: ['ModerateMembers'],
  cooldown: 5,

  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a ticket ID!\n\n' +
          '**Usage:** `//modmailclose <ticket_id> [reason]`\n' +
          '**Example:** `//modmailclose MM-ABC123 Issue resolved`'
      );
    }

    const ticketId = args[0].toUpperCase();
    const reason = args.slice(1).join(' ') || 'No reason provided';

    // Get ticket from database
    const tickets = db.get('modmail_tickets', message.guild.id) || {};
    const ticket = tickets[ticketId];

    if (!ticket) {
      return message.reply(
        `❌ Ticket **${ticketId}** not found!\n\n` +
          'Use `//modmaillist` to see all tickets.'
      );
    }

    if (ticket.status === 'closed') {
      return message.reply(`❌ Ticket **${ticketId}** is already closed!`);
    }

    try {
      // Update ticket status
      ticket.status = 'closed';
      ticket.closedBy = message.author.id;
      ticket.closedAt = Date.now();
      ticket.closeReason = reason;
      tickets[ticketId] = ticket;
      db.set('modmail_tickets', message.guild.id, tickets);

      // Notify user via DM
      const user = await message.client.users.fetch(ticket.userId);
      if (user) {
        const userEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle(`🔒 Modmail Ticket Closed`)
          .setDescription(
            `Your modmail ticket in **${message.guild.name}** has been closed.\n\n` +
              `**Ticket ID:** ${ticketId}\n` +
              `**Closed by:** ${message.author.tag}\n` +
              `**Reason:** ${reason}\n\n` +
              'If you need further assistance, feel free to send another modmail!'
          )
          .setFooter({ text: 'Thank you for contacting us!' })
          .setTimestamp();

        await user.send({ embeds: [userEmbed] }).catch(() => {});
      }

      // Update the modmail message
      const modmailChannel = message.guild.channels.cache.get(
        ticket.channelId
      );
      if (modmailChannel) {
        const staffMsg = await modmailChannel.messages
          .fetch(ticket.staffMessageId)
          .catch(() => null);
        if (staffMsg) {
          const updatedEmbed = EmbedBuilder.from(staffMsg.embeds[0])
            .setColor('#ff0000')
            .addFields({
              name: '🔒 Closed',
              value: `By: ${message.author.tag}\nReason: ${reason}\nAt: <t:${Math.floor(Date.now() / 1000)}:R>`,
            });
          await staffMsg.edit({ embeds: [updatedEmbed] });
        }
      }

      // Send confirmation
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Ticket Closed')
        .setDescription(
          `**Ticket:** ${ticketId}\n` +
            `**User:** ${ticket.username}\n` +
            `**Closed by:** ${message.author.tag}\n` +
            `**Reason:** ${reason}`
        )
        .setTimestamp();

      await message.reply({ embeds: [confirmEmbed] });

      // Log the closure
      const logger = require('../../utils/logger');
      logger.info(
        `[MODMAIL] ${message.author.tag} closed ticket ${ticketId}: ${reason}`
      );
    } catch (error) {
      console.error('Modmail close error:', error);
      return message.reply(
        '❌ Failed to close ticket. Please try again later.'
      );
    }
  },
};
