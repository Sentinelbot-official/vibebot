const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'rolemenu',
  description: 'Create an interactive role menu with buttons',
  usage:
    '<create> <title> | <description> | <role1:emoji1:label1> | <role2:emoji2:label2> ...',
  category: 'admin',
  cooldown: 10,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageRoles)
    ) {
      return message.reply(
        '❌ You need the Manage Roles permission to use this command!'
      );
    }

    if (
      !message.guild.members.me.permissions.has(
        PermissionFlagsBits.ManageRoles
      )
    ) {
      return message.reply(
        '❌ I need the Manage Roles permission to manage role menus!'
      );
    }

    if (!args.length) {
      return message.reply(
        '❌ Usage: `rolemenu create <title> | <description> | <@role1:emoji1:label1> | <@role2:emoji2:label2> ...`\n\nExample:\n`rolemenu create Color Roles | Choose your color! | @Red:🔴:Red | @Blue:🔵:Blue | @Green:🟢:Green`'
      );
    }

    const action = args[0].toLowerCase();

    if (action !== 'create') {
      return message.reply('❌ Currently only `create` action is supported!');
    }

    // Parse the role menu configuration
    const parts = args
      .slice(1)
      .join(' ')
      .split('|')
      .map(p => p.trim());

    if (parts.length < 3) {
      return message.reply(
        '❌ Invalid format! You need at least: title | description | one role\n\nExample:\n`rolemenu create Color Roles | Choose your color! | @Red:🔴:Red`'
      );
    }

    const title = parts[0];
    const description = parts[1];
    const roleParts = parts.slice(2);

    if (roleParts.length > 25) {
      return message.reply(
        '❌ You can only have up to 25 roles in a role menu (Discord button limit)!'
      );
    }

    // Parse role configurations
    const roleConfigs = [];
    for (const rolePart of roleParts) {
      const [roleStr, emoji, label] = rolePart.split(':').map(s => s.trim());

      // Extract role ID from mention
      const roleId = roleStr.match(/\d+/)?.[0];
      if (!roleId) {
        return message.reply(
          `❌ Invalid role format in: "${rolePart}"\nUse: @Role:emoji:label`
        );
      }

      const role = message.guild.roles.cache.get(roleId);
      if (!role) {
        return message.reply(`❌ Role not found: ${roleStr}`);
      }

      if (role.position >= message.guild.members.me.roles.highest.position) {
        return message.reply(
          `❌ I cannot manage the role ${role.name} because it is higher than or equal to my highest role!`
        );
      }

      if (role.managed) {
        return message.reply(
          `❌ The role ${role.name} is managed by an integration and cannot be used in role menus!`
        );
      }

      roleConfigs.push({
        roleId: role.id,
        emoji: emoji || '📌',
        label: label || role.name,
      });
    }

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: 'Click a button to toggle a role!' })
      .setTimestamp();

    // Create buttons (max 5 per row, max 5 rows)
    const rows = [];
    for (let i = 0; i < roleConfigs.length; i += 5) {
      const row = new ActionRowBuilder();
      const chunk = roleConfigs.slice(i, i + 5);

      for (const config of chunk) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`rolemenu_${config.roleId}`)
            .setLabel(config.label.substring(0, 80)) // Discord limit
            .setEmoji(config.emoji)
            .setStyle(ButtonStyle.Secondary)
        );
      }

      rows.push(row);
    }

    // Send the role menu
    const roleMenuMessage = await message.channel.send({
      embeds: [embed],
      components: rows,
    });

    // Store role menu configuration
    const roleMenus = db.get('role_menus', message.guild.id) || {};
    roleMenus[roleMenuMessage.id] = {
      channelId: message.channel.id,
      messageId: roleMenuMessage.id,
      roles: roleConfigs.map(c => c.roleId),
      createdBy: message.author.id,
      createdAt: Date.now(),
    };
    db.set('role_menus', message.guild.id, roleMenus);

    // Delete command message
    await message.delete().catch(() => {});

    return message.channel
      .send('✅ Role menu created successfully!')
      .then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 5000);
      });
  },
};

// Export handler for button interactions
module.exports.handleRoleMenuButton = async interaction => {
  if (!interaction.customId.startsWith('rolemenu_')) return;

  const roleId = interaction.customId.replace('rolemenu_', '');
  const role = interaction.guild.roles.cache.get(roleId);

  if (!role) {
    return interaction.reply({
      content: '❌ This role no longer exists!',
      ephemeral: true,
    });
  }

  const member = interaction.member;

  try {
    if (member.roles.cache.has(roleId)) {
      // Remove role
      await member.roles.remove(role);
      return interaction.reply({
        content: `✅ Removed the **${role.name}** role!`,
        ephemeral: true,
      });
    } else {
      // Add role
      await member.roles.add(role);
      return interaction.reply({
        content: `✅ Added the **${role.name}** role!`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error('Role menu error:', error);
    return interaction.reply({
      content: '❌ Failed to toggle role. Please contact an administrator.',
      ephemeral: true,
    });
  }
};
