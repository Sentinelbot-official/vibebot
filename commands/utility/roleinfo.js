const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'roleinfo',
  aliases: ['rinfo', 'role'],
  description: 'Get information about a role',
  usage: '<@role>',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  execute(message, args) {
    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

    if (!role) {
      return message.reply('❌ Please mention a role or provide a role ID!');
    }

    const permissions =
      role.permissions
        .toArray()
        .map(p => `\`${p}\``)
        .join(', ') || 'None';

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x0099ff)
      .setTitle(`Role Information: ${role.name}`)
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        {
          name: 'Mentionable',
          value: role.mentionable ? 'Yes' : 'No',
          inline: true,
        },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        {
          name: 'Managed',
          value: role.managed ? 'Yes (Bot/Integration)' : 'No',
          inline: true,
        },
        {
          name: 'Created',
          value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
          inline: true,
        },
        { name: 'Mention', value: `${role}`, inline: true },
        {
          name: 'Permissions',
          value:
            permissions.length > 1024 ? 'Too many to display' : permissions,
          inline: false,
        }
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
