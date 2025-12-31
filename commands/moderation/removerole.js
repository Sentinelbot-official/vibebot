const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'removerole',
  aliases: ['takerole'],
  description: 'Remove a role from a member',
  usage: '<@member> <@role>',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return message.reply('❌ You need Manage Roles permission!');
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageRoles
      )
    ) {
      return message.reply('❌ I need Manage Roles permission!');
    }

    const member = message.mentions.members.first();
    const role = message.mentions.roles.first();

    if (!member || !role) {
      return message.reply('❌ Usage: `removerole <@member> <@role>`');
    }

    // Check if member has role
    if (!member.roles.cache.has(role.id)) {
      return message.reply(`❌ ${member} doesn't have the ${role} role!`);
    }

    // Check role hierarchy
    if (message.member.roles.highest.position <= role.position) {
      return message.reply('❌ You cannot manage this role!');
    }

    if (message.guild.members.me.roles.highest.position <= role.position) {
      return message.reply('❌ I cannot manage this role!');
    }

    try {
      await member.roles.remove(role);
      message.reply(`✅ Removed ${role} from ${member}!`);
    } catch (error) {
      console.error('Error removing role:', error);
      message.reply('❌ Failed to remove role!');
    }
  },
};
