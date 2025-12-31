const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'joke',
  description: 'Get a random joke',
  usage: '',
  aliases: ['dadjoke', 'funny'],
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    const jokes = [
      {
        setup: "Why don't scientists trust atoms?",
        punchline: 'Because they make up everything!',
      },
      {
        setup: 'What do you call a fake noodle?',
        punchline: 'An impasta!',
      },
      {
        setup: 'Why did the scarecrow win an award?',
        punchline: 'He was outstanding in his field!',
      },
      {
        setup: 'What do you call a bear with no teeth?',
        punchline: 'A gummy bear!',
      },
      {
        setup: "Why don't eggs tell jokes?",
        punchline: "They'd crack each other up!",
      },
      {
        setup: 'What did the ocean say to the beach?',
        punchline: 'Nothing, it just waved!',
      },
      {
        setup: 'Why did the bicycle fall over?',
        punchline: 'Because it was two-tired!',
      },
      {
        setup: "What do you call cheese that isn't yours?",
        punchline: 'Nacho cheese!',
      },
      {
        setup: "Why couldn't the bicycle stand up by itself?",
        punchline: 'It was two tired!',
      },
      {
        setup: 'What do you call a fish wearing a bowtie?',
        punchline: 'Sofishticated!',
      },
      {
        setup: 'Why did the math book look so sad?',
        punchline: 'Because it had too many problems!',
      },
      {
        setup: 'What do you call a sleeping bull?',
        punchline: 'A bulldozer!',
      },
      {
        setup: 'Why did the cookie go to the doctor?',
        punchline: 'Because it felt crumbly!',
      },
      {
        setup: 'What do you call a dinosaur that crashes his car?',
        punchline: 'Tyrannosaurus Wrecks!',
      },
      {
        setup: "Why don't skeletons fight each other?",
        punchline: "They don't have the guts!",
      },
    ];

    const joke = jokes[Math.floor(Math.random() * jokes.length)];

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('😂 Random Joke')
      .setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
      .setFooter({ text: 'Click to reveal the punchline!' })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
