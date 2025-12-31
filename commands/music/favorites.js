const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const musicManager = require('../../utils/musicManager');

module.exports = {
  name: 'favorites',
  aliases: ['favs', 'fav', 'liked'],
  description: 'Manage your favorite songs',
  usage: '[add/remove/list] [song name]',
  category: 'music',
  cooldown: 5,
  async execute(message, args) {
    const userId = message.author.id;
    const subcommand = args[0]?.toLowerCase();

    // Get user's favorites
    let favorites = db.get('music_favorites', userId) || [];

    if (!subcommand || subcommand === 'list') {
      // List favorites
      if (favorites.length === 0) {
        return message.reply(
          '💜 **Your Favorites List is Empty!**\n\n' +
          'Add songs you love with `//favorites add <song name>`\n' +
          'Then quickly play them anytime with `//play favorite <number>`!'
        );
      }

      const embed = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setAuthor({
          name: `${message.author.username}'s Favorite Vibes 💜`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setDescription(
          '**Your most-played tracks!**\n' +
          `Use \`//play favorite <number>\` to play any of these!\n\u200b`
        )
        .addFields(
          favorites.slice(0, 25).map((song, index) => ({
            name: `${index + 1}. ${song.title}`,
            value: `🎵 [Listen](${song.url}) • Added <t:${Math.floor(song.addedAt / 1000)}:R>`,
            inline: false,
          }))
        )
        .setFooter({ 
          text: `${favorites.length} favorites • Built live on Twitch!`,
          iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-70x70.png'
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (subcommand === 'add') {
      // Check if currently playing
      const queue = musicManager.getQueue(message.guild?.id);
      
      if (args.length === 1 && queue.playing && queue.songs.length > 0) {
        // Add currently playing song
        const currentSong = queue.songs[0];
        
        // Check if already in favorites
        if (favorites.some(f => f.url === currentSong.url)) {
          return message.reply('💜 **Already in your favorites!** This song is already saved.');
        }

        favorites.push({
          title: currentSong.title,
          url: currentSong.url,
          thumbnail: currentSong.thumbnail,
          addedAt: Date.now(),
        });

        db.set('music_favorites', userId, favorites);

        return message.reply(
          `💜 **Added to Favorites!**\n` +
          `**${currentSong.title}** is now in your favorites list!\n\n` +
          `Play it anytime with \`//play favorite ${favorites.length}\``
        );
      }

      return message.reply(
        '❌ **No song specified!**\n\n' +
        '**To add the current song:** `//favorites add` (while music is playing)\n' +
        '**To add any song:** Play it first, then use `//favorites add`'
      );
    }

    if (subcommand === 'remove' || subcommand === 'delete') {
      const index = parseInt(args[1]) - 1;

      if (isNaN(index) || index < 0 || index >= favorites.length) {
        return message.reply(
          `❌ **Invalid favorite number!**\n\n` +
          `You have ${favorites.length} favorites. Use \`//favorites list\` to see them.`
        );
      }

      const removed = favorites.splice(index, 1)[0];
      db.set('music_favorites', userId, favorites);

      return message.reply(
        `🗑️ **Removed from Favorites**\n` +
        `**${removed.title}** has been removed from your favorites.`
      );
    }

    if (subcommand === 'clear') {
      if (favorites.length === 0) {
        return message.reply('💜 Your favorites list is already empty!');
      }

      db.delete('music_favorites', userId);

      return message.reply(
        `🗑️ **Favorites Cleared!**\n` +
        `Removed ${favorites.length} song${favorites.length !== 1 ? 's' : ''} from your favorites.`
      );
    }

    return message.reply(
      '❌ **Invalid subcommand!**\n\n' +
      '**Available commands:**\n' +
      '• `//favorites` or `//favorites list` - View your favorites\n' +
      '• `//favorites add` - Add current song to favorites\n' +
      '• `//favorites remove <number>` - Remove a favorite\n' +
      '• `//favorites clear` - Clear all favorites'
    );
  },
};
