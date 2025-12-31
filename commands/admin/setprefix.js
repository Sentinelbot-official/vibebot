const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'setprefix',
  description: 'Set custom prefix for this server',
  usage: '<prefix|reset>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply('❌ You need Administrator permission!');
    }

    const defaultPrefix = process.env.PREFIX || '//';

    if (!args[0]) {
      const settings = db.get('guild_settings', message.guild.id) || {};
      const currentPrefix = settings.prefix || defaultPrefix;
      return message.reply(
        `Current prefix: \`${currentPrefix}\`\nUse \`${currentPrefix}setprefix <prefix>\` to change or \`${currentPrefix}setprefix reset\` to reset to default.`
      );
    }

    const newPrefix = args[0];

    // Check if user wants to reset to default
    if (newPrefix.toLowerCase() === 'reset') {
      const settings = db.get('guild_settings', message.guild.id) || {};
      delete settings.prefix;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Prefix Reset!')
        .setDescription(`Prefix reset to default: \`${defaultPrefix}\``)
        .addFields({
          name: 'Example',
          value: `\`${defaultPrefix}help\``,
          inline: true,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (newPrefix.length > 5) {
      return message.reply('❌ Prefix must be 5 characters or less!');
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    settings.prefix = newPrefix;
    db.set('guild_settings', message.guild.id, settings);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Prefix Updated!')
      .setDescription(`New prefix: \`${newPrefix}\``)
      .addFields({
        name: 'Example',
        value: `\`${newPrefix}help\``,
        inline: true,
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
