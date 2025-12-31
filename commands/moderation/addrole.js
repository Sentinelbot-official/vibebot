const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'addrole',
  aliases: ['giverole'],
  description: 'Add a role to a member',
  usage: '<@member> <@role>',
  category: 'moderation',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply('❌ You need Manage Roles permission!');
    }

    if (
      !message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      return message.reply('❌ I need Manage Roles permission!');
    }

    const member = message.mentions.members.first();
    const role = message.mentions.roles.first();

    if (!member || !role) {
      return message.reply('❌ Usage: `addrole <@member> <@role>`');
    }

    // Check if member already has role
    if (member.roles.cache.has(role.id)) {
      return message.reply(`❌ ${member} already has the ${role} role!`);
    }

    // Check role hierarchy
    if (message.member.roles.highest.position <= role.position) {
      return message.reply('❌ You cannot manage this role!');
    }

    if (message.guild.members.me.roles.highest.position <= role.position) {
      return message.reply('❌ I cannot manage this role!');
    }

    try {
      await member.roles.add(role);
      message.reply(`✅ Added ${role} to ${member}!`);
    } catch (error) {
      console.error('Error adding role:', error);
      message.reply('❌ Failed to add role!');
    }
  },
};
