const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'roleinfo',
  aliases: ['rinfo', 'role'],
  description: 'Get detailed information about a role',
  usage: '<@role>',
  category: 'utility',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    const role =
      message.mentions.roles.first() ||
      message.guild.roles.cache.get(args[0]) ||
      message.guild.roles.cache.find(
        r => r.name.toLowerCase() === args.join(' ').toLowerCase()
      );

    if (!role) {
      return message.reply(
        '❌ Please mention a role, provide a role ID, or role name!'
      );
    }

    // Calculate role age
    const ageInDays = Math.floor(
      (Date.now() - role.createdTimestamp) / (1000 * 60 * 60 * 24)
    );
    const ageInYears = (ageInDays / 365).toFixed(1);

    // Get role hierarchy
    const rolesAbove = message.guild.roles.cache.filter(
      r => r.position > role.position
    ).size;
    const rolesBelow = message.guild.roles.cache.filter(
      r => r.position < role.position
    ).size;
    const totalRoles = message.guild.roles.cache.size;

    // Key permissions
    const keyPermissions = [];
    if (role.permissions.has(PermissionFlagsBits.Administrator))
      keyPermissions.push('👑 Administrator');
    if (role.permissions.has(PermissionFlagsBits.ManageGuild))
      keyPermissions.push('⚙️ Manage Server');
    if (role.permissions.has(PermissionFlagsBits.ManageRoles))
      keyPermissions.push('🎭 Manage Roles');
    if (role.permissions.has(PermissionFlagsBits.ManageChannels))
      keyPermissions.push('📺 Manage Channels');
    if (role.permissions.has(PermissionFlagsBits.KickMembers))
      keyPermissions.push('👢 Kick Members');
    if (role.permissions.has(PermissionFlagsBits.BanMembers))
      keyPermissions.push('🔨 Ban Members');
    if (role.permissions.has(PermissionFlagsBits.ModerateMembers))
      keyPermissions.push('🛡️ Timeout Members');
    if (role.permissions.has(PermissionFlagsBits.ManageMessages))
      keyPermissions.push('🗑️ Manage Messages');
    if (role.permissions.has(PermissionFlagsBits.MentionEveryone))
      keyPermissions.push('📢 Mention Everyone');
    if (role.permissions.has(PermissionFlagsBits.ManageWebhooks))
      keyPermissions.push('🪝 Manage Webhooks');
    if (role.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))
      keyPermissions.push('😀 Manage Emojis');

    const embed = new EmbedBuilder()
      .setColor(role.color || 0x99aab5)
      .setTitle(`🎭 ${role.name}`)
      .setDescription(
        role.managed
          ? `*This role is managed by an integration or bot*\n\u200b`
          : null
      )
      .addFields(
        {
          name: '🆔 Role ID',
          value: `\`${role.id}\``,
          inline: true,
        },
        {
          name: '🎨 Color',
          value:
            role.hexColor !== '#000000'
              ? `${role.hexColor}\n🟦`
              : 'Default (No Color)',
          inline: true,
        },
        {
          name: '📊 Position',
          value: `${role.position}/${totalRoles - 1}\n${rolesAbove} above • ${rolesBelow} below`,
          inline: true,
        },
        {
          name: '👥 Members',
          value: `${role.members.size.toLocaleString()} (${((role.members.size / message.guild.memberCount) * 100).toFixed(1)}%)`,
          inline: true,
        },
        {
          name: '📅 Created',
          value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>\n(${ageInYears} years old)`,
          inline: true,
        },
        {
          name: '🔗 Mention',
          value: `${role}`,
          inline: true,
        }
      );

    // Role properties
    const properties = [];
    if (role.hoist) properties.push('📌 Hoisted (Displayed Separately)');
    if (role.mentionable) properties.push('📢 Mentionable');
    if (role.managed) properties.push('🤖 Managed by Integration');
    if (role.permissions.has(PermissionFlagsBits.Administrator))
      properties.push('👑 Has Administrator');
    if (role.icon) properties.push('🖼️ Has Custom Icon');
    if (role.unicodeEmoji) properties.push(`${role.unicodeEmoji} Has Emoji`);

    if (properties.length > 0) {
      embed.addFields({
        name: '⚙️ Properties',
        value: properties.join('\n'),
        inline: false,
      });
    }

    // Key permissions
    if (keyPermissions.length > 0) {
      embed.addFields({
        name: '🔑 Key Permissions',
        value: keyPermissions.join('\n'),
        inline: false,
      });
    } else {
      embed.addFields({
        name: '🔑 Key Permissions',
        value: '❌ No key permissions',
        inline: false,
      });
    }

    // All permissions count
    const allPerms = role.permissions.toArray();
    embed.addFields({
      name: '📋 Total Permissions',
      value: `${allPerms.length} permission${allPerms.length !== 1 ? 's' : ''} granted`,
      inline: true,
    });

    // Role hierarchy visualization
    const rolesNearby = message.guild.roles.cache
      .sort((a, b) => b.position - a.position)
      .filter(
        r =>
          Math.abs(r.position - role.position) <= 2 && r.id !== message.guild.id
      )
      .map(r => {
        if (r.id === role.id) return `**➜ ${r.name}** (This Role)`;
        return r.position > role.position ? `↑ ${r.name}` : `↓ ${r.name}`;
      })
      .slice(0, 5)
      .join('\n');

    if (rolesNearby) {
      embed.addFields({
        name: '📊 Role Hierarchy',
        value: rolesNearby || 'No nearby roles',
        inline: false,
      });
    }

    embed.setFooter(branding.footers.default);
    embed.setTimestamp();

    // Create buttons for member list and permissions
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('members')
        .setLabel(`View Members (${role.members.size})`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('👥')
        .setDisabled(role.members.size === 0),
      new ButtonBuilder()
        .setCustomId('permissions')
        .setLabel(`All Permissions (${allPerms.length})`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔐')
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    // Button collector
    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async i => {
      if (i.customId === 'members') {
        // Show member list
        const memberList = role.members
          .sort((a, b) => a.user.username.localeCompare(b.user.username))
          .map((m, index) => `${index + 1}. ${m.user.username}`)
          .slice(0, 50)
          .join('\n');

        const memberEmbed = new EmbedBuilder()
          .setColor(role.color || 0x99aab5)
          .setTitle(`👥 Members with ${role.name}`)
          .setDescription(
            memberList +
              (role.members.size > 50
                ? `\n\n*...and ${role.members.size - 50} more members*`
                : '')
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        await i.reply({ embeds: [memberEmbed], flags: MessageFlags.Ephemeral });
      } else if (i.customId === 'permissions') {
        // Show all permissions
        const permissionList = allPerms
          .map(p => {
            // Format permission names nicely
            const formatted = p.replace(/([A-Z])/g, ' $1').trim();
            return `• ${formatted}`;
          })
          .join('\n');

        const permEmbed = new EmbedBuilder()
          .setColor(role.color || 0x99aab5)
          .setTitle(`🔐 All Permissions for ${role.name}`)
          .setDescription(permissionList.substring(0, 4000))
          .setFooter(branding.footers.default)
          .setTimestamp();

        await i.reply({ embeds: [permEmbed], flags: MessageFlags.Ephemeral });
      }
    });

    collector.on('end', () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('members')
          .setLabel(`View Members (${role.members.size})`)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('👥')
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('permissions')
          .setLabel(`All Permissions (${allPerms.length})`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔐')
          .setDisabled(true)
      );
      msg.edit({ components: [disabledRow] }).catch(() => {});
    });
  },
};
