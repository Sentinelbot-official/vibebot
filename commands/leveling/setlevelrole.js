const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'setlevelrole',
  aliases: ['slr'],
  description: 'Set a role reward for reaching a level',
  usage: '<level> <@role>',
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

    const role = message.mentions.roles.first();
    if (!role) {
      return message.reply('❌ Please mention a role!');
    }

    // Get guild settings
    const settings = db.get('guild_settings', message.guild.id) || {};
    if (!settings.levelRoles) {
      settings.levelRoles = {};
    }

    settings.levelRoles[level] = role.id;
    db.set('guild_settings', message.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Level Role Set!')
      .setDescription(
        `Users who reach **Level ${level}** will receive the ${role} role!`
      )
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
