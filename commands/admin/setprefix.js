const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setprefix',
  description: 'Set custom prefix for this server',
  usage: '<prefix>',
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.reply('❌ You need Administrator permission!');
    }

    if (!args[0]) {
      const settings = db.get('guild_settings', message.guild.id) || {};
      const currentPrefix = settings.prefix || process.env.PREFIX || '!';
      return message.reply(`Current prefix: \`${currentPrefix}\``);
    }

    const newPrefix = args[0];

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
