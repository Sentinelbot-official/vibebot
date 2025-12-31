const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: '8ball',
  description: 'Ask the magic 8ball a question',
  usage: '<question>',
  aliases: ['eightball', 'magic8ball'],
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Please ask a question!');
    }

    const question = args.join(' ');

    const responses = [
      // Positive
      'It is certain.',
      'It is decidedly so.',
      'Without a doubt.',
      'Yes definitely.',
      'You may rely on it.',
      'As I see it, yes.',
      'Most likely.',
      'Outlook good.',
      'Yes.',
      'Signs point to yes.',
      // Non-committal
      'Reply hazy, try again.',
      'Ask again later.',
      'Better not tell you now.',
      'Cannot predict now.',
      'Concentrate and ask again.',
      // Negative
      "Don't count on it.",
      'My reply is no.',
      'My sources say no.',
      'Outlook not so good.',
      'Very doubtful.',
    ];

    const answer = responses[Math.floor(Math.random() * responses.length)];

    // Determine color based on answer type
    let color;
    if (
      answer.includes('yes') ||
      answer.includes('certain') ||
      answer.includes('definitely')
    ) {
      color = 0x00ff00; // Green
    } else if (answer.includes('no') || answer.includes('doubtful')) {
      color = 0xff0000; // Red
    } else {
      color = 0xffa500; // Orange
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        {
          name: 'Question',
          value: question,
          inline: false,
        },
        {
          name: 'Answer',
          value: `*${answer}*`,
          inline: false,
        }
      )
      .setFooter({ text: `Asked by ${message.author.tag}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
