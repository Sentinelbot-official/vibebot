const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'poll',
  description: 'Create a poll',
  usage: '<question> | <option1> | <option2> | ...',
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (args.length < 3) {
      return message.reply(
        '❌ Usage: `poll <question> | <option1> | <option2> | ...`\n' +
          "Example: `poll What's your favorite color? | Red | Blue | Green`"
      );
    }

    const parts = args
      .join(' ')
      .split('|')
      .map(p => p.trim());

    if (parts.length < 3) {
      return message.reply('❌ You need at least a question and 2 options!');
    }

    if (parts.length > 11) {
      return message.reply('❌ Maximum 10 options allowed!');
    }

    const question = parts[0];
    const options = parts.slice(1);

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    let description = '';
    for (let i = 0; i < options.length; i++) {
      description += `${emojis[i]} ${options[i]}\n`;
    }

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle(`📊 ${question}`)
      .setDescription(description)
      .setFooter(branding.footers.default)
      .setTimestamp();

    const pollMsg = await message.channel.send({ embeds: [embed] });

    for (let i = 0; i < options.length; i++) {
      await pollMsg.react(emojis[i]);
    }

    message.delete().catch(() => {});
  },
};
