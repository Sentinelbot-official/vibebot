const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'modmaillist',
  description: 'List all modmail tickets',
  usage: '//modmaillist [open|closed|all]',
  aliases: ['mmlist', 'listmail'],
  category: 'admin',
  permissions: ['ModerateMembers'],
  cooldown: 5,

  async execute(message, args) {
    const filter = args[0]?.toLowerCase() || 'open';

    if (!['open', 'closed', 'all'].includes(filter)) {
      return message.reply(
        '❌ Invalid filter! Use: `open`, `closed`, or `all`'
      );
    }

    // Get tickets from database
    const tickets = db.get('modmail_tickets', message.guild.id) || {};
    const ticketArray = Object.entries(tickets);

    if (ticketArray.length === 0) {
      return message.reply('📭 No modmail tickets found!');
    }

    // Filter tickets
    let filteredTickets = ticketArray;
    if (filter === 'open') {
      filteredTickets = ticketArray.filter(([_, t]) => t.status === 'open');
    } else if (filter === 'closed') {
      filteredTickets = ticketArray.filter(([_, t]) => t.status === 'closed');
    }

    if (filteredTickets.length === 0) {
      return message.reply(`📭 No ${filter} modmail tickets found!`);
    }

    // Sort by creation date (newest first)
    filteredTickets.sort((a, b) => b[1].createdAt - a[1].createdAt);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(
        `📬 Modmail Tickets (${filter.charAt(0).toUpperCase() + filter.slice(1)})`
      )
      .setDescription(
        `Showing ${filteredTickets.length} ${filter} ticket(s)\n\n` +
          filteredTickets
            .slice(0, 10)
            .map(([id, ticket]) => {
              const status = ticket.status === 'open' ? '🟢' : '🔴';
              const age = Math.floor((Date.now() - ticket.createdAt) / 1000);
              return (
                `${status} **${id}**\n` +
                `└ From: ${ticket.username}\n` +
                `└ Created: <t:${Math.floor(ticket.createdAt / 1000)}:R>\n` +
                `└ Message: ${ticket.message.substring(0, 50)}${ticket.message.length > 50 ? '...' : ''}`
              );
            })
            .join('\n\n')
      )
      .setFooter({
        text:
          filteredTickets.length > 10
            ? `Showing 10 of ${filteredTickets.length} tickets`
            : `Total: ${filteredTickets.length} tickets`,
      })
      .setTimestamp();

    // Add stats
    const openCount = ticketArray.filter(
      ([_, t]) => t.status === 'open'
    ).length;
    const closedCount = ticketArray.filter(
      ([_, t]) => t.status === 'closed'
    ).length;

    embed.addFields({
      name: '📊 Statistics',
      value: `🟢 Open: ${openCount}\n🔴 Closed: ${closedCount}\n📝 Total: ${ticketArray.length}`,
      inline: true,
    });

    await message.reply({ embeds: [embed] });
  },
};
