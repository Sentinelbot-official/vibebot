const { EmbedBuilder } = require('discord.js');

// Tenor GIF API URLs for different actions
const gifActions = {
  hug: [
    'https://media.tenor.com/LGN3kHCYB1MAAAAC/hug.gif',
    'https://media.tenor.com/UWkCWTr3mZ0AAAAC/anime-hug.gif',
    'https://media.tenor.com/9FCZvDGGMo4AAAAC/hug-love.gif',
  ],
  pat: [
    'https://media.tenor.com/OBN9KL-PsWMAAAAC/head-pat.gif',
    'https://media.tenor.com/VIOHLKo-HXMAAAAC/anime-pat.gif',
    'https://media.tenor.com/zRM-xwTJbYAAAAAC/pat-head.gif',
  ],
  kiss: [
    'https://media.tenor.com/wbv7KvsgqpQAAAAC/kiss-anime.gif',
    'https://media.tenor.com/L7JR9BUyP8YAAAAC/anime-kiss.gif',
    'https://media.tenor.com/9FCZvDGGMo4AAAAC/kiss-love.gif',
  ],
  slap: [
    'https://media.tenor.com/x8v1oNUOmg4AAAAC/rickroll-roll.gif',
    'https://media.tenor.com/88JReoMlLdUAAAAC/anime-slap.gif',
    'https://media.tenor.com/ZCOLntRdqfYAAAAC/slap.gif',
  ],
  punch: [
    'https://media.tenor.com/1kNrkmGDdy4AAAAC/anime-punch.gif',
    'https://media.tenor.com/L_TQt3NbqVgAAAAC/punch.gif',
    'https://media.tenor.com/88JReoMlLdUAAAAC/anime-punch.gif',
  ],
  poke: [
    'https://media.tenor.com/VIOHLKo-HXMAAAAC/anime-poke.gif',
    'https://media.tenor.com/zRM-xwTJbYAAAAAC/poke.gif',
    'https://media.tenor.com/OBN9KL-PsWMAAAAC/poke.gif',
  ],
  wave: [
    'https://media.tenor.com/88JReoMlLdUAAAAC/anime-wave.gif',
    'https://media.tenor.com/VIOHLKo-HXMAAAAC/wave.gif',
    'https://media.tenor.com/zRM-xwTJbYAAAAAC/wave-hello.gif',
  ],
  cry: [
    'https://media.tenor.com/88JReoMlLdUAAAAC/anime-cry.gif',
    'https://media.tenor.com/VIOHLKo-HXMAAAAC/cry-sad.gif',
    'https://media.tenor.com/zRM-xwTJbYAAAAAC/crying.gif',
  ],
  dance: [
    'https://media.tenor.com/88JReoMlLdUAAAAC/anime-dance.gif',
    'https://media.tenor.com/VIOHLKo-HXMAAAAC/dance.gif',
    'https://media.tenor.com/zRM-xwTJbYAAAAAC/dancing.gif',
  ],
  blush: [
    'https://media.tenor.com/88JReoMlLdUAAAAC/anime-blush.gif',
    'https://media.tenor.com/VIOHLKo-HXMAAAAC/blush.gif',
    'https://media.tenor.com/zRM-xwTJbYAAAAAC/blushing.gif',
  ],
};

const actionMessages = {
  hug: (author, target) => `${author} hugs ${target}! 🤗`,
  pat: (author, target) => `${author} pats ${target} on the head! 😊`,
  kiss: (author, target) => `${author} kisses ${target}! 😘`,
  slap: (author, target) => `${author} slaps ${target}! 👋`,
  punch: (author, target) => `${author} punches ${target}! 👊`,
  poke: (author, target) => `${author} pokes ${target}! 👉`,
  wave: (author, target) => `${author} waves at ${target}! 👋`,
  cry: author => `${author} is crying! 😢`,
  dance: author => `${author} is dancing! 💃`,
  blush: author => `${author} is blushing! 😳`,
};

module.exports = {
  name: 'roleplay',
  description: 'Roleplay actions with GIFs',
  usage: '<action> [@user]',
  aliases: [
    'rp',
    'hug',
    'pat',
    'kiss',
    'slap',
    'punch',
    'poke',
    'wave',
    'cry',
    'dance',
    'blush',
  ],
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    // Get action from command name or first argument
    let action = message.content
      .split(' ')[0]
      .toLowerCase()
      .replace(message.client.config.prefix, '');

    if (action === 'roleplay' || action === 'rp') {
      action = args[0]?.toLowerCase();
    }

    if (!action || !gifActions[action]) {
      const actions = Object.keys(gifActions).join(', ');
      return message.reply(
        `❌ Invalid action!\nAvailable actions: ${actions}\n\nUsage: \`<action> [@user]\`\nExample: \`hug @user\``
      );
    }

    // Get target user
    const target = message.mentions.users.first();

    // Some actions don't require a target
    const noTargetActions = ['cry', 'dance', 'blush'];

    if (!target && !noTargetActions.includes(action)) {
      return message.reply(
        `❌ Please mention someone!\nUsage: \`${action} @user\``
      );
    }

    if (target && target.id === message.author.id) {
      return message.reply(`❌ You can't ${action} yourself!`);
    }

    // Get random GIF for this action
    const gifs = gifActions[action];
    const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

    // Create message
    const messageText = noTargetActions.includes(action)
      ? actionMessages[action](message.author)
      : actionMessages[action](message.author, target);

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setDescription(messageText)
      .setImage(randomGif)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
