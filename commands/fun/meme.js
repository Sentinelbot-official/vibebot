const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'meme',
  description: 'Generate custom memes or get random trending memes from Reddit',
  usage: '[template] [top text] | [bottom text] OR use "list" to see templates',
  aliases: ['memegen', 'memes'],
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    // Show template list
    if (args[0] && args[0].toLowerCase() === 'list') {
      const templates = this.getTemplates();
      const templateList = Object.keys(templates).sort();
      
      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle('🎨 Available Meme Templates')
        .setDescription(
          `**Total Templates:** ${templateList.length}\n\n` +
          `Use \`//meme <template> <top text> | <bottom text>\` to create a meme!\n\u200b`
        )
        .addFields(
          {
            name: '🔥 Classic Memes',
            value: 'drake, distracted, twobuttons, changemymind, exitramp, expanding, pikachu, spiderman, batman, yoda',
            inline: false,
          },
          {
            name: '📈 Popular Formats',
            value: 'stonks, doge, disaster, woman, success, rollsafe, gru, uno, brain',
            inline: false,
          },
          {
            name: '😱 Reaction Memes',
            value: 'panik, trade, aliens, always, waiting, hide',
            inline: false,
          },
          {
            name: '🆕 Modern Memes',
            value: 'bernie, wojak, chad, pepe',
            inline: false,
          },
          {
            name: '💚 Wholesome',
            value: 'dog, cat, seal',
            inline: false,
          }
        )
        .setFooter({ text: 'Use //meme (no args) for random Reddit memes!' })
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    }

    if (!args.length) {
      // Get random meme from multiple subreddits
      const subreddits = ['memes', 'dankmemes', 'wholesomememes', 'me_irl'];
      const randomSub = subreddits[Math.floor(Math.random() * subreddits.length)];
      
      try {
        const response = await axios.get(
          `https://www.reddit.com/r/${randomSub}/hot.json?limit=100`,
          {
            headers: { 'User-Agent': 'DiscordBot/1.0' },
          }
        );

        const posts = response.data.data.children.filter(
          p => !p.data.over_18 && p.data.url.match(/\.(jpg|jpeg|png|gif)$/i)
        );

        if (!posts.length) {
          return message.reply('❌ No memes found! Try again.');
        }

        const randomPost = posts[Math.floor(Math.random() * posts.length)].data;

        const embed = new EmbedBuilder()
          .setColor(0xff6b6b)
          .setTitle(randomPost.title.length > 256 ? randomPost.title.substring(0, 253) + '...' : randomPost.title)
          .setImage(randomPost.url)
          .setURL(`https://reddit.com${randomPost.permalink}`)
          .addFields(
            { name: '⬆️ Upvotes', value: randomPost.ups.toLocaleString(), inline: true },
            { name: '💬 Comments', value: randomPost.num_comments.toLocaleString(), inline: true },
            { name: '📱 Subreddit', value: `r/${randomSub}`, inline: true }
          )
          .setFooter({ text: `Posted by u/${randomPost.author}` })
          .setTimestamp(new Date(randomPost.created_utc * 1000));

        return message.reply({ embeds: [embed] });
      } catch (error) {
        return message.reply('❌ Failed to fetch meme! Try again.');
      }
    }

    // Meme generation with imgflip API
    const apiUsername = process.env.IMGFLIP_USERNAME;
    const apiPassword = process.env.IMGFLIP_PASSWORD;

    if (!apiUsername || !apiPassword) {
      return message.reply(
        '❌ Meme generation not configured!\n\n' +
          '**Setup:**\n' +
          '1. Create account at [imgflip.com](https://imgflip.com)\n' +
          '2. Add `IMGFLIP_USERNAME` and `IMGFLIP_PASSWORD` to .env\n\n' +
          '**Or use:** `meme` (no args) for random memes from Reddit!'
      );
    }

    // Popular meme templates (expanded list)
    const templates = {
      // Classic memes
      drake: '181913649',
      distracted: '112126428',
      twobuttons: '87743020',
      changemymind: '129242436',
      exitramp: '124822590',
      expanding: '188390779',
      pikachu: '155067746',
      spiderman: '101470',
      batman: '438680',
      yoda: '14371066',
      
      // Popular formats
      stonks: '178591752',
      doge: '8072285',
      disaster: '180190441',
      woman: '247375501',
      success: '61532',
      disaster: '97984',
      rollsafe: '217743513',
      gru: '131940431',
      uno: '217743513',
      brain: '93895088',
      
      // Reaction memes
      panik: '224015000',
      trade: '131087935',
      aliens: '101470',
      always: '252600902',
      waiting: '61520',
      hide: '61585',
      
      // Modern memes
      bernie: '222403160',
      wojak: '252758727',
      chad: '309868304',
      pepe: '110163934',
      
      // Wholesome
      dog: '135256802',
      cat: '14230520',
      seal: '188390779',
    };

    const template = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    if (!templates[template]) {
      return message.reply(
        `❌ Invalid template: \`${template}\`\n\n` +
        `Use \`//meme list\` to see all available templates!\n\n` +
        `**Quick Examples:**\n` +
        `• \`//meme drake coding | sleeping\`\n` +
        `• \`//meme distracted my code | new bug | debugging\`\n` +
        `• \`//meme stonks when the bot works\``
      );
    }

    const [topText, bottomText] = text.split('|').map(t => t?.trim() || '');

    if (!topText) {
      return message.reply(
        '❌ Please provide text!\n**Usage:** `meme <template> <top text> | <bottom text>`'
      );
    }

    const generatingMsg = await message.reply('🎨 Generating meme...');

    try {
      const response = await axios.post(
        'https://api.imgflip.com/caption_image',
        new URLSearchParams({
          template_id: templates[template],
          username: apiUsername,
          password: apiPassword,
          text0: topText,
          text1: bottomText || '',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      if (!response.data.success) {
        return generatingMsg.edit(
          `❌ Failed to generate meme: ${response.data.error_message}`
        );
      }

      const memeEmbed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle('🎨 Your Custom Meme')
        .setImage(response.data.data.url)
        .setFooter({ 
          text: `Template: ${template} | Created by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp();

      return generatingMsg.edit({
        content: null,
        embeds: [memeEmbed],
      });
    } catch (error) {
      console.error('Meme generation error:', error.message);
      return generatingMsg.edit(
        '❌ Failed to generate meme!\n\n' +
        '**Possible issues:**\n' +
        '• Invalid API credentials\n' +
        '• Text too long\n' +
        '• API rate limit reached\n\n' +
        'Try using `//meme` (no args) for random Reddit memes instead!'
      );
    }
  },

  /**
   * Get all available templates
   * @returns {Object} Template mapping
   */
  getTemplates() {
    return {
      // Classic memes
      drake: '181913649',
      distracted: '112126428',
      twobuttons: '87743020',
      changemymind: '129242436',
      exitramp: '124822590',
      expanding: '188390779',
      pikachu: '155067746',
      spiderman: '101470',
      batman: '438680',
      yoda: '14371066',
      
      // Popular formats
      stonks: '178591752',
      doge: '8072285',
      disaster: '180190441',
      woman: '247375501',
      success: '61532',
      rollsafe: '217743513',
      gru: '131940431',
      uno: '217743513',
      brain: '93895088',
      
      // Reaction memes
      panik: '224015000',
      trade: '131087935',
      aliens: '101470',
      always: '252600902',
      waiting: '61520',
      hide: '61585',
      
      // Modern memes
      bernie: '222403160',
      wojak: '252758727',
      chad: '309868304',
      pepe: '110163934',
      
      // Wholesome
      dog: '135256802',
      cat: '14230520',
      seal: '188390779',
    };
  },
};
