const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'bts',
  aliases: ['behindthescenes', 'streammoments', 'memories'],
  description: 'Behind-the-scenes moments from building Vibe Bot live on stream!',
  category: 'fun',
  cooldown: 10,
  execute(message, args) {
    // Fun behind-the-scenes moments from development
    const moments = [
      {
        title: '🐛 The Great Bug Hunt',
        description:
          'Chat found a bug where the economy system gave NEGATIVE coins. ' +
          'We spent 45 minutes debugging... turns out it was a typo: `-=` instead of `+=`. ' +
          'Chat never let me forget it! 😅',
        emoji: '🐛',
      },
      {
        title: '☕ 3 AM Coding Session',
        description:
          'The AI integration took 3 hours longer than expected. ' +
          'At 3 AM, chat was still there, suggesting fixes and keeping me awake with memes. ' +
          'We finally got it working at 3:47 AM. The celebration in chat was EPIC! 🎉',
        emoji: '☕',
      },
      {
        title: '🎮 The Mini-Game Marathon',
        description:
          'Chat challenged me: "Can you code Wordle in 30 minutes?" ' +
          'It took 47 minutes, but we did it! Then they wanted Hangman, then Poker... ' +
          'Before we knew it, we had 15 mini-games! 😄',
        emoji: '🎮',
      },
      {
        title: '💰 The Economy Balance Debate',
        description:
          'Chat spent 20 minutes debating if daily rewards should be 100 or 500 coins. ' +
          'We ended up with 250 + bonuses. Democracy in action! 🗳️',
        emoji: '💰',
      },
      {
        title: '🤖 When AI Went Rogue',
        description:
          'Testing the AI chat feature, someone asked it to write a poem about the stream. ' +
          'It wrote a beautiful haiku about debugging and coffee. ' +
          'We kept it in the logs forever! 📝',
        emoji: '🤖',
      },
      {
        title: '🎨 The Color Picker Wars',
        description:
          'Choosing embed colors took longer than coding some commands! ' +
          'Chat was split between blue and purple. Purple won by 3 votes. ' +
          'The blue team still brings it up... 💜',
        emoji: '🎨',
      },
      {
        title: '🚀 The First "It Works!" Moment',
        description:
          'When the bot first came online and responded to !ping, ' +
          'chat went WILD with hype emotes. That feeling was incredible! ' +
          'That\'s when we knew we were building something special. 🎵',
        emoji: '🚀',
      },
      {
        title: '📊 The Command Counter',
        description:
          'We started with a goal of 50 commands. Chat kept suggesting more. ' +
          'And more. And MORE. Now we\'re at 220+! ' +
          'Chat\'s ambition knows no bounds! 📈',
        emoji: '📊',
      },
      {
        title: '🎭 The Name Debate',
        description:
          'Before "Vibe Bot", chat suggested: "StreamBot", "ChatBot", ' +
          '"CodeBuddy", "LiveBot"... Someone said "Vibe Bot" and chat spammed ' +
          'PogChamp for 2 minutes straight. The name was chosen! 🎵',
        emoji: '🎭',
      },
      {
        title: '💜 The Community Moment',
        description:
          'After 20+ hours of coding, someone in chat said: ' +
          '"This isn\'t just a bot anymore, it\'s OUR bot." ' +
          'That\'s when I realized we\'d built something truly special together. ' +
          'Thank you all! 🙏',
        emoji: '💜',
      },
    ];

    // Pick a random moment
    const moment = moments[Math.floor(Math.random() * moments.length)];

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`${moment.emoji} ${moment.title}`)
      .setDescription(moment.description)
      .addFields({
        name: '🎬 Want to see more moments?',
        value:
          'Watch the development live: https://twitch.tv/projectdraguk\n' +
          'Run this command again for another story!',
        inline: false,
      })
      .setFooter({
        text: 'Built with ❤️ by Airis & The Community | Every bug has a story!',
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
