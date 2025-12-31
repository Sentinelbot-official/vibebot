const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'modmail',
  description: 'Send a private message to server staff',
  usage: '//modmail <message>',
  aliases: ['mail', 'contactstaff'],
  category: 'utility',
  cooldown: 300, // 5 minutes to prevent spam

  async execute(message, args) {
    // Check if in DMs
    if (!message.guild) {
      return message.reply(
        '❌ Please use this command in a server, not in DMs!\n\n' +
          'The modmail will be sent to the staff of that server.'
      );
    }

    // Get modmail settings
    const settings = db.get('guild_settings', message.guild.id) || {};

    if (!settings.modmail?.enabled) {
      return message.reply(
        '❌ Modmail is not enabled in this server!\n\n' +
          'Ask an administrator to set it up with `//setupmodmail`'
      );
    }

    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📬 Modmail System')
        .setDescription(
          'Send a private message to the server staff!\n\n' +
            '**Usage:**\n' +
            '`//modmail <your message>`\n\n' +
            '**Example:**\n' +
            '`//modmail I need help with a user harassing me`\n\n' +
            '**Note:**\n' +
            '• Your message will be sent anonymously to staff\n' +
            '• Staff can reply to you via DM\n' +
            '• Please be respectful and provide details'
        )
        .setFooter({ text: 'Modmail is monitored by server staff' });

      return message.reply({ embeds: [embed] });
    }

    const modmailMessage = args.join(' ');

    // Validate message length
    if (modmailMessage.length > 1500) {
      return message.reply(
        '❌ Your message is too long! Please keep it under 1500 characters.'
      );
    }

    try {
      // Get modmail channel
      const modmailChannel = message.guild.channels.cache.get(
        settings.modmail.channelId
      );

      if (!modmailChannel) {
        return message.reply(
          '❌ Modmail channel not found! Please contact an administrator.'
        );
      }

      // Create unique ticket ID
      const ticketId = `MM-${Date.now().toString(36).toUpperCase()}`;

      // Create modmail embed for staff
      const staffEmbed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle('📬 New Modmail Ticket')
        .setDescription(modmailMessage)
        .addFields(
          {
            name: '👤 From',
            value: `${message.author.tag} (${message.author.id})`,
            inline: true,
          },
          {
            name: '🎫 Ticket ID',
            value: ticketId,
            inline: true,
          },
          {
            name: '📅 Sent',
            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
            inline: true,
          }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({
          text: `Use //modmailreply ${ticketId} <message> to respond`,
        })
        .setTimestamp();

      const staffMsg = await modmailChannel.send({ embeds: [staffEmbed] });

      // Save ticket to database
      const tickets = db.get('modmail_tickets', message.guild.id) || {};
      tickets[ticketId] = {
        userId: message.author.id,
        username: message.author.tag,
        message: modmailMessage,
        createdAt: Date.now(),
        status: 'open',
        staffMessageId: staffMsg.id,
        channelId: modmailChannel.id,
      };
      db.set('modmail_tickets', message.guild.id, tickets);

      // Delete user's message for privacy
      await message.delete().catch(() => {});

      // Send confirmation to user via DM
      const userEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Modmail Sent!')
        .setDescription(
          `Your message has been sent to the staff of **${message.guild.name}**!\n\n` +
            `**Ticket ID:** ${ticketId}\n\n` +
            '**Your Message:**\n' +
            modmailMessage +
            '\n\n' +
            '**What happens next?**\n' +
            '• Staff will review your message\n' +
            '• They may reply to you via DM\n' +
            '• Please keep your DMs open to receive replies'
        )
        .setFooter({ text: 'Thank you for contacting us!' })
        .setTimestamp();

      await message.author
        .send({ embeds: [userEmbed] })
        .catch(() =>
          modmailChannel.send(
            `⚠️ Could not DM <@${message.author.id}> - they may have DMs disabled.`
          )
        );

      // Log the modmail
      const logger = require('../../utils/logger');
      logger.info(
        `[MODMAIL] New ticket ${ticketId} from ${message.author.tag} in ${message.guild.name}`
      );
    } catch (error) {
      console.error('Modmail error:', error);
      return message.reply(
        '❌ Failed to send modmail. Please try again later or contact an administrator directly.'
      );
    }
  },
};
