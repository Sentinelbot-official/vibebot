const { EmbedBuilder, Events } = require('discord.js');
const db = require('../utils/database');
const logger = require('../utils/logger');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Only handle DMs
    if (message.channel.type !== 1) return; // 1 = DM

    // Check if user has an active modmail session
    const userSessions = db.get('modmail_sessions', message.author.id) || {};

    // If user has no active session, show server selection
    if (!userSessions.activeGuildId) {
      await handleServerSelection(message, userSessions);
      return;
    }

    // User has active session, forward message to modmail channel
    await forwardToModmail(message, userSessions);
  },
};

/**
 * Handle server selection for new modmail
 */
async function handleServerSelection(message, userSessions) {
  // Get all mutual servers with modmail enabled
  const mutualServers = message.client.guilds.cache.filter(guild => {
    const member = guild.members.cache.get(message.author.id);
    if (!member) return false;

    const settings = db.get('guild_settings', guild.id) || {};
    return settings.modmail?.enabled;
  });

  if (mutualServers.size === 0) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ No Servers Available')
      .setDescription(
        'None of your servers have modmail enabled!\n\n' +
          'Ask a server administrator to set it up with:\n' +
          '`//setupmodmail #channel`'
      );

    return message.reply({ embeds: [embed] });
  }

  // If only one server, auto-select it
  if (mutualServers.size === 1) {
    const guild = mutualServers.first();
    await startModmailSession(message, guild);
    return;
  }

  // Multiple servers - show selection menu
  const serverList = mutualServers
    .map((guild, index) => `**${index + 1}.** ${guild.name}`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('📬 Select a Server')
    .setDescription(
      'Which server would you like to contact?\n\n' +
        serverList +
        '\n\n' +
        '**Reply with the number** of the server you want to contact.\n' +
        'Or type `cancel` to cancel.'
    )
    .setFooter({ text: 'This message will expire in 60 seconds' });

  await message.reply({ embeds: [embed] });

  // Wait for user response
  const filter = m =>
    m.author.id === message.author.id &&
    (m.content.toLowerCase() === 'cancel' ||
      (!isNaN(parseInt(m.content)) &&
        parseInt(m.content) > 0 &&
        parseInt(m.content) <= mutualServers.size));

  try {
    const collected = await message.channel.awaitMessages({
      filter,
      max: 1,
      time: 60000,
      errors: ['time'],
    });

    const response = collected.first();

    if (response.content.toLowerCase() === 'cancel') {
      return message.reply('❌ Cancelled.');
    }

    const selectedIndex = parseInt(response.content) - 1;
    const selectedGuild = Array.from(mutualServers.values())[selectedIndex];

    await startModmailSession(message, selectedGuild);
  } catch (error) {
    return message.reply('⏱️ Selection timed out. Please try again.');
  }
}

/**
 * Start a new modmail session
 */
async function startModmailSession(message, guild) {
  const settings = db.get('guild_settings', guild.id) || {};
  const modmailChannel = guild.channels.cache.get(settings.modmail.channelId);

  if (!modmailChannel) {
    return message.reply(
      '❌ Modmail channel not found! Please contact a server administrator.'
    );
  }

  // Create ticket ID
  const ticketId = `MM-${Date.now().toString(36).toUpperCase()}`;

  // Create thread in modmail channel for this ticket
  let thread;
  try {
    // Create initial message in modmail channel
    const initialEmbed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('📬 New Modmail Thread')
      .setDescription('User is typing their message...')
      .addFields(
        {
          name: '👤 User',
          value: `${message.author.tag} (${message.author.id})`,
          inline: true,
        },
        {
          name: '🎫 Ticket ID',
          value: ticketId,
          inline: true,
        }
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    const initialMsg = await modmailChannel.send({ embeds: [initialEmbed] });

    // Create thread from the message
    thread = await initialMsg.startThread({
      name: `${message.author.username} - ${ticketId}`,
      autoArchiveDuration: 1440, // 24 hours
      reason: `Modmail from ${message.author.tag}`,
    });

    // Save session to database
    const userSessions = db.get('modmail_sessions', message.author.id) || {};
    userSessions.activeGuildId = guild.id;
    userSessions.ticketId = ticketId;
    userSessions.threadId = thread.id;
    userSessions.channelId = modmailChannel.id;
    userSessions.startedAt = Date.now();
    db.set('modmail_sessions', message.author.id, userSessions);

    // Save ticket to guild database
    const tickets = db.get('modmail_tickets', guild.id) || {};
    tickets[ticketId] = {
      userId: message.author.id,
      username: message.author.tag,
      createdAt: Date.now(),
      status: 'open',
      threadId: thread.id,
      channelId: modmailChannel.id,
      messages: [],
    };
    db.set('modmail_tickets', guild.id, tickets);

    // Send confirmation to user
    const confirmEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`✅ Connected to ${guild.name}`)
      .setDescription(
        `Your modmail session has started!\n\n` +
          `**Ticket ID:** ${ticketId}\n\n` +
          '**How it works:**\n' +
          '• Simply type your messages here\n' +
          '• Staff will see them and can reply\n' +
          '• Type `close` to end the session\n' +
          '• Type `switch` to contact a different server\n\n' +
          '**Now, what would you like to tell the staff?**'
      )
      .setFooter({ text: 'Your messages are private' })
      .setTimestamp();

    await message.reply({ embeds: [confirmEmbed] });

    logger.info(
      `[MODMAIL] Started DM session ${ticketId} for ${message.author.tag} in ${guild.name}`
    );
  } catch (error) {
    console.error('Error starting modmail session:', error);
    return message.reply(
      '❌ Failed to start modmail session. Please try again later.'
    );
  }
}

