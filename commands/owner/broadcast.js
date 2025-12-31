const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const branding = require('../../utils/branding');

module.exports = {
  name: 'broadcast',
  aliases: ['announce-all', 'globalannounce'],
  description: 'Send a message to all servers (Owner Only)',
  usage: '<message>',
  category: 'owner',
  ownerOnly: true,
  cooldown: 0,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a message to broadcast!\n' +
          'Usage: `broadcast <message>`'
      );
    }

    const broadcastMessage = args.join(' ');

    // Confirmation
    const confirmEmbed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('⚠️ Broadcast Confirmation')
      .setDescription(
        `You are about to send this message to **${message.client.guilds.cache.size} servers**:\n\n` +
          `**Message:**\n${broadcastMessage}\n\n` +
          `React with ✅ to confirm or ❌ to cancel.\n` +
          `This will expire in 30 seconds.`
      )
      .setFooter({
        text: '🔴 Owner Command',
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    const confirmMsg = await message.reply({ embeds: [confirmEmbed] });
    await confirmMsg.react('✅');
    await confirmMsg.react('❌');

    const filter = (reaction, user) =>
      ['✅', '❌'].includes(reaction.emoji.name) &&
      user.id === message.author.id;

    try {
      const collected = await confirmMsg.awaitReactions({
        filter,
        max: 1,
        time: 30000,
        errors: ['time'],
      });

      const reaction = collected.first();

      if (reaction.emoji.name === '❌') {
        return confirmMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('❌ Broadcast Cancelled')
              .setDescription('The broadcast has been cancelled.')
              .setTimestamp(),
          ],
        });
      }

      // Start broadcasting
      const statusEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📡 Broadcasting...')
        .setDescription('Sending message to all servers...')
        .setTimestamp();

      await confirmMsg.edit({ embeds: [statusEmbed] });

      let successCount = 0;
      let failCount = 0;

      const broadcastEmbed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle('📢 Announcement from Bot Owner')
        .setDescription(broadcastMessage)
        .setFooter({
          text: 'Vibe Bot | Built 24/7 on Twitch',
          iconURL: message.client.user.displayAvatarURL(),
        })
        .setTimestamp();

      for (const guild of message.client.guilds.cache.values()) {
        try {
          // Try to find a suitable channel
          const channel =
            guild.systemChannel ||
            guild.channels.cache.find(
              c =>
                c.type === 0 &&
                c.permissionsFor(guild.members.me).has('SendMessages')
            );

          if (channel) {
            await channel.send({ embeds: [broadcastEmbed] });
            successCount++;
          } else {
            failCount++;
          }

          // Rate limit protection
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          failCount++;
          logger.error(`Failed to broadcast to ${guild.name}:`, error.message);
        }
      }

      const resultEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Broadcast Complete')
        .setDescription(
          `**Message sent to ${successCount} servers**\n` +
            `**Failed:** ${failCount} servers\n\n` +
            `**Message:**\n${broadcastMessage}`
        )
        .setFooter({
          text: '🔴 Owner Command',
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      await confirmMsg.edit({ embeds: [resultEmbed] });

      logger.warn(
        `📡 Broadcast sent by ${message.author.tag} to ${successCount} servers (${failCount} failed)`
      );
    } catch (error) {
      if (error.message === 'time') {
        return confirmMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('⏱️ Broadcast Timed Out')
              .setDescription('The broadcast confirmation timed out.')
              .setTimestamp(),
          ],
        });
      }
      throw error;
    }
  },
};
