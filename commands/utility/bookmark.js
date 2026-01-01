const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'bookmark',
  aliases: ['bm', 'bookmarks', 'save'],
  description: 'Bookmark messages and links',
  usage: '<add/list/view/delete>',
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'list', 'view', 'delete'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🔖 Bookmarks')
        .setDescription(
          '**Save important messages and links!**\n\n' +
            '**Commands:**\n' +
            '`//bookmark add <title> <url/message_link>` - Add bookmark\n' +
            '`//bookmark list` - View bookmarks\n' +
            '`//bookmark view <id>` - View bookmark\n' +
            '`//bookmark delete <id>` - Delete bookmark\n\n' +
            '**Features:**\n' +
            '• Save message links\n' +
            '• Save external URLs\n' +
            '• Organize with titles\n' +
            '• Quick access'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'add') {
      const [, title, ...urlParts] = args;
      const url = urlParts.join(' ');

      if (!title || !url) {
        return message.reply(
          '❌ Usage: `//bookmark add <title> <url>`\n' +
            'Example: `//bookmark add Important https://discord.com/channels/...`'
        );
      }

      const bookmarkId = Date.now().toString();
      const bookmarks = db.get('bookmarks', message.author.id) || [];

      bookmarks.push({
        id: bookmarkId,
        title,
        url,
        createdAt: Date.now(),
      });

      db.set('bookmarks', message.author.id, bookmarks);

      return message.reply(`✅ Bookmark **${title}** saved! ID: \`${bookmarkId}\``);
    }

    if (action === 'list') {
      const bookmarks = db.get('bookmarks', message.author.id) || [];

      if (bookmarks.length === 0) {
        return message.reply('📭 You have no bookmarks!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🔖 Your Bookmarks')
        .setDescription(
          bookmarks
            .slice(0, 15)
            .map(
              (b, i) =>
                `**${i + 1}. ${b.title}**\n` +
                `🔗 [Link](${b.url})\n` +
                `🆔 \`${b.id}\` | 📅 <t:${Math.floor(b.createdAt / 1000)}:R>`
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'view') {
      const bookmarkId = args[1];

      if (!bookmarkId) {
        return message.reply('❌ Please provide a bookmark ID!');
      }

      const bookmarks = db.get('bookmarks', message.author.id) || [];
      const bookmark = bookmarks.find(b => b.id === bookmarkId);

      if (!bookmark) {
        return message.reply('❌ Bookmark not found!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🔖 ${bookmark.title}`)
        .setDescription(`[Click here to view](${bookmark.url})`)
        .addFields({
          name: '📅 Saved',
          value: `<t:${Math.floor(bookmark.createdAt / 1000)}:F>`,
          inline: false,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'delete') {
      const bookmarkId = args[1];

      if (!bookmarkId) {
        return message.reply('❌ Please provide a bookmark ID!');
      }

      const bookmarks = db.get('bookmarks', message.author.id) || [];
      const index = bookmarks.findIndex(b => b.id === bookmarkId);

      if (index === -1) {
        return message.reply('❌ Bookmark not found!');
      }

      const deleted = bookmarks.splice(index, 1)[0];
      db.set('bookmarks', message.author.id, bookmarks);

      return message.reply(`✅ Deleted bookmark: **${deleted.title}**`);
    }
  },
};
