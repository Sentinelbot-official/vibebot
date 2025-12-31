const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'autorole',
  description: 'Set a role to be automatically given to new members',
  usage: '<add/remove/list> [@role]',
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply(
        '❌ You need the Manage Roles permission to use this command!'
      );
    }

    if (
      !message.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      return message.reply(
        '❌ I need the Manage Roles permission to use auto-roles!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'remove', 'list'].includes(action)) {
      return message.reply(
        '❌ Usage: `autorole <add/remove/list> [@role]`\nExample: `autorole add @Member`'
      );
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    const autoRoles = settings.autoRoles || [];

    if (action === 'list') {
      if (autoRoles.length === 0) {
        return message.reply('❌ No auto-roles configured for this server.');
      }

      const roleList = autoRoles
        .map(roleId => {
          const role = message.guild.roles.cache.get(roleId);
          return role ? `<@&${roleId}>` : `~~Deleted Role (${roleId})~~`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('⚙️ Auto-Roles')
        .setDescription(
          `Roles automatically given to new members:\n\n${roleList}`
        )
        .setFooter({ text: `${autoRoles.length} auto-role(s) configured` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply(
        '❌ Please mention a role!\nExample: `autorole add @Member`'
      );
    }

    // Check role hierarchy
    if (role.position >= message.guild.members.me.roles.highest.position) {
      return message.reply(
        '❌ I cannot manage this role because it is higher than or equal to my highest role!'
      );
    }

    if (role.managed) {
      return message.reply(
        '❌ This role is managed by an integration and cannot be used as an auto-role!'
      );
    }

    if (action === 'add') {
      if (autoRoles.includes(role.id)) {
        return message.reply(
          '❌ This role is already configured as an auto-role!'
        );
      }

      autoRoles.push(role.id);
      settings.autoRoles = autoRoles;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Auto-Role Added')
        .setDescription(
          `New members will now automatically receive the ${role} role!`
        )
        .addFields({
          name: '📋 Total Auto-Roles',
          value: autoRoles.length.toString(),
          inline: true,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'remove') {
      if (!autoRoles.includes(role.id)) {
        return message.reply('❌ This role is not configured as an auto-role!');
      }

      const index = autoRoles.indexOf(role.id);
      autoRoles.splice(index, 1);
      settings.autoRoles = autoRoles;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Auto-Role Removed')
        .setDescription(`New members will no longer receive the ${role} role.`)
        .addFields({
          name: '📋 Total Auto-Roles',
          value: autoRoles.length.toString(),
          inline: true,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
