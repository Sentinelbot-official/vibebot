const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'modmailreply',
  description: 'Reply to a modmail ticket',
  usage: '//modmailreply <ticket_id> <message>',
  aliases: ['mmreply', 'mailreply'],
  category: 'admin',
  permissions: ['ModerateMembers'],
  cooldown: 5,

  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a ticket ID and message!\n\n' +
          '**Usage:** `//modmailreply <ticket_id> <message>`\n' +
          '**Example:** `//modmailreply MM-ABC123 Thank you for contacting us...`'
      );
    }

    const ticketId = args[0].toUpperCase();
    const replyMessage = args.slice(1).join(' ');

    if (!replyMessage) {
      return message.reply('❌ Please provide a message to send!');
    }

    // Get ticket from database
    const tickets = db.get('modmail_tickets', message.guild.id) || {};
    const ticket = tickets[ticketId];

    if (!ticket) {
      return message.reply(
        `❌ Ticket **${ticketId}** not found!\n\n` +
          'Use `//modmaillist` to see all open tickets.'
      );
    }

    if (ticket.status === 'closed') {
      return message.reply(
        `❌ Ticket **${ticketId}** is already closed!\n\n` +
          'Use `//modmailreopen ${ticketId}` to reopen it.'
      );
    }

    try {
      // Get the user
      const user = await message.client.users.fetch(ticket.userId);

      if (!user) {
        return message.reply(
          '❌ Could not find the user who created this ticket.'
        );
      }

      // Send reply to user via DM
      const userEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📬 Reply from ${message.guild.name} Staff`)
        .setDescription(replyMessage)
        .addFields(
          {
            name: '🎫 Ticket ID',
            value: ticketId,
            inline: true,
          },
          {
            name: '👤 Staff Member',
            value: message.author.tag,
            inline: true,
          }
        )
        .setThumbnail(message.guild.iconURL({ dynamic: true }))
        .setFooter({
          text: 'Reply with //modmail to send another message',
        })
        .setTimestamp();

      await user.send({ embeds: [userEmbed] });

      // Update ticket in database
      if (!ticket.replies) {
        ticket.replies = [];
      }
      ticket.replies.push({
        staffId: message.author.id,
        staffTag: message.author.tag,
        message: replyMessage,
        timestamp: Date.now(),
      });
      ticket.lastReply = Date.now();
      tickets[ticketId] = ticket;
      db.set('modmail_tickets', message.guild.id, tickets);

      // Send confirmation in modmail channel
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Reply Sent!')
        .setDescription(
          `**Ticket:** ${ticketId}\n` +
            `**To:** ${user.tag}\n` +
            `**From:** ${message.author.tag}\n\n` +
            `**Message:**\n${replyMessage}`
        )
        .setTimestamp();

      await message.reply({ embeds: [confirmEmbed] });

      // Update the original modmail message
      const modmailChannel = message.guild.channels.cache.get(
        ticket.channelId
      );
      if (modmailChannel) {
        const staffMsg = await modmailChannel.messages
          .fetch(ticket.staffMessageId)
          .catch(() => null);
        if (staffMsg) {
          const updatedEmbed = EmbedBuilder.from(staffMsg.embeds[0]).addFields({
            name: `💬 Reply by ${message.author.tag}`,
            value:
              replyMessage.length > 100
                ? replyMessage.substring(0, 100) + '...'
                : replyMessage,
          });
          await staffMsg.edit({ embeds: [updatedEmbed] });
        }
      }

      // Log the reply
      const logger = require('../../utils/logger');
      logger.info(
        `[MODMAIL] ${message.author.tag} replied to ticket ${ticketId}`
      );
    } catch (error) {
      console.error('Modmail reply error:', error);

      if (error.code === 50007) {
        return message.reply(
          '❌ Could not send DM to the user - they may have DMs disabled or blocked the bot.'
        );
      }

      return message.reply(
        '❌ Failed to send reply. Please try again later or contact the user directly.'
      );
    }
  },
};
