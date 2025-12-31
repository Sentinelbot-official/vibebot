module.exports = {
  name: 'roast',
  description: 'Roast someone (or yourself)',
  usage: '[@user]',
  category: 'fun',
  cooldown: 5,
  execute(message, args) {
    const roasts = [
      "You're not stupid; you just have bad luck thinking.",
      "I'd agree with you, but then we'd both be wrong.",
      'You bring everyone so much joy... when you leave the room.',
      "I'm jealous of people who don't know you.",
      "You're like a cloud. When you disappear, it's a beautiful day.",
      "If I had a dollar for every smart thing you say, I'd be broke.",
      "You're proof that evolution can go in reverse.",
      "I'd explain it to you, but I left my crayons at home.",
      "You're the human equivalent of a participation award.",
      'Somewhere out there is a tree tirelessly producing oxygen for you. You owe it an apology.',
    ];

    const target = message.mentions.users.first() || message.author;
    const roast = roasts[Math.floor(Math.random() * roasts.length)];

    message.channel.send(`${target}, ${roast} 🔥`);
  },
};
