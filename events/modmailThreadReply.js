const { EmbedBuilder, Events } = require('discord.js');
const db = require('../utils/database');
const logger = require('../utils/logger');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only handle messages in threads
    if (!message.channel.isThread()) return;

    // Check if this is a modmail thread
    const threadName = message.channel.name;
    const ticketMatch = threadName.match(/MM-[A-Z0-9]+/);

    if (!ticketMatch) return;

    const ticketId = ticketMatch[0];

    // Get ticket from database
    const tickets = db.get('modmail_tickets', message.guild.id) || {};
    const ticket = tickets[ticketId];

    if (!ticket || ticket.status !== 'open') return;

    // Check if message is from staff (not using a command)
    if (message.content.startsWith('//')) return;

    try {
      // Get the user
      const user = await message.client.users.fetch(ticket.userId);

      if (!user) {
        return message.reply('❌ Could not find the user for this ticket.');
      }

      // Send reply to user via DM
      const userEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setAuthor({
          name: `${message.guild.name} Staff`,
          iconURL: message.guild.iconURL({ dynamic: true }),
        })
        .setDescription(message.content)
        .addFields({
          name: '👤 Staff Member',
          value: message.author.tag,
          inline: true,
        })
        .setFooter({
          text: `Ticket ${ticketId} | Reply here to continue the conversation`,
        })
        .setTimestamp();

      // Add attachments if any
      if (message.attachments.size > 0) {
        const attachmentUrls = message.attachments
          .map(att => att.url)
          .join('\n');
        userEmbed.addFields({
          name: '📎 Attachments',
          value: attachmentUrls,
        });
      }

      await user.send({ embeds: [userEmbed] });

      // Update ticket in database
      if (!ticket.messages) {
        ticket.messages = [];
      }
      ticket.messages.push({
        author: message.author.id,
        authorTag: message.author.tag,
        content: message.content,
        timestamp: Date.now(),
        isStaff: true,
        attachments: message.attachments.map(att => att.url),
      });
      ticket.lastReply = Date.now();
      tickets[ticketId] = ticket;
      db.set('modmail_tickets', message.guild.id, tickets);

      // React to confirm message was sent
      await message.react('✅').catch(() => {});

      logger.info(
        `[MODMAIL] ${message.author.tag} replied to ticket ${ticketId} in thread`
      );
    } catch (error) {
      console.error('Error sending modmail reply:', error);

      if (error.code === 50007) {
        await message.reply(
          '❌ Could not send DM to the user - they may have DMs disabled or blocked the bot.'
        );
      } else {
        await message.reply('❌ Failed to send reply. Please try again later.');
      }
    }
  },
};
