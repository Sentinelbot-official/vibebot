module.exports = {
  name: 'compliment',
  aliases: ['praise'],
  description: 'Compliment someone (or yourself)',
  usage: '[@user]',
  category: 'fun',
  cooldown: 5,
  execute(message, args) {
    const compliments = [
      "You're an awesome friend!",
      'You light up the room!',
      'You have impeccable manners.',
      "You're like sunshine on a rainy day.",
      'You bring out the best in other people.',
      'Your perspective is refreshing.',
      "You're more helpful than you realize.",
      'You have a great sense of humor!',
      "You're a great listener.",
      'You make a bigger impact than you think.',
      "You're one of a kind!",
      "You're really something special.",
    ];

    const target = message.mentions.users.first() || message.author;
    const compliment =
      compliments[Math.floor(Math.random() * compliments.length)];

    message.channel.send(`${target}, ${compliment} ✨`);
  },
};
