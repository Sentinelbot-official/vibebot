const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ChannelType,
} = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { customId, guild, member } = interaction;

    if (customId === 'create_ticket') {
      const settings = db.get('guild_settings', guild.id) || {};
      const ticketSettings = settings.tickets;

      if (!ticketSettings || !ticketSettings.enabled) {
        return interaction.reply({
          content: '❌ Ticket system is not set up!',
          ephemeral: true,
        });
      }

      // Check if user already has a ticket
      const existingTicket = guild.channels.cache.find(
        ch =>
          ch.name === `ticket-${member.user.username.toLowerCase()}` &&
          ch.topic === member.id
      );

      if (existingTicket) {
        return interaction.reply({
          content: `❌ You already have a ticket open: ${existingTicket}`,
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        // Create ticket channel
        const ticketChannel = await guild.channels.create({
          name: `ticket-${member.user.username}`,
          type: ChannelType.GuildText,
          topic: member.id,
          parent: ticketSettings.categoryId,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: member.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            {
              id: interaction.client.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ManageChannels,
              ],
            },
          ],
        });

        // Increment counter
        ticketSettings.counter = (ticketSettings.counter || 0) + 1;
        db.set('guild_settings', guild.id, settings);

        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`🎫 Ticket #${ticketSettings.counter}`)
          .setDescription(
            `Welcome ${member}!\n\n` +
              'Please describe your issue and our staff will assist you shortly.\n' +
              'To close this ticket, click the button below.'
          )
          .setFooter({ text: `Ticket created by ${member.user.tag}` })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
          content: `${member}`,
          embeds: [embed],
          components: [row],
        });

        await interaction.editReply({
          content: `✅ Ticket created: ${ticketChannel}`,
        });
      } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.editReply({ content: '❌ Failed to create ticket!' });
      }
    }

    if (customId === 'close_ticket') {
      const channel = interaction.channel;

      if (!channel.topic) {
        return interaction.reply({
          content: '❌ This is not a ticket channel!',
          ephemeral: true,
        });
      }

      // Check permissions
      if (
        !member.permissions.has(PermissionsBitField.Flags.ManageChannels) &&
        channel.topic !== member.id
      ) {
        return interaction.reply({
          content: '❌ Only staff or the ticket creator can close this ticket!',
          ephemeral: true,
        });
      }

      await interaction.reply('🔒 Closing ticket in 5 seconds...');

      setTimeout(async () => {
        try {
          await channel.delete();
        } catch (error) {
          console.error('Error deleting ticket:', error);
        }
      }, 5000);
    }
  },
};
