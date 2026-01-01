const { EmbedBuilder } = require('discord.js');
const branding = require('../../utils/branding');

module.exports = {
  name: 'search',
  aliases: ['find', 'lookup'],
  description: 'Advanced message and user search',
  usage: '<query> [filters]',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🔍 Advanced Search')
        .setDescription(
          '**Search messages, users, and content!**\n\n' +
            '**Usage:**\n' +
            '`//search <query> [filters]`\n\n' +
            '**Filters:**\n' +
            '• `from:@user` - Messages from user\n' +
            '• `in:#channel` - Messages in channel\n' +
            '• `has:link` - Messages with links\n' +
            '• `has:image` - Messages with images\n' +
            '• `before:date` - Before date\n' +
            '• `after:date` - After date\n\n' +
            '**Examples:**\n' +
            '`//search hello from:@user`\n' +
            '`//search announcement in:#general`\n' +
            '`//search has:image after:2026-01-01`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const query = args.join(' ').toLowerCase();
    const loadingMsg = await message.reply('🔍 Searching...');

    try {
      // Parse filters
      const filters = parseFilters(query);
      const searchTerm = query.replace(/\b(from|in|has|before|after):\S+/g, '').trim();

      // Search messages
      const messages = await message.channel.messages.fetch({ limit: 100 });
      let results = Array.from(messages.values());

      // Apply filters
      if (filters.from) {
        results = results.filter(m => m.author.id === filters.from);
      }

      if (filters.has === 'link') {
        results = results.filter(m => /https?:\/\//.test(m.content));
      }

      if (filters.has === 'image') {
        results = results.filter(m => m.attachments.size > 0);
      }

      if (searchTerm) {
        results = results.filter(m =>
          m.content.toLowerCase().includes(searchTerm)
        );
      }

      results = results.slice(0, 10);

      if (results.length === 0) {
        return loadingMsg.edit('📭 No results found!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🔍 Search Results (${results.length})`)
        .setDescription(
          results
            .map(
              (m, i) =>
                `**${i + 1}. ${m.author.tag}**\n` +
                `${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}\n` +
                `[Jump to message](${m.url})`
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await loadingMsg.edit({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Search error:', error);
      await loadingMsg.edit('❌ Search failed!');
    }
  },
};

function parseFilters(query) {
  const filters = {};

  const fromMatch = query.match(/from:<@!?(\d+)>/);
  if (fromMatch) filters.from = fromMatch[1];

  const hasMatch = query.match(/has:(\w+)/);
  if (hasMatch) filters.has = hasMatch[1];

  return filters;
}
