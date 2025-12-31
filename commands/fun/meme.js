const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  name: 'meme',
  aliases: ['reddit'],
  description: 'Get a random meme from Reddit',
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'me_irl'];
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];

    try {
      const data = await new Promise((resolve, reject) => {
        https
          .get(`https://www.reddit.com/r/${subreddit}/random.json`, res => {
            let body = '';
            res.on('data', chunk => (body += chunk));
            res.on('end', () => {
              try {
                resolve(JSON.parse(body));
              } catch (e) {
                reject(e);
              }
            });
          })
          .on('error', reject);
      });

      if (
        !data ||
        !data[0] ||
        !data[0].data ||
        !data[0].data.children ||
        !data[0].data.children[0]
      ) {
        return message.reply('❌ Failed to fetch meme! Try again.');
      }

      const post = data[0].data.children[0].data;

      // Skip if NSFW
      if (post.over_18 && !message.channel.nsfw) {
        return message.reply(
          '❌ That meme was NSFW! Try again or use this command in an NSFW channel.'
        );
      }

      const embed = new EmbedBuilder()
        .setColor(0xff4500)
        .setTitle(post.title.substring(0, 256))
        .setURL(`https://reddit.com${post.permalink}`)
        .setImage(post.url)
        .setFooter({
          text: `👍 ${post.ups} | r/${subreddit} | Posted by u/${post.author}`,
        })
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching meme:', error);
      message.reply(
        '❌ Failed to fetch meme! Reddit might be down or rate-limiting us.'
      );
    }
  },
};
