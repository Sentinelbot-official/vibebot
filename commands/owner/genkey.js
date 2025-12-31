const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');

module.exports = {
  name: 'genkey',
  description: 'Generate a premium/VIP activation key',
  usage: '//genkey <premium|vip> [duration_days] [max_uses]',
  category: 'owner',
  ownerOnly: true,
  async execute(message, args) {
    if (!args[0]) {
      return message.reply(
        '❌ Usage: `//genkey <premium|vip> [duration_days] [max_uses]`\n\n' +
          '**Examples:**\n' +
          '`//genkey premium` - 30 days, 1 use\n' +
          '`//genkey vip 0 1` - Lifetime, 1 use\n' +
          '`//genkey premium 30 5` - 30 days, 5 uses\n' +
          '`//genkey vip 365 0` - 1 year, unlimited uses'
      );
    }

    const tier = args[0].toLowerCase();
    if (tier !== 'premium' && tier !== 'vip') {
      return message.reply('❌ Tier must be either `premium` or `vip`!');
    }

    const duration = args[1] ? parseInt(args[1]) : 30; // Default 30 days
    const maxUses = args[2] ? parseInt(args[2]) : 1; // Default 1 use

    if (isNaN(duration) || duration < 0) {
      return message.reply('❌ Duration must be a positive number (0 = lifetime)!');
    }

    if (isNaN(maxUses) || maxUses < 0) {
      return message.reply('❌ Max uses must be a positive number (0 = unlimited)!');
    }

    // Generate the key
    const key = premium.generateKey(tier, duration, maxUses);

    const embed = new EmbedBuilder()
      .setColor(tier === 'vip' ? '#ff0000' : '#0099ff')
      .setTitle(`🔑 ${tier.toUpperCase()} Key Generated`)
      .setDescription(`\`\`\`${key}\`\`\``)
      .addFields(
        {
          name: '🎫 Tier',
          value: tier.toUpperCase(),
          inline: true,
        },
        {
          name: '📅 Duration',
          value: duration > 0 ? `${duration} days` : '♾️ Lifetime',
          inline: true,
        },
        {
          name: '🔢 Max Uses',
          value: maxUses > 0 ? `${maxUses}` : '♾️ Unlimited',
          inline: true,
        }
      )
      .setFooter({
        text: 'Give this key to the customer - they can activate it with //activate <key>',
      })
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Also send as plain text for easy copying
    await message.channel.send(`**Copy this key:**\n\`${key}\``);
  },
};
