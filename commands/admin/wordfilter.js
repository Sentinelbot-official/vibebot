const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'wordfilter',
  description: 'Manage the word filter (blacklist)',
  usage: '<add/remove/list> [word/phrase]',
  aliases: ['filter', 'blacklist'],
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionFlagsBits.ManageMessages)
    ) {
      return message.reply(
        '❌ You need the Manage Messages permission to use this command!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'remove', 'list', 'clear'].includes(action)) {
      return message.reply(
        '❌ Usage: `wordfilter <add/remove/list/clear> [word]`\nExample: `wordfilter add badword`'
      );
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    const wordFilter = settings.wordFilter || [];

    if (action === 'list') {
      if (wordFilter.length === 0) {
        return message.reply('❌ No words in the filter for this server.');
      }

      // Send in DM for privacy
      try {
        const filterList = wordFilter
          .map((word, index) => `${index + 1}. \`${word}\``)
          .join('\n');

        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('🚫 Word Filter')
          .setDescription(filterList)
          .setFooter({ text: `${wordFilter.length} word(s) in filter` })
          .setTimestamp();

        await message.author.send({ embeds: [embed] });
        return message.reply('✅ Sent you the word filter list in DMs!');
      } catch {
        return message.reply(
          "❌ I couldn't send you a DM! Please enable DMs from server members."
        );
      }
    }

    if (action === 'clear') {
      if (wordFilter.length === 0) {
        return message.reply('❌ The word filter is already empty!');
      }

      const count = wordFilter.length;
      settings.wordFilter = [];
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(`✅ Cleared ${count} word(s) from the filter!`);
    }

    if (action === 'add') {
      if (!args[1]) {
        return message.reply(
          '❌ Usage: `wordfilter add <word/phrase>`\nExample: `wordfilter add badword`'
        );
      }

      const word = args.slice(1).join(' ').toLowerCase();

      if (word.length > 100) {
        return message.reply(
          '❌ Word/phrase is too long! Maximum 100 characters.'
        );
      }

      if (wordFilter.includes(word)) {
        return message.reply('❌ This word is already in the filter!');
      }

      if (wordFilter.length >= 200) {
        return message.reply('❌ Maximum of 200 words in the filter!');
      }

      wordFilter.push(word);
      settings.wordFilter = wordFilter;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Word Added to Filter')
        .setDescription(`Added: \`${word}\``)
        .setFooter({ text: `Total: ${wordFilter.length} word(s) in filter` })
        .setTimestamp();

      // Delete the command message for privacy
      await message.delete().catch(() => {});

      return message.channel.send({ embeds: [embed] }).then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 5000);
      });
    }

    if (action === 'remove') {
      if (!args[1]) {
        return message.reply(
          '❌ Usage: `wordfilter remove <word/phrase>`\nExample: `wordfilter remove badword`'
        );
      }

      const word = args.slice(1).join(' ').toLowerCase();
      const index = wordFilter.indexOf(word);

      if (index === -1) {
        return message.reply('❌ This word is not in the filter!');
      }

      wordFilter.splice(index, 1);
      settings.wordFilter = wordFilter;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Word Removed from Filter')
        .setDescription(`Removed: \`${word}\``)
        .setFooter({ text: `Total: ${wordFilter.length} word(s) in filter` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
