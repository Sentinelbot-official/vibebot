const { EmbedBuilder } = require('discord.js');
const musicManager = require('../../utils/musicManager');

// Store active votes per guild
const activeVotes = new Map();

module.exports = {
  name: 'voteskip',
  aliases: ['vs', 'vskip'],
  description: 'Vote to skip the current song (requires 50% of listeners)',
  category: 'music',
  cooldown: 3,
  guildOnly: true,
  async execute(message) {
    const queue = musicManager.getQueue(message.guild.id);

    if (!message.member.voice.channel) {
      return message.reply('❌ You need to be in a voice channel to vote!');
    }

    if (!queue.voiceChannel) {
      return message.reply('❌ No music is playing!');
    }

    if (message.member.voice.channel.id !== queue.voiceChannel.id) {
      return message.reply('❌ You need to be in the same voice channel as me!');
    }

    if (!queue.playing || queue.songs.length === 0) {
      return message.reply('❌ Nothing is playing right now!');
    }

    // Get number of listeners (excluding bots)
    const listeners = queue.voiceChannel.members.filter(m => !m.user.bot);
    const listenerCount = listeners.size;

    // If only 1-2 people, skip immediately
    if (listenerCount <= 2) {
      musicManager.skip(message.guild.id);
      return message.reply(
        '⏭️ **Skipped!** Not enough people to vote, so we\'ll skip it! 💜'
      );
    }

    // Get or create vote data
    let voteData = activeVotes.get(message.guild.id);
    const currentSong = queue.songs[0];

    // Check if this is a new song (reset votes)
    if (!voteData || voteData.songUrl !== currentSong.url) {
      voteData = {
        songUrl: currentSong.url,
        votes: new Set(),
        messageId: null,
      };
      activeVotes.set(message.guild.id, voteData);
    }

    // Check if user already voted
    if (voteData.votes.has(message.author.id)) {
      const votesNeeded = Math.ceil(listenerCount * 0.5);
      const currentVotes = voteData.votes.size;
      
      return message.reply(
        `❌ **You already voted to skip!**\n` +
        `**Votes:** ${currentVotes}/${votesNeeded} (${Math.round((currentVotes / votesNeeded) * 100)}%)`
      );
    }

    // Add vote
    voteData.votes.add(message.author.id);
    const votesNeeded = Math.ceil(listenerCount * 0.5);
    const currentVotes = voteData.votes.size;
    const percentage = Math.round((currentVotes / votesNeeded) * 100);

    // Check if enough votes
    if (currentVotes >= votesNeeded) {
      activeVotes.delete(message.guild.id);
      musicManager.skip(message.guild.id);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('⏭️ Vote Skip Passed!')
        .setDescription(
          `**The community has spoken!** ✨\n\n` +
          `**${currentSong.title}** has been skipped!\n` +
          `**Final Vote:** ${currentVotes}/${votesNeeded} (${percentage}%)`
        )
        .setFooter({ 
          text: '💜 Built live with the community on Twitch!',
          iconURL: 'https://static-cdn.jtvnw.net/jtv_user_pictures/8a6381c7-d0c0-4576-b179-38bd5ce1d6af-profile_image-70x70.png'
        })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // Not enough votes yet
    const progressBar = generateProgressBar(currentVotes, votesNeeded);
    
    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('🗳️ Vote Skip in Progress')
      .setDescription(
        `**${message.author.username}** voted to skip!\n\n` +
        `**Current Song:** ${currentSong.title}\n` +
        `**Votes:** ${currentVotes}/${votesNeeded} (${percentage}%)\n\n` +
        `${progressBar}\n\n` +
        `*Use \`//voteskip\` to add your vote!*`
      )
      .setFooter({ 
        text: `${votesNeeded - currentVotes} more vote${votesNeeded - currentVotes !== 1 ? 's' : ''} needed • Built live on Twitch!`,
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

/**
 * Generate a progress bar for votes
 * @param {number} current - Current votes
 * @param {number} needed - Votes needed
 * @returns {string} Progress bar
 */
function generateProgressBar(current, needed) {
  const percentage = current / needed;
  const filled = Math.round(percentage * 10);
  const empty = 10 - filled;
  
  const filledBar = '🟩'.repeat(filled);
  const emptyBar = '⬜'.repeat(empty);
  
  return `${filledBar}${emptyBar} ${Math.round(percentage * 100)}%`;
}
