const { EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setupmodmail',
  description: 'Setup the modmail system for your server',
  usage: '//setupmodmail <#channel|disable>',
  aliases: ['modmailsetup', 'mmsetup'],
  category: 'admin',
  permissions: ['ManageGuild'],
  cooldown: 10,

  async execute(message, args) {
    const settings = db.get('guild_settings', message.guild.id) || {};

    // Show current status if no args
    if (!args.length) {
      const currentStatus = settings.modmail?.enabled
        ? `✅ Enabled\n**Channel:** <#${settings.modmail.channelId}>`
        : '❌ Disabled';

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📬 Modmail System Setup')
        .setDescription(
          'Configure the modmail system for your server!\n\n' +
            '**Current Status:**\n' +
            currentStatus +
            '\n\n' +
            '**Usage:**\n' +
            '`//setupmodmail #channel` - Enable modmail in a channel\n' +
            '`//setupmodmail disable` - Disable modmail\n\n' +
            '**What is Modmail?**\n' +
            '• Users can privately contact staff using `//modmail`\n' +
            '• Messages are sent anonymously to the modmail channel\n' +
            '• Staff can reply using `//modmailreply`\n' +
            '• Tickets can be closed with `//modmailclose`'
        )
        .setFooter({ text: 'Requires Manage Server permission' });

      return message.reply({ embeds: [embed] });
    }

    // Disable modmail
    if (args[0].toLowerCase() === 'disable') {
      if (!settings.modmail?.enabled) {
        return message.reply('❌ Modmail is already disabled!');
      }

      settings.modmail = { enabled: false };
      db.set('guild_settings', message.guild.id, settings);

      return message.reply('✅ Modmail has been disabled!');
    }

    // Enable modmail with channel
    const channel =
      message.mentions.channels.first() ||
      message.guild.channels.cache.get(args[0]);

    if (!channel) {
      return message.reply(
        '❌ Please mention a valid channel!\n\n' +
          '**Usage:** `//setupmodmail #modmail-channel`'
      );
    }

    // Validate channel type
    if (channel.type !== ChannelType.GuildText) {
      return message.reply('❌ Please select a text channel!');
    }

    // Check bot permissions
    const botPermissions = channel.permissionsFor(message.guild.members.me);
    if (
      !botPermissions.has('ViewChannel') ||
      !botPermissions.has('SendMessages') ||
      !botPermissions.has('EmbedLinks')
    ) {
      return message.reply(
        `❌ I don't have the required permissions in ${channel}!\n\n` +
          '**Required Permissions:**\n' +
          '• View Channel\n' +
          '• Send Messages\n' +
          '• Embed Links'
      );
    }

    // Save settings
    settings.modmail = {
      enabled: true,
      channelId: channel.id,
      setupBy: message.author.id,
      setupAt: Date.now(),
    };
    db.set('guild_settings', message.guild.id, settings);

    // Send confirmation
    const confirmEmbed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Modmail Setup Complete!')
      .setDescription(
        `Modmail has been enabled in ${channel}!\n\n` +
          '**How it works:**\n' +
          '1️⃣ Users use `//modmail <message>` to contact staff\n' +
          '2️⃣ Messages appear in this channel with a ticket ID\n' +
          '3️⃣ Staff use `//modmailreply <ticket_id> <message>` to respond\n' +
          '4️⃣ Close tickets with `//modmailclose <ticket_id>`\n\n' +
          '**Additional Commands:**\n' +
          '• `//modmaillist` - View all open tickets\n' +
          '• `//modmailreopen <id>` - Reopen a closed ticket'
      )
      .setFooter({ text: 'Modmail is now active!' })
      .setTimestamp();

    await message.reply({ embeds: [confirmEmbed] });

    // Send test message to modmail channel
    const testEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📬 Modmail Channel Active')
      .setDescription(
        'This channel is now configured for modmail!\n\n' +
          'User modmail messages will appear here. Staff can reply using the commands shown in each ticket.'
      )
      .setFooter({ text: `Setup by ${message.author.tag}` })
      .setTimestamp();

    await channel.send({ embeds: [testEmbed] });

    // Log the setup
    const logger = require('../../utils/logger');
    logger.info(
      `[MODMAIL] Setup by ${message.author.tag} in ${message.guild.name} - Channel: ${channel.name}`
    );
  },
};
