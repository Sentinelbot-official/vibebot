const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'removelevelrole',
  aliases: ['rlr'],
  description: 'Remove a level role reward',
  usage: '<level>',
  category: 'leveling',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return message.reply(
        '❌ You need Manage Roles permission to use this command!'
      );
    }

    const level = parseInt(args[0]);
    if (isNaN(level) || level < 1) {
      return message.reply('❌ Please provide a valid level number!');
    }

    // Get guild settings
    const settings = db.get('guild_settings', message.guild.id) || {};
    if (!settings.levelRoles || !settings.levelRoles[level]) {
      return message.reply(
        `❌ There is no role reward set for Level ${level}!`
      );
    }

    delete settings.levelRoles[level];
    db.set('guild_settings', message.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Level Role Removed!')
      .setDescription(`Removed the role reward for **Level ${level}**.`)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
