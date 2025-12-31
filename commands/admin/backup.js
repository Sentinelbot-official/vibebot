const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const backup = require('../../utils/backup');

module.exports = {
  name: 'backup',
  description: 'Manually trigger a database backup',
  usage: '',
  aliases: ['backupdb', 'savedb'],
  category: 'admin',
  cooldown: 60,
  guildOnly: true,
  async execute(message, _args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.reply('❌ You need Administrator permission!');
    }

    const msg = await message.reply('⏳ Creating database backup...');

    try {
      const result = await backup.createBackup();

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
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
