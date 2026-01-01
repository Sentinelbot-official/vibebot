const { EmbedBuilder } = require('discord.js');
const backup = require('../../utils/backup');
const branding = require('../../utils/branding');
const ownerCheck = require('../../utils/ownerCheck');

module.exports = {
  name: 'backup',
  description: 'Manually trigger a database backup (Bot Owner Only)',
  usage: '',
  aliases: ['backupdb', 'savedb'],
  category: 'owner',
  cooldown: 60,
  ownerOnly: true,
  async execute(message, _args) {
    // Owner check
    if (!ownerCheck.isOwner(message.author.id)) {
      return message.reply('❌ This command is restricted to bot owners only!');
    }

    const msg = await message.reply('⏳ Creating database backup...');

    try {
      const result = await backup.createBackup();

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(branding.colors.success)
          .setTitle('✅ Backup Created')
          .setDescription('Database backup created successfully!')
          .addFields(
            {
              name: 'Backup File',
              value: result.filename,
              inline: true,
            },
            {
              name: 'Size',
              value: result.size,
              inline: true,
            },
            {
              name: 'Location',
              value: '`./data/backups/`',
              inline: true,
            }
          )
          .setTimestamp();

        msg.edit({ content: null, embeds: [embed] });
      } else {
        msg.edit('❌ Failed to create backup. Check console for errors.');
      }
    } catch (error) {
      console.error('Backup error:', error);
      msg.edit('❌ An error occurred while creating the backup.');
    }
  },
};
