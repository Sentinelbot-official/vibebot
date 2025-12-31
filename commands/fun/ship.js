const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'ship',
  description: 'Ship two users together',
  usage: '<@user1> <@user2>',
  aliases: ['love', 'lovecalc'],
  category: 'fun',
  cooldown: 3,
  guildOnly: true,
  async execute(message, args) {
    let user1, user2;

    if (args.length === 0) {
      // Ship author with random member
      user1 = message.author;
      const members = message.guild.members.cache.filter(m => !m.user.bot);
      user2 = members.random().user;
    } else if (args.length === 1) {
      // Ship author with mentioned user
      user1 = message.author;
      user2 =
        message.mentions.users.first() ||
        (await message.guild.members.fetch(args[0]).catch(() => null))?.user;

      if (!user2) {
        return message.reply('❌ Please mention a valid user!');
      }
    } else {
      // Ship two mentioned users
      const mentions = message.mentions.users;
      if (mentions.size < 2) {
        return message.reply('❌ Please mention two users!');
      }

      user1 = mentions.first();
      user2 = mentions.at(1);
    }

    // Calculate ship percentage (deterministic based on user IDs)
    const combined = [user1.id, user2.id].sort().join('');
    const hash = combined.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

    const percentage = Math.abs(hash % 101); // 0-100

    // Generate ship name
    const name1 = user1.username;
    const name2 = user2.username;
    const shipName =
      name1.substring(0, Math.ceil(name1.length / 2)) +
      name2.substring(Math.floor(name2.length / 2));

    // Generate love bar
    const filledHearts = '❤️'.repeat(Math.floor(percentage / 10));
    const emptyHearts = '🤍'.repeat(10 - Math.floor(percentage / 10));
    const loveBar = filledHearts + emptyHearts;

    // Love messages
    let loveMessage;
    if (percentage < 20) {
      loveMessage = 'Not meant to be... 💔';
    } else if (percentage < 40) {
      loveMessage = 'There might be a chance... 🤔';
    } else if (percentage < 60) {
      loveMessage = 'Could work out! 😊';
    } else if (percentage < 80) {
      loveMessage = 'Great match! 💕';
    } else if (percentage < 95) {
      loveMessage = 'Perfect together! 💖';
    } else {
      loveMessage = 'SOULMATES! 💞✨';
    }

    const embed = new EmbedBuilder()
      .setColor(
        percentage >= 70 ? 0xff69b4 : percentage >= 40 ? 0xffa500 : 0x808080
      )
      .setTitle('💘 Love Calculator')
      .setDescription(
        `**${user1.username}** 💕 **${user2.username}**\n\n` +
          `${loveBar}\n\n` +
          `**${percentage}%** - ${loveMessage}\n\n` +
          `Ship Name: **${shipName}**`
      )
      .setThumbnail(user1.displayAvatarURL())
      .setImage(user2.displayAvatarURL())
      .setFooter(branding.footers.default)
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
