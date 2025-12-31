const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'divorce',
  description: 'Divorce your current partner',
  category: 'social',
  cooldown: 10,
  async execute(message) {
    const marriage = db.get('marriages', message.author.id);

    if (!marriage) {
      return message.reply('❌ You are not married!');
    }

    const partnerId = marriage.partnerId;
    const marriedDate = new Date(marriage.marriedDate);
    const duration = Date.now() - marriage.marriedAt;
    const days = Math.floor(duration / (1000 * 60 * 60 * 24));

    // Delete both marriage records
    db.delete('marriages', message.author.id);
    db.delete('marriages', partnerId);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.warning)
      .setTitle('💔 Divorce')
      .setDescription(`${message.author} and <@${partnerId}> are now divorced.`)
      .addFields(
        {
          name: '💒 Married On',
          value: marriedDate.toLocaleDateString(),
          inline: true,
        },
        { name: '⏱️ Marriage Duration', value: `${days} days`, inline: true }
      )
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
