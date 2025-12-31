const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'regexfilter',
  description: 'Manage regex-based filters for advanced pattern matching',
  usage: '<add/remove/list> [pattern] [name]',
  aliases: ['regex'],
  category: 'admin',
  cooldown: 5,
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(
        '❌ You need the Administrator permission to use this command!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'remove', 'list', 'test'].includes(action)) {
      return message.reply(
        '❌ Usage: `regexfilter <add/remove/list/test> [pattern] [name]`\nExample: `regexfilter add (discord\\.gg|discordapp\\.com\\/invite) InviteLinks`'
      );
    }

    const settings = db.get('guild_settings', message.guild.id) || {};
    const regexFilters = settings.regexFilters || [];

    if (action === 'list') {
      if (regexFilters.length === 0) {
        return message.reply('❌ No regex filters configured for this server.');
      }

      const filterList = regexFilters
        .map(
          (filter, index) =>
            `**${index + 1}. ${filter.name}**\nPattern: \`${filter.pattern}\`\nFlags: \`${filter.flags || 'none'}\``
        )
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🔍 Regex Filters')
        .setDescription(filterList)
        .setFooter({
          text: `${regexFilters.length} regex filter(s) configured`,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'test') {
      if (args.length < 3) {
        return message.reply(
          '❌ Usage: `regexfilter test <pattern> <test string>`\nExample: `regexfilter test discord\\.gg Check discord.gg/test`'
        );
      }

      const pattern = args[1];
      const testString = args.slice(2).join(' ');

      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = testString.match(regex);

        const embed = new EmbedBuilder()
          .setColor(matches ? 0xff0000 : 0x00ff00)
          .setTitle('🔍 Regex Test')
          .addFields(
            { name: 'Pattern', value: `\`${pattern}\``, inline: false },
            { name: 'Test String', value: testString, inline: false },
            {
              name: 'Result',
              value: matches
                ? `❌ Matched: ${matches.join(', ')}`
                : '✅ No match',
              inline: false,
            }
          )
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (error) {
        return message.reply(`❌ Invalid regex pattern: ${error.message}`);
      }
    }

    if (action === 'add') {
      if (args.length < 3) {
        return message.reply(
          '❌ Usage: `regexfilter add <pattern> <name> [flags]`\nExample: `regexfilter add (discord\\.gg|discordapp\\.com\\/invite) InviteLinks gi`'
        );
      }

      const pattern = args[1];
      const name = args[2];
      const flags = args[3] || 'gi';

      // Test if regex is valid
      try {
        new RegExp(pattern, flags);
      } catch (error) {
        return message.reply(`❌ Invalid regex pattern: ${error.message}`);
      }

      if (regexFilters.some(f => f.name === name)) {
        return message.reply(
          '❌ A regex filter with this name already exists!'
        );
      }

      if (regexFilters.length >= 20) {
        return message.reply('❌ Maximum of 20 regex filters per server!');
      }

      regexFilters.push({
        pattern,
        name,
        flags,
        createdBy: message.author.id,
        createdAt: Date.now(),
      });

      settings.regexFilters = regexFilters;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Regex Filter Added')
        .addFields(
          { name: '📝 Name', value: name, inline: true },
          { name: '🔍 Pattern', value: `\`${pattern}\``, inline: false },
          { name: '🚩 Flags', value: `\`${flags}\``, inline: true }
        )
        .setFooter({ text: `Total: ${regexFilters.length} regex filter(s)` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'remove') {
      if (!args[1]) {
        return message.reply(
          '❌ Usage: `regexfilter remove <name>`\nExample: `regexfilter remove InviteLinks`'
        );
      }

      const name = args[1];
      const index = regexFilters.findIndex(f => f.name === name);

      if (index === -1) {
        return message.reply('❌ No regex filter found with that name!');
      }

      const removed = regexFilters.splice(index, 1)[0];
      settings.regexFilters = regexFilters;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Regex Filter Removed')
        .addFields(
          { name: '📝 Name', value: removed.name, inline: true },
          { name: '🔍 Pattern', value: `\`${removed.pattern}\``, inline: false }
        )
        .setFooter({ text: `Total: ${regexFilters.length} regex filter(s)` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
