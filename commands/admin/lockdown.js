const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'lockdown',
  description: 'Lock all channels in the server',
  usage: '[reason]',
  aliases: ['lockall', 'serverlock'],
  category: 'admin',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const reason = args.join(' ') || 'Server lockdown initiated';

    const confirmMsg = await message.reply(
      '⚠️ **WARNING:** This will lock ALL channels in the server!\nReact with ✅ to confirm or ❌ to cancel.'
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
        return confirmMsg.edit('❌ Lockdown cancelled.');
      }

      await confirmMsg.edit('🔒 Locking down server...');

      const channels = message.guild.channels.cache.filter(
        c => c.isTextBased() && c.permissionsFor(message.guild.id)
      );

      let locked = 0;
      let failed = 0;

      for (const [_id, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: false,
          });
          locked++;
        } catch (error) {
          failed++;
          console.error(`Failed to lock ${channel.name}:`, error);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🔒 Server Lockdown')
        .setDescription(reason)
        .addFields(
          {
            name: 'Channels Locked',
            value: `${locked}`,
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
        .setTimestamp();

      confirmMsg.edit({ content: null, embeds: [embed] });

      // Announce in all channels
      for (const [_id, channel] of channels) {
        if (locked > 0) {
          try {
            await channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xff0000)
                  .setTitle('🔒 Channel Locked')
                  .setDescription(
                    `This channel has been locked.\n**Reason:** ${reason}`
                  )
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
        confirmMsg.edit('❌ Lockdown timed out.');
      }
    });
  },
};
