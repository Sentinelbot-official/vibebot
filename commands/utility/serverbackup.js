const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'serverbackup',
  description: 'Create a backup of server settings (roles, channels, etc)',
  usage: '',
  aliases: ['backupserver', 'serversave'],
  category: 'utility',
  cooldown: 300, // 5 minutes
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const msg = await message.reply('⏳ Creating server backup...');

    try {
      const guild = message.guild;

      // Collect server data
      const backup = {
        name: guild.name,
        icon: guild.iconURL({ size: 1024 }),
        banner: guild.bannerURL({ size: 1024 }),
        description: guild.description,
        verificationLevel: guild.verificationLevel,
        defaultMessageNotifications: guild.defaultMessageNotifications,
        explicitContentFilter: guild.explicitContentFilter,
        afkTimeout: guild.afkTimeout,
        afkChannelId: guild.afkChannelId,
        systemChannelId: guild.systemChannelId,
        roles: [],
        channels: [],
        emojis: [],
        timestamp: new Date().toISOString(),
      };

      // Backup roles
      guild.roles.cache.forEach(role => {
        if (role.name !== '@everyone') {
          backup.roles.push({
            name: role.name,
            color: role.hexColor,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions.bitfield.toString(),
            mentionable: role.mentionable,
          });
        }
      });

      // Backup channels
      guild.channels.cache.forEach(channel => {
        backup.channels.push({
          name: channel.name,
          type: channel.type,
          position: channel.position,
          parentId: channel.parentId,
          topic: channel.topic || null,
          nsfw: channel.nsfw || false,
          rateLimitPerUser: channel.rateLimitPerUser || 0,
        });
      });

      // Backup emojis
      guild.emojis.cache.forEach(emoji => {
        backup.emojis.push({
          name: emoji.name,
          url: emoji.url,
          animated: emoji.animated,
        });
      });

      // Create JSON file
      const fs = require('fs');
      const path = require('path');
      const backupDir = path.join(__dirname, '..', '..', 'backups', 'servers');

      // Ensure directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const filename = `${guild.id}-${Date.now()}.json`;
      const filepath = path.join(backupDir, filename);

      fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Server Backup Created')
        .setDescription('Server settings have been backed up successfully!')
        .addFields(
          {
            name: 'Backup File',
            value: filename,
            inline: true,
          },
          {
            name: 'Roles',
            value: `${backup.roles.length}`,
            inline: true,
          },
          {
            name: 'Channels',
            value: `${backup.channels.length}`,
            inline: true,
          },
          {
            name: 'Emojis',
            value: `${backup.emojis.length}`,
            inline: true,
          },
          {
            name: 'Location',
            value: '`./backups/servers/`',
            inline: false,
          }
        )
        .setFooter({
          text: 'Note: Messages and member data are not backed up',
        })
        .setTimestamp();

      msg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Server backup error:', error);
      msg.edit('❌ Failed to create server backup. Check console for errors.');
    }
  },
};
