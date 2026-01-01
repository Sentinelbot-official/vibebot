const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'notes',
  aliases: ['note', 'notebook'],
  description: 'Personal note-taking system',
  usage: '<add/list/view/delete/search>',
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'list', 'view', 'delete', 'search'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📝 Personal Notes')
        .setDescription(
          '**Your private note-taking system!**\n\n' +
            '**Commands:**\n' +
            '`//notes add <title> | <content>` - Create note\n' +
            '`//notes list` - View all notes\n' +
            '`//notes view <id>` - View note\n' +
            '`//notes delete <id>` - Delete note\n' +
            '`//notes search <query>` - Search notes\n\n' +
            '**Features:**\n' +
            '• Private & secure\n' +
            '• Full-text search\n' +
            '• Unlimited notes\n' +
            '• Rich formatting'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'add') {
      const data = args.slice(1).join(' ').split('|').map(s => s.trim());

      if (data.length < 2) {
        return message.reply(
          '❌ Usage: `//notes add <title> | <content>`\n' +
            'Example: `//notes add Meeting Notes | Discussed new features`'
        );
      }

      const [title, content] = data;
      const noteId = Date.now().toString();
      const notes = db.get('notes', message.author.id) || [];

      notes.push({
        id: noteId,
        title,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      db.set('notes', message.author.id, notes);

      return message.reply(`✅ Note **${title}** created! ID: \`${noteId}\``);
    }

    if (action === 'list') {
      const notes = db.get('notes', message.author.id) || [];

      if (notes.length === 0) {
        return message.reply('📭 You have no notes!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📝 Your Notes')
        .setDescription(
          notes
            .slice(0, 10)
            .map(
              (n, i) =>
                `**${i + 1}. ${n.title}**\n` +
                `${n.content.substring(0, 50)}${n.content.length > 50 ? '...' : ''}\n` +
                `🆔 \`${n.id}\` | 📅 <t:${Math.floor(n.createdAt / 1000)}:R>`
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'view') {
      const noteId = args[1];

      if (!noteId) {
        return message.reply('❌ Please provide a note ID!');
      }

      const notes = db.get('notes', message.author.id) || [];
      const note = notes.find(n => n.id === noteId);

      if (!note) {
        return message.reply('❌ Note not found!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`📝 ${note.title}`)
        .setDescription(note.content)
        .addFields(
          {
            name: '📅 Created',
            value: `<t:${Math.floor(note.createdAt / 1000)}:F>`,
            inline: true,
          },
          {
            name: '🔄 Updated',
            value: `<t:${Math.floor(note.updatedAt / 1000)}:R>`,
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'delete') {
      const noteId = args[1];

      if (!noteId) {
        return message.reply('❌ Please provide a note ID!');
      }

      const notes = db.get('notes', message.author.id) || [];
      const index = notes.findIndex(n => n.id === noteId);

      if (index === -1) {
        return message.reply('❌ Note not found!');
      }

      const deleted = notes.splice(index, 1)[0];
      db.set('notes', message.author.id, notes);

      return message.reply(`✅ Deleted note: **${deleted.title}**`);
    }

    if (action === 'search') {
      const query = args.slice(1).join(' ').toLowerCase();

      if (!query) {
        return message.reply('❌ Please provide a search query!');
      }

      const notes = db.get('notes', message.author.id) || [];
      const results = notes.filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.content.toLowerCase().includes(query)
      );

      if (results.length === 0) {
        return message.reply('📭 No notes found matching your query!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🔍 Search Results: "${query}"`)
        .setDescription(
          results
            .slice(0, 10)
            .map(
              (n, i) =>
                `**${i + 1}. ${n.title}**\n` +
                `${n.content.substring(0, 50)}...\n` +
                `🆔 \`${n.id}\``
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
