const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'modmailreopen',
  description: 'Reopen a closed modmail ticket',
  usage: '//modmailreopen <ticket_id>',
  aliases: ['mmreopen', 'reopenmail'],
  category: 'admin',
  permissions: ['ModerateMembers'],
  cooldown: 5,

  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a ticket ID!\n\n' +
          '**Usage:** `//modmailreopen <ticket_id>`\n' +
          '**Example:** `//modmailreopen MM-ABC123`'
      );
    }

    const ticketId = args[0].toUpperCase();

    // Get ticket from database
    const tickets = db.get('modmail_tickets', message.guild.id) || {};
    const ticket = tickets[ticketId];

    if (!ticket) {
      return message.reply(
        `❌ Ticket **${ticketId}** not found!\n\n` +
          'Use `//modmaillist all` to see all tickets.'
      );
    }

    if (ticket.status === 'open') {
      return message.reply(`❌ Ticket **${ticketId}** is already open!`);
    }

    try {
      // Update ticket status
      ticket.status = 'open';
      ticket.reopenedBy = message.author.id;
      ticket.reopenedAt = Date.now();
      tickets[ticketId] = ticket;
      db.set('modmail_tickets', message.guild.id, tickets);

      // Notify user via DM
      const user = await message.client.users.fetch(ticket.userId);
      if (user) {
        const userEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle(`🔓 Modmail Ticket Reopened`)
          .setDescription(
            `Your modmail ticket in **${message.guild.name}** has been reopened.\n\n` +
              `**Ticket ID:** ${ticketId}\n` +
              `**Reopened by:** ${message.author.tag}\n\n` +
              'Staff may send you additional messages regarding your ticket.'
          )
          .setTimestamp();

        await user.send({ embeds: [userEmbed] }).catch(() => {});
      }

      // Update the modmail message
      const modmailChannel = message.guild.channels.cache.get(ticket.channelId);
      if (modmailChannel) {
        const staffMsg = await modmailChannel.messages
          .fetch(ticket.staffMessageId)
          .catch(() => null);
        if (staffMsg && staffMsg.embeds && staffMsg.embeds.length > 0) {
          try {
            const updatedEmbed = EmbedBuilder.from(staffMsg.embeds[0])
              .setColor('#ff9900')
              .addFields({
                name: '🔓 Reopened',
                value: `By: ${message.author.tag}\nAt: <t:${Math.floor(Date.now() / 1000)}:R>`,
              });
            await staffMsg.edit({ embeds: [updatedEmbed] });
          } catch (embedError) {
            console.error('Error updating modmail embed:', embedError);
            // Continue anyway, ticket is still reopened
          }
        }
      }

      // Send confirmation
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Ticket Reopened')
        .setDescription(
          `**Ticket:** ${ticketId}\n` +
            `**User:** ${ticket.username}\n` +
            `**Reopened by:** ${message.author.tag}`
        )
        .setTimestamp();

      await message.reply({ embeds: [confirmEmbed] });

      // Log the reopening
      const logger = require('../../utils/logger');
const branding = require('../../utils/branding');
      logger.info(
        `[MODMAIL] ${message.author.tag} reopened ticket ${ticketId}`
      );
    } catch (error) {
      console.error('Modmail reopen error:', error);
      return message.reply(
        '❌ Failed to reopen ticket. Please try again later.'
      );
    }
  },
};