/**
 * Forward user message to modmail thread
 */
async function forwardToModmail(message, userSessions) {
  const guildId = userSessions.activeGuildId;
  const ticketId = userSessions.ticketId;
  const threadId = userSessions.threadId;

  // Handle special commands
  if (message.content.toLowerCase() === 'close') {
    await closeModmailSession(message, userSessions);
    return;
  }

  if (message.content.toLowerCase() === 'switch') {
    // Clear active session and restart
    const sessions = db.get('modmail_sessions', message.author.id) || {};
    delete sessions.activeGuildId;
    db.set('modmail_sessions', message.author.id, sessions);
    await handleServerSelection(message, sessions);
    return;
  }

  try {
    const guild = message.client.guilds.cache.get(guildId);
    if (!guild) {
      return message.reply(
        '❌ Server not found. Your session may have expired. Please start a new one.'
      );
    }

    const thread = await guild.channels.fetch(threadId).catch(() => null);
    if (!thread) {
      return message.reply(
        '❌ Modmail thread not found. Your session may have been closed by staff.'
      );
    }

    // Create embed for staff
    const staffEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(message.content)
      .setFooter({ text: 'User Message' })
      .setTimestamp();

    // Add attachments if any
    if (message.attachments.size > 0) {
      const attachmentUrls = message.attachments.map(att => att.url).join('\n');
      staffEmbed.addFields({
        name: '📎 Attachments',
        value: attachmentUrls,
      });
    }

    await thread.send({ embeds: [staffEmbed] });

    // Update ticket in database
    const tickets = db.get('modmail_tickets', guildId) || {};
    if (tickets[ticketId]) {
      if (!tickets[ticketId].messages) {
        tickets[ticketId].messages = [];
      }
      tickets[ticketId].messages.push({
        author: message.author.id,
        content: message.content,
        timestamp: Date.now(),
        attachments: message.attachments.map(att => att.url),
      });
      tickets[ticketId].lastMessage = Date.now();
      db.set('modmail_tickets', guildId, tickets);
    }

    // React to confirm message was sent
    await message.react('✅').catch(() => {});
  } catch (error) {
    console.error('Error forwarding modmail:', error);
    await message.reply(
      '❌ Failed to send message. Please try again or contact staff directly.'
    );
  }
}

/**
 * Close modmail session
 */
async function closeModmailSession(message, userSessions) {
  const guildId = userSessions.activeGuildId;
  const ticketId = userSessions.ticketId;
  const threadId = userSessions.threadId;

  try {
    const guild = message.client.guilds.cache.get(guildId);
    if (guild) {
      const thread = await guild.channels.fetch(threadId).catch(() => null);
      if (thread) {
        const closeEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🔒 Session Closed by User')
          .setDescription(
            `${message.author.tag} has closed this modmail session.`
          )
          .setTimestamp();

        await thread.send({ embeds: [closeEmbed] });
        await thread.setArchived(true).catch(() => {});
      }

      // Update ticket status
      const tickets = db.get('modmail_tickets', guildId) || {};
      if (tickets[ticketId]) {
        tickets[ticketId].status = 'closed';
        tickets[ticketId].closedBy = message.author.id;
        tickets[ticketId].closedAt = Date.now();
        db.set('modmail_tickets', guildId, tickets);
      }
    }

    // Clear session
    db.delete('modmail_sessions', message.author.id);

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Session Closed')
      .setDescription(
        'Your modmail session has been closed.\n\n' +
          'Thank you for contacting us! Feel free to send another message anytime.'
      );

    await message.reply({ embeds: [embed] });

    logger.info(
      `[MODMAIL] User ${message.author.tag} closed session ${ticketId}`
    );
  } catch (error) {
    console.error('Error closing session:', error);
    await message.reply('❌ Failed to close session properly.');
  }
}
