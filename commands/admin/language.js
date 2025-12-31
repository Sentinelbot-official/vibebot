const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const i18n = require('../../utils/i18n');

module.exports = {
  name: 'language',
  description: 'Set server language',
  usage: '[language]',
  aliases: ['lang', 'locale'],
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply('❌ You need Manage Server permission!');
    }

    if (!args.length) {
      const current = i18n.getLanguage(message.guild.id);
      const available = i18n.getAvailableLanguages().join(', ');
      return message.reply(
        `Current language: **${current}**\nAvailable: ${available}\n\nUsage: \`language <code>\``
      );
    }

    const lang = args[0].toLowerCase();
    const success = i18n.setLanguage(message.guild.id, lang);

    if (!success) {
      return message.reply(
        `❌ Invalid language! Available: ${i18n.getAvailableLanguages().join(', ')}`
      );
    }

    return message.reply(`✅ Language set to **${lang}**!`);
  },
};
