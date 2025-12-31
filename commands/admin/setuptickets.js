const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setuptickets',
  description: 'Setup ticket system',
  usage: '<#channel> [category_id]',
  category: 'admin',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.reply('❌ You need Administrator permission!');
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('❌ Please mention a channel for the ticket panel!');
    }

    const categoryId = args[1] || null;

    const settings = db.get('guild_settings', message.guild.id) || {};
    settings.tickets = {
      enabled: true,
      channelId: channel.id,
      categoryId,
      counter: 0,
    };
    db.set('guild_settings', message.guild.id, settings);

    // Create ticket panel
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('🎫 Support Tickets')
      .setDescription(
        'Need help? Create a ticket!\n\n' +
          'Click the button below to open a support ticket.\n' +
          'Our staff will assist you as soon as possible.'
      )
      .setFooter({ text: 'Vibe Bot Ticket System' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setEmoji('🎫')
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });

    message.reply('✅ Ticket system setup complete!');
  },
};
