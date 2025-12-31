const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'rep',
  description: 'Give reputation points to another user',
  usage: '<@user> [reason]',
  aliases: ['reputation', '+rep'],
  category: 'social',
  cooldown: 86400, // 24 hours
  async execute(message, args) {
    const targetUser = message.mentions.users.first();

    if (!targetUser) {
      return message.reply(
        '❌ Please mention someone to give reputation to!\nUsage: `rep @user [reason]`'
      );
    }

    if (targetUser.id === message.author.id) {
      return message.reply('❌ You cannot give reputation to yourself!');
    }

    if (targetUser.bot) {
      return message.reply('❌ You cannot give reputation to bots!');
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';

    // Get target's reputation data
    const repData = db.get('reputation', targetUser.id) || {
      total: 0,
      received: [],
      lastUpdated: Date.now(),
    };

    // Add reputation
    repData.total += 1;
    repData.received.push({
      from: message.author.id,
      fromTag: message.author.tag,
      reason: reason,
      timestamp: Date.now(),
      date: new Date().toISOString(),
    });
    repData.lastUpdated = Date.now();

    // Keep only last 50 rep entries
    if (repData.received.length > 50) {
      repData.received = repData.received.slice(-50);
    }

    db.set('reputation', targetUser.id, repData);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('⭐ Reputation Given!')
      .setDescription(`${message.author} gave reputation to ${targetUser}!`)
      .addFields(
        { name: '💬 Reason', value: reason, inline: false },
        {
          name: '📊 Total Reputation',
          value: repData.total.toString(),
          inline: true,
        }
      )
      .setFooter({ text: `You can give rep again in 24 hours` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
