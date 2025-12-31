const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'marriage',
  description: 'View marriage information',
  usage: '[@user]',
  aliases: ['married', 'spouse'],
  category: 'social',
  cooldown: 5,
  async execute(message, args) {
    const targetUser = message.mentions.users.first() || message.author;

    const marriage = db.get('marriages', targetUser.id);

    if (!marriage) {
      if (targetUser.id === message.author.id) {
        return message.reply(
          '❌ You are not married! Use `marry @user` to propose to someone.'
        );
      } else {
        return message.reply(`❌ ${targetUser.username} is not married!`);
      }
    }

    const partner = await message.client.users
      .fetch(marriage.partnerId)
      .catch(() => null);
    const marriedDate = new Date(marriage.marriedDate);
    const duration = Date.now() - marriage.marriedAt;
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;

    let durationText = '';
    if (years > 0) {
      durationText = `${years} year${years !== 1 ? 's' : ''} and ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
    } else {
      durationText = `${days} day${days !== 1 ? 's' : ''}`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('💑 Marriage Information')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 User', value: targetUser.tag, inline: true },
        {
          name: '💕 Married To',
          value: partner ? partner.tag : 'Unknown User',
          inline: true,
        },
        {
          name: '💒 Wedding Date',
          value: marriedDate.toLocaleDateString(),
          inline: false,
        },
        { name: '⏱️ Duration', value: durationText, inline: false }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
