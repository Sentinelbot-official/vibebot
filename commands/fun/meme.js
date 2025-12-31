const { AttachmentBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  name: 'meme',
  description: 'Generate memes or get random memes',
  usage: '[template] [top text] | [bottom text]',
  aliases: ['memegen'],
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      // Get random meme from Reddit
      try {
        const response = await axios.get(
          'https://www.reddit.com/r/memes/hot.json?limit=50',
          {
            headers: { 'User-Agent': 'DiscordBot/1.0' },
          }
        );

        const posts = response.data.data.children.filter(
          p => !p.data.over_18 && p.data.url.match(/\.(jpg|jpeg|png|gif)$/i)
        );

        if (!posts.length) {
          return message.reply('❌ No memes found!');
        }

        const randomPost = posts[Math.floor(Math.random() * posts.length)].data;

        return message.reply({
          content: `**${randomPost.title}**\n⬆️ ${randomPost.ups} | 💬 ${randomPost.num_comments}\n${randomPost.url}`,
        });
      } catch (error) {
        return message.reply('❌ Failed to fetch meme!');
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

    // Popular meme templates
    const templates = {
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
    };

    const template = args[0].toLowerCase();
    const text = args.slice(1).join(' ');

    if (!templates[template]) {
      const list = Object.keys(templates).join(', ');
      return message.reply(
        `❌ Invalid template!\n\n**Available:** ${list}\n\n**Usage:** \`meme <template> <top text> | <bottom text>\`\n**Example:** \`meme drake coding | sleeping\``
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

      return generatingMsg.edit({
        content: `🎨 **Your Meme:**`,
        files: [response.data.data.url],
      });
    } catch (error) {
      console.error('Meme generation error:', error.message);
      return generatingMsg.edit('❌ Failed to generate meme!');
    }
  },
};
