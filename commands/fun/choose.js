module.exports = {
  name: 'choose',
  aliases: ['pick', 'select'],
  description: 'Choose between multiple options',
  usage: '<option1> | <option2> | ...',
  category: 'fun',
  cooldown: 3,
  execute(message, args) {
    if (!args.length) {
      return message.reply('❌ Usage: `!choose <option1> | <option2> | ...`');
    }

    const options = args
      .join(' ')
      .split('|')
      .map(o => o.trim())
      .filter(o => o);

    if (options.length < 2) {
      return message.reply(
        '❌ Please provide at least 2 options separated by `|`'
      );
    }

    const chosen = options[Math.floor(Math.random() * options.length)];
    message.reply(`🤔 I choose: **${chosen}**`);
  },
};
