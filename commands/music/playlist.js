const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'playlist',
  aliases: ['pl', 'playlists'],
  description: 'Manage personal playlists',
  usage: '<create/add/remove/list/play> [name] [song]',
  category: 'music',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (
      !action ||
      !['create', 'add', 'remove', 'list', 'play', 'delete'].includes(action)
    ) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎵 Personal Playlists')
        .setDescription(
          '**Create and manage your own music playlists!**\n\n' +
            '**Commands:**\n' +
            '`//playlist create <name>` - Create a playlist\n' +
            '`//playlist add <name> <song>` - Add song to playlist\n' +
            '`//playlist remove <name> <index>` - Remove song\n' +
            '`//playlist list [name]` - View playlists/songs\n' +
            '`//playlist play <name>` - Play entire playlist\n' +
            '`//playlist delete <name>` - Delete playlist'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const playlists = db.get('user_playlists', message.author.id) || {};

    if (action === 'create') {
      const name = args.slice(1).join(' ');

      if (!name) {
        return message.reply('❌ Please provide a playlist name!');
      }

      if (playlists[name]) {
        return message.reply('❌ You already have a playlist with that name!');
      }

      playlists[name] = {
        name,
        songs: [],
        createdAt: Date.now(),
      };

      db.set('user_playlists', message.author.id, playlists);

      return message.reply(`✅ Created playlist **${name}**!`);
    }

    if (action === 'add') {
      const [, playlistName, ...songParts] = args;
      const song = songParts.join(' ');

      if (!playlistName || !song) {
        return message.reply('❌ Usage: `//playlist add <playlist> <song>`');
      }

      if (!playlists[playlistName]) {
        return message.reply('❌ Playlist not found!');
      }

      playlists[playlistName].songs.push({
        title: song,
        addedAt: Date.now(),
      });

      db.set('user_playlists', message.author.id, playlists);

      return message.reply(
        `✅ Added **${song}** to playlist **${playlistName}**!`
      );
    }

    if (action === 'remove') {
      const [, playlistName, indexStr] = args;
      const index = parseInt(indexStr) - 1;

      if (!playlistName || isNaN(index)) {
        return message.reply(
          '❌ Usage: `//playlist remove <playlist> <song number>`'
        );
      }

      if (!playlists[playlistName]) {
        return message.reply('❌ Playlist not found!');
      }

      if (index < 0 || index >= playlists[playlistName].songs.length) {
        return message.reply('❌ Invalid song number!');
      }

      const removed = playlists[playlistName].songs.splice(index, 1)[0];
      db.set('user_playlists', message.author.id, playlists);

      return message.reply(
        `✅ Removed **${removed.title}** from playlist **${playlistName}**!`
      );
    }

    if (action === 'list') {
      const playlistName = args.slice(1).join(' ');

      if (!playlistName) {
        // List all playlists
        const playlistList = Object.values(playlists);

        if (playlistList.length === 0) {
          return message.reply("📭 You don't have any playlists yet!");
        }

        const embed = new EmbedBuilder()
          .setColor(branding.colors.primary)
          .setTitle(`🎵 ${message.author.username}'s Playlists`)
          .setDescription(
            playlistList
              .map(
                pl =>
                  `**${pl.name}** - ${pl.songs.length} song${pl.songs.length !== 1 ? 's' : ''}`
              )
              .join('\n')
          )
          .setFooter(branding.footers.default)
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }

      // List songs in playlist
      if (!playlists[playlistName]) {
        return message.reply('❌ Playlist not found!');
      }

      const playlist = playlists[playlistName];

      if (playlist.songs.length === 0) {
        return message.reply(`📭 Playlist **${playlistName}** is empty!`);
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`🎵 ${playlistName}`)
        .setDescription(
          playlist.songs
            .map((song, i) => `**${i + 1}.** ${song.title}`)
            .join('\n')
        )
        .setFooter({
          text: `${playlist.songs.length} song${playlist.songs.length !== 1 ? 's' : ''} total`,
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'play') {
      const playlistName = args.slice(1).join(' ');

      if (!playlistName) {
        return message.reply('❌ Please provide a playlist name!');
      }

      if (!playlists[playlistName]) {
        return message.reply('❌ Playlist not found!');
      }

      const playlist = playlists[playlistName];

      if (playlist.songs.length === 0) {
        return message.reply('❌ Playlist is empty!');
      }

      // Queue all songs
      const playCommand = require('./play');
      let addedCount = 0;

      for (const song of playlist.songs) {
        try {
          await playCommand.execute(message, song.title.split(' '));
          addedCount++;
        } catch (error) {
          console.error(`Failed to add song: ${song.title}`, error);
        }
      }

      return message.reply(
        `✅ Added ${addedCount}/${playlist.songs.length} songs from **${playlistName}** to queue!`
      );
    }

    if (action === 'delete') {
      const playlistName = args.slice(1).join(' ');

      if (!playlistName) {
        return message.reply('❌ Please provide a playlist name!');
      }

      if (!playlists[playlistName]) {
        return message.reply('❌ Playlist not found!');
      }

      delete playlists[playlistName];
      db.set('user_playlists', message.author.id, playlists);

      return message.reply(`✅ Deleted playlist **${playlistName}**!`);
    }
  },
};
