const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'unlockall',
  description: 'Unlock all channels in the server',
  usage: '[reason]',
  aliases: ['serverunlock'],
  category: 'admin',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const reason = args.join(' ') || 'Server unlocked';

    try {
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

      // Get ALL text-based channels
      const channels = message.guild.channels.cache.filter(c => c.isTextBased());

      let unlocked = 0;
      let failed = 0;
      let skipped = 0;
      const unlockedChannels = []; // Track which channels were actually unlocked

      for (const [_id, channel] of channels) {
        try {
          // Check if there's a permission overwrite for @everyone
          const everyoneOverwrite = channel.permissionOverwrites.cache.get(message.guild.id);
          
          if (everyoneOverwrite) {
            // Check if SendMessages is explicitly denied
            const permissions = everyoneOverwrite.deny;
            if (permissions.has('SendMessages')) {
              // Delete the entire overwrite to restore default permissions
              await everyoneOverwrite.delete();
              unlocked++;
              unlockedChannels.push(channel); // Track this channel
            } else {
              skipped++;
            }
          } else {
            // No overwrite means it's already unlocked
            skipped++;
          }
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
            name: 'Already Unlocked',
            value: `${skipped}`,
            inline: true,
          },
          {
            name: 'Failed',
            value: `${failed}`,
            inline: true,
          },
          {
            name: 'Total Channels',
            value: `${channels.size}`,
            inline: true,
          },
          {
            name: 'Initiated By',
            value: message.author.tag,
            inline: false,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await confirmMsg.edit({ content: null, embeds: [embed] });

      // Only announce in channels that were actually unlocked
      if (unlocked > 0) {
        for (const channel of unlockedChannels) {
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

    } catch (error) {
      console.error('Error in unlock command:', error);
      return message.reply('❌ An error occurred while trying to unlock channels. Check console for details.');
    }
  },
};
