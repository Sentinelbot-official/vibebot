const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'reputation',
  description: 'View reputation information for a user',
  usage: '[@user]',
  aliases: ['reps', 'repinfo'],
  category: 'social',
  cooldown: 3,
  async execute(message, args) {
    const targetUser = message.mentions.users.first() || message.author;

    const repData = db.get('reputation', targetUser.id) || {
      total: 0,
      received: [],
    };

    const embed = new EmbedBuilder()
      .setColor(branding.colors.premium)
      .setTitle(`⭐ ${targetUser.username}'s Reputation`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        {
          name: '📊 Total Reputation',
          value: repData.total.toString(),
          inline: true,
        },
        {
          name: '📝 Received Count',
          value: repData.received.length.toString(),
          inline: true,
        }
      );

    // Show last 5 reputation entries
    if (repData.received.length > 0) {
      const recentReps = repData.received.slice(-5).reverse();
      const repList = recentReps
        .map((rep, index) => {
          const date = new Date(rep.timestamp).toLocaleDateString();
          return `**${index + 1}.** From ${rep.fromTag}\n*"${rep.reason}"* - ${date}`;
        })
        .join('\n\n');

      embed.addFields({
        name: '📜 Recent Reputation',
        value: repList,
        inline: false,
      });
    } else {
      embed.addFields({
        name: '📜 Recent Reputation',
        value: 'No reputation received yet',
        inline: false,
      });
    }

    embed.setFooter(branding.footers.default).setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
