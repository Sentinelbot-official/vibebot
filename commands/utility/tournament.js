const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'tournament',
  aliases: ['tourney', 'compete'],
  description: 'Create and manage tournaments',
  usage: '<create/join/start/bracket/list>',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['create', 'join', 'start', 'bracket', 'list'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🏆 Tournament System')
        .setDescription(
          '**Organize competitive tournaments!**\n\n' +
            '**Commands:**\n' +
            '`//tournament create <name> <max_players>` - Create tournament\n' +
            '`//tournament list` - View active tournaments\n' +
            '`//tournament join <id>` - Join tournament\n' +
            '`//tournament start <id>` - Start tournament\n' +
            '`//tournament bracket <id>` - View bracket\n\n' +
            '**Features:**\n' +
            '• Single/Double elimination\n' +
            '• Automatic bracket generation\n' +
            '• Winner tracking\n' +
            '• Prize distribution'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'create') {
      const [, ...nameParts] = args;
      const maxPlayers = parseInt(nameParts.pop());
      const name = nameParts.join(' ');

      if (!name || isNaN(maxPlayers) || maxPlayers < 4 || maxPlayers > 64) {
        return message.reply(
          '❌ Usage: `//tournament create <name> <max_players>`\n' +
            'Max players: 4-64 (must be power of 2: 4, 8, 16, 32, 64)'
        );
      }

      if (![4, 8, 16, 32, 64].includes(maxPlayers)) {
        return message.reply('❌ Max players must be 4, 8, 16, 32, or 64!');
      }

      const tourneyId = Date.now().toString();
      const tournaments = db.get('tournaments', message.guild.id) || {};

      tournaments[tourneyId] = {
        id: tourneyId,
        name,
        host: message.author.id,
        maxPlayers,
        players: [],
        bracket: [],
        status: 'registration',
        createdAt: Date.now(),
      };

      db.set('tournaments', message.guild.id, tournaments);

      return message.reply(
        `✅ Tournament **${name}** created!\n` +
          `Max Players: ${maxPlayers}\n` +
          `Tournament ID: \`${tourneyId}\`\n\n` +
          `Players can join with: \`//tournament join ${tourneyId}\``
      );
    }

    if (action === 'list') {
      const tournaments = db.get('tournaments', message.guild.id) || {};
      const active = Object.values(tournaments).filter(t => t.status !== 'completed');

      if (active.length === 0) {
        return message.reply('📭 No active tournaments!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🏆 Active Tournaments')
        .setDescription(
          active
            .map(
              t =>
                `**${t.name}**\n` +
                `👥 Players: ${t.players.length}/${t.maxPlayers}\n` +
                `📊 Status: ${t.status}\n` +
                `🆔 ID: \`${t.id}\``
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'join') {
      const tourneyId = args[1];

      if (!tourneyId) {
        return message.reply('❌ Please provide a tournament ID!');
      }

      const tournaments = db.get('tournaments', message.guild.id) || {};
      const tourney = tournaments[tourneyId];

      if (!tourney) {
        return message.reply('❌ Tournament not found!');
      }

      if (tourney.status !== 'registration') {
        return message.reply('❌ Tournament registration is closed!');
      }

      if (tourney.players.includes(message.author.id)) {
        return message.reply('❌ You are already registered!');
      }

      if (tourney.players.length >= tourney.maxPlayers) {
        return message.reply('❌ Tournament is full!');
      }

      tourney.players.push(message.author.id);
      db.set('tournaments', message.guild.id, tournaments);

      return message.reply(
        `✅ Registered for **${tourney.name}**!\n` +
          `Players: ${tourney.players.length}/${tourney.maxPlayers}`
      );
    }

    if (action === 'start') {
      const tourneyId = args[1];

      if (!tourneyId) {
        return message.reply('❌ Please provide a tournament ID!');
      }

      const tournaments = db.get('tournaments', message.guild.id) || {};
      const tourney = tournaments[tourneyId];

      if (!tourney) {
        return message.reply('❌ Tournament not found!');
      }

      if (tourney.host !== message.author.id) {
        return message.reply('❌ Only the host can start the tournament!');
      }

      if (tourney.status !== 'registration') {
        return message.reply('❌ Tournament already started!');
      }

      if (tourney.players.length < 4) {
        return message.reply('❌ Need at least 4 players to start!');
      }

      // Generate bracket
      const shuffled = [...tourney.players].sort(() => Math.random() - 0.5);
      const bracket = [];

      for (let i = 0; i < shuffled.length; i += 2) {
        bracket.push({
          player1: shuffled[i],
          player2: shuffled[i + 1] || null,
          winner: null,
          round: 1,
        });
      }

      tourney.bracket = bracket;
      tourney.status = 'in_progress';
      db.set('tournaments', message.guild.id, tournaments);

      return message.reply(
        `✅ Tournament **${tourney.name}** started!\n` +
          `Use \`//tournament bracket ${tourneyId}\` to view matchups!`
      );
    }

    if (action === 'bracket') {
      const tourneyId = args[1];

      if (!tourneyId) {
        return message.reply('❌ Please provide a tournament ID!');
      }

      const tournaments = db.get('tournaments', message.guild.id) || {};
      const tourney = tournaments[tourneyId];

      if (!tourney) {
        return message.reply('❌ Tournament not found!');
      }

      if (tourney.status === 'registration') {
        return message.reply('❌ Tournament hasn\'t started yet!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🏆 ${tourney.name} - Bracket`)
        .setDescription(
          tourney.bracket
            .map(
              (match, i) =>
                `**Match ${i + 1} (Round ${match.round})**\n` +
                `<@${match.player1}> vs ${match.player2 ? `<@${match.player2}>` : 'BYE'}\n` +
                `Winner: ${match.winner ? `<@${match.winner}>` : 'TBD'}`
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
