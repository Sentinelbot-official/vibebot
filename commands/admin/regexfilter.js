const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

/**
 * Check if a regex pattern is safe (no catastrophic backtracking)
 * @param {string} pattern - Regex pattern to check
 * @returns {boolean} True if safe
 */
function isSafeRegex(pattern) {
  // Check for dangerous patterns that can cause ReDoS
  const dangerousPatterns = [
    /(\w+\+)+/, // Nested quantifiers
    /(\w*)+/, // Nested star quantifiers
    /(\w+)*\+/, // Mixed quantifiers
    /(\w+\*)+/, // Multiple star quantifiers
    /(\(.*\)\+)+/, // Nested group quantifiers
    /(\[.*\]\+)+/, // Nested bracket quantifiers
    /(a+)+/, // Classic ReDoS pattern
    /(\d+)+/, // Numeric ReDoS
  ];

  for (const dangerous of dangerousPatterns) {
    if (dangerous.test(pattern)) {
      return false;
    }
  }

  // Check pattern length
  if (pattern.length > 200) {
    return false;
  }

  // Check for excessive nesting
  const openParens = (pattern.match(/\(/g) || []).length;
  if (openParens > 10) {
    return false;
  }

  return true;
}

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
        .setColor(branding.colors.info)
        .setTitle('🔍 Regex Filters')
        .setDescription(filterList)
        .setFooter(branding.footers.default)
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
        .setColor(branding.colors.error)
        .setTitle('❌ Regex Filter Removed')
        .addFields(
          { name: '📝 Name', value: removed.name, inline: true },
          { name: '🔍 Pattern', value: `\`${removed.pattern}\``, inline: false }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'add') {
      if (!args[1] || !args[2]) {
        return message.reply(
          '❌ Usage: `regexfilter add <pattern> <name>`\nExample: `regexfilter add (discord\\.gg|discordapp\\.com\\/invite) InviteLinks`'
        );
      }

      const pattern = args[1];
      const name = args.slice(2).join(' ');

      // Check if name already exists
      if (regexFilters.some(f => f.name === name)) {
        return message.reply('❌ A filter with that name already exists!');
      }

      // Validate regex pattern
      if (!isSafeRegex(pattern)) {
        return message.reply(
          '❌ That regex pattern is unsafe or too complex! Please use a simpler pattern to avoid performance issues.'
        );
      }

      // Test if the pattern is valid
      try {
        new RegExp(pattern, 'gi');
      } catch (error) {
        return message.reply(
          `❌ Invalid regex pattern: ${error.message}\nMake sure to escape special characters like \`.\` with \`\\.\``
        );
      }

      // Add filter
      regexFilters.push({
        name,
        pattern,
        flags: 'gi',
        addedBy: message.author.id,
        addedAt: Date.now(),
      });

      settings.regexFilters = regexFilters;
      db.set('guild_settings', message.guild.id, settings);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Regex Filter Added')
        .addFields(
          { name: '📝 Name', value: name, inline: true },
          { name: '🔍 Pattern', value: `\`${pattern}\``, inline: false },
          { name: '🚩 Flags', value: '`gi` (global, case-insensitive)', inline: true }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'test') {
      if (!args[1] || !args[2]) {
        return message.reply(
          '❌ Usage: `regexfilter test <pattern> <text>`\nExample: `regexfilter test discord\\.gg Check discord.gg/test`'
        );
      }

      const pattern = args[1];
      const testText = args.slice(2).join(' ');

      try {
        const regex = new RegExp(pattern, 'gi');
        const matches = testText.match(regex);

        const embed = new EmbedBuilder()
          .setColor(matches ? branding.colors.warning : branding.colors.success)
          .setTitle('🧪 Regex Test Results')
          .addFields(
            { name: '🔍 Pattern', value: `\`${pattern}\``, inline: false },
            { name: '📝 Test Text', value: testText, inline: false },
            {
              name: '✅ Matches',
              value: matches ? `Found ${matches.length} match(es): ${matches.join(', ')}` : 'No matches found',
              inline: false,
            }
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      } catch (error) {
        return message.reply(`❌ Invalid regex pattern: ${error.message}`);
      }
    }
  },
};
