const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'notes',
  description: 'Personal note-taking system',
  usage: '<add/list/view/delete/clear> [note]',
  aliases: ['note', 'notebook'],
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'list') {
      const notes = db.get('notes', message.author.id) || { notes: [] };

      if (!notes.notes.length) {
        return message.reply(
          '📝 You have no notes!\nUse `notes add <text>` to create one.'
        );
      }

      const noteList = notes.notes
        .map((note, index) => {
          const preview = note.content.substring(0, 50);
          const date = new Date(note.createdAt).toLocaleDateString();
          return `**${index + 1}.** ${preview}${note.content.length > 50 ? '...' : ''} *(${date})*`;
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setAuthor({
          name: `${message.author.username}'s Notes`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(noteList)
        .setFooter({ text: `Total: ${notes.notes.length} notes` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'add') {
      const content = args.slice(1).join(' ');

      if (!content) {
        return message.reply(
          '❌ Please provide note content!\nUsage: `notes add <text>`\nExample: `notes add Remember to buy milk`'
        );
      }

      if (content.length > 1000) {
        return message.reply('❌ Note is too long! Max 1000 characters.');
      }

      const notes = db.get('notes', message.author.id) || { notes: [] };

      notes.notes.push({
        id: Date.now(),
        content: content,
        createdAt: Date.now(),
      });

      db.set('notes', message.author.id, notes);

      return message.reply(
        `✅ Note added! You now have ${notes.notes.length} note(s).\nUse \`notes list\` to view all notes.`
      );
    }

    if (action === 'view') {
      const index = parseInt(args[1]) - 1;

      if (isNaN(index)) {
        return message.reply(
          '❌ Please provide a note number!\nUsage: `notes view <number>`\nExample: `notes view 1`'
        );
      }

      const notes = db.get('notes', message.author.id) || { notes: [] };

      if (index < 0 || index >= notes.notes.length) {
        return message.reply(
          `❌ Invalid note number! You have ${notes.notes.length} note(s).`
        );
      }

      const note = notes.notes[index];

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setAuthor({
          name: `${message.author.username}'s Note #${index + 1}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(note.content)
        .setFooter({
          text: `Created: ${new Date(note.createdAt).toLocaleString()}`,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'delete') {
      const index = parseInt(args[1]) - 1;

      if (isNaN(index)) {
        return message.reply(
          '❌ Please provide a note number!\nUsage: `notes delete <number>`\nExample: `notes delete 1`'
        );
      }

      const notes = db.get('notes', message.author.id) || { notes: [] };

      if (index < 0 || index >= notes.notes.length) {
        return message.reply(
          `❌ Invalid note number! You have ${notes.notes.length} note(s).`
        );
      }

      notes.notes.splice(index, 1);
      db.set('notes', message.author.id, notes);

      return message.reply(
        `✅ Note deleted! You now have ${notes.notes.length} note(s).`
      );
    }

    if (action === 'clear') {
      const notes = db.get('notes', message.author.id) || { notes: [] };

      if (!notes.notes.length) {
        return message.reply('❌ You have no notes to clear!');
      }

      const count = notes.notes.length;
      db.set('notes', message.author.id, { notes: [] });

      return message.reply(`✅ Cleared ${count} note(s)!`);
    }

    if (action === 'search') {
      const query = args.slice(1).join(' ').toLowerCase();

      if (!query) {
        return message.reply(
          '❌ Please provide search text!\nUsage: `notes search <text>`'
        );
      }

      const notes = db.get('notes', message.author.id) || { notes: [] };
      const results = notes.notes.filter(note =>
        note.content.toLowerCase().includes(query)
      );

      if (!results.length) {
        return message.reply(`❌ No notes found matching "${query}"`);
      }

      const noteList = results
        .map((note, index) => {
          const noteIndex = notes.notes.indexOf(note) + 1;
          const preview = note.content.substring(0, 50);
          const date = new Date(note.createdAt).toLocaleDateString();
          return `**${noteIndex}.** ${preview}${note.content.length > 50 ? '...' : ''} *(${date})*`;
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle(`🔍 Search Results for "${query}"`)
        .setDescription(noteList)
        .setFooter({ text: `Found ${results.length} note(s)` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `notes <add/list/view/delete/clear/search>`\n\n' +
        '**Examples:**\n' +
        '`notes add Remember to buy milk` - Add a note\n' +
        '`notes list` - List all notes\n' +
        '`notes view 1` - View note #1\n' +
        '`notes delete 1` - Delete note #1\n' +
        '`notes search milk` - Search notes\n' +
        '`notes clear` - Delete all notes'
    );
  },
};
