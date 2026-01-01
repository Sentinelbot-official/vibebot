const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'unlock',
  description: 'Unlock all channels in the server',
  usage: '[reason]',
  aliases: ['unlockall', 'serverunlock'],
  category: 'admin',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const reason = args.join(' ') || 'Server unlocked';

    const confirmMsg = await message.reply(
      '⚠️ **WARNING:** This will unlock ALL channels in the server!\nReact with ✅ to confirm or ❌ to cancel.'
    );

    await confirmMsg.react('✅');
    await confirmMsg.react('❌');

    const filter = (reaction, user) => {
      return (
        ['✅', '❌'].includes(reaction.emoji.name) &&
        user.id === message.author.id
      );
    };

    const collector = confirmMsg.createReactionCollector({
      filter,
      max: 1,
      time: 30000,
    });

    collector.on('collect', async reaction => {
      if (reaction.emoji.name === '❌') {
        return confirmMsg.edit('❌ Unlock cancelled.');
      }

      await confirmMsg.edit('🔓 Unlocking server...');

      const channels = message.guild.channels.cache.filter(
        c => c.isTextBased() && c.permissionsFor(message.guild.id)
      );

      let unlocked = 0;
      let failed = 0;

      for (const [_id, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: null, // Reset to default
          });
          unlocked++;
        } catch (error) {
          failed++;
          console.error(`Failed to unlock ${channel.name}:`, error);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('🔓 Server Unlocked')
        .setDescription(reason)
        .addFields(
          {
            name: 'Channels Unlocked',
            value: `${unlocked}`,
            inline: true,
          },
          {
            name: 'Failed',
            value: `${failed}`,
            inline: true,
          },
          {
            name: 'Initiated By',
            value: message.author.tag,
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      confirmMsg.edit({ content: null, embeds: [embed] });

      // Announce in all channels
      for (const [_id, channel] of channels) {
        if (unlocked > 0) {
          try {
            await channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(branding.colors.success)
                  .setTitle('🔓 Channel Unlocked')
                  .setDescription(
                    `This channel has been unlocked.\n**Reason:** ${reason}`
                  )
                  .setFooter(branding.footers.default)
                  .setTimestamp(),
              ],
            });
          } catch {
            // Ignore errors
          }
        }
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        confirmMsg.edit('❌ Unlock timed out.');
      }
    });
  },
};
