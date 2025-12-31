const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    const settings = db.get('guild_settings', newMember.guild.id) || {};
    if (!settings.logChannelId) return;

    const logChannel = newMember.guild.channels.cache.get(settings.logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setAuthor({
        name: `${newMember.user.tag} (${newMember.id})`,
        iconURL: newMember.user.displayAvatarURL(),
      })
      .setTimestamp();

    // Nickname changed
    if (oldMember.nickname !== newMember.nickname) {
      embed.setTitle('✏️ Nickname Changed').addFields(
        {
          name: 'Before',
          value: oldMember.nickname || '*None*',
          inline: true,
        },
        { name: 'After', value: newMember.nickname || '*None*', inline: true }
      );

      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error('Error logging nickname change:', error);
      }
      return;
    }

    // Roles changed
    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;

    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

    if (addedRoles.size > 0) {
      embed
        .setTitle('➕ Roles Added')
        .setColor(0x00ff00)
        .addFields({
          name: 'Roles',
          value: addedRoles.map(r => r.toString()).join(', '),
          inline: false,
        });

      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error('Error logging role add:', error);
      }
    }

    if (removedRoles.size > 0) {
      const removeEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setAuthor({
          name: `${newMember.user.tag} (${newMember.id})`,
          iconURL: newMember.user.displayAvatarURL(),
        })
        .setTitle('➖ Roles Removed')
        .addFields({
          name: 'Roles',
          value: removedRoles.map(r => r.toString()).join(', '),
          inline: false,
        })
        .setTimestamp();

      try {
        await logChannel.send({ embeds: [removeEmbed] });
      } catch (error) {
        console.error('Error logging role remove:', error);
      }
    }

    // Timeout status changed
    if (
      oldMember.communicationDisabledUntil !==
      newMember.communicationDisabledUntil
    ) {
      if (newMember.communicationDisabledUntil) {
        embed
          .setTitle('⏰ Member Timed Out')
          .setColor(0xff0000)
          .addFields({
            name: 'Until',
            value: `<t:${Math.floor(newMember.communicationDisabledUntil.getTime() / 1000)}:F>`,
            inline: false,
          });
      } else {
        embed.setTitle('✅ Timeout Removed').setColor(0x00ff00);
      }

      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error('Error logging timeout change:', error);
      }
    }
  },
};
