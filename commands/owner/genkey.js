const { EmbedBuilder } = require('discord.js');
const premium = require('../../utils/premium');
const branding = require('../../utils/branding');

module.exports = {
  name: 'genkey',
  description: 'Generate a premium/VIP activation key for a specific server',
  usage: '//genkey <guild_id> <premium|vip> [duration_days] [max_uses]',
  category: 'owner',
  ownerOnly: true,
  async execute(message, args) {
    if (!args[0] || !args[1]) {
      return message.reply(
        '❌ Usage: `//genkey <guild_id> <premium|vip> [duration_days] [max_uses]`\n\n' +
          '**Examples:**\n' +
          '`//genkey 123456789 premium` - 30 days, 1 use\n' +
          '`//genkey 123456789 vip 0 1` - Lifetime, 1 use\n' +
          '`//genkey 123456789 premium 30 5` - 30 days, 5 uses\n' +
          '`//genkey 123456789 vip 365 0` - 1 year, unlimited uses\n\n' +
          '💡 **Tip:** Use this command in the target server to auto-fill the guild ID!'
      );
    }

    const guildId = args[0];
    const tier = args[1].toLowerCase();

    if (tier !== 'premium' && tier !== 'vip') {
      return message.reply('❌ Tier must be either `premium` or `vip`!');
    }

    // Check if bot is in the specified guild
    const targetGuild = message.client.guilds.cache.get(guildId);
    if (!targetGuild) {
      return message.reply(
        `❌ Bot is not in the guild with ID \`${guildId}\`!\n\n` +
          '**Make sure:**\n' +
          '• The guild ID is correct\n' +
          '• The bot has been invited to that server\n' +
          "• The bot hasn't been kicked from that server"
      );
    }

    const duration = args[2] ? parseInt(args[2]) : 30; // Default 30 days
    const maxUses = args[3] ? parseInt(args[3]) : 1; // Default 1 use

    if (isNaN(duration) || duration < 0) {
      return message.reply(
        '❌ Duration must be a positive number (0 = lifetime)!'
      );
    }

    if (isNaN(maxUses) || maxUses < 0) {
      return message.reply(
        '❌ Max uses must be a positive number (0 = unlimited)!'
      );
    }

    // Generate the key with guild binding
    const key = premium.generateKey(tier, duration, maxUses, guildId);

    const embed = new EmbedBuilder()
      .setColor(tier === 'vip' ? '#ff0000' : '#0099ff')
      .setTitle(`🔑 ${tier.toUpperCase()} Key Generated`)
      .setDescription(`\`\`\`${key}\`\`\``)
      .addFields(
        {
          name: '🏰 Server',
          value: `${targetGuild.name}\n\`${guildId}\``,
          inline: false,
        },
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
        text: 'This key can ONLY be activated in the specified server by someone with Manage Server permission',
      })
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    // Also send as plain text for easy copying
    await message.channel.send(`**Copy this key:**\n\`${key}\``);
  },
};
