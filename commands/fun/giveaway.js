const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const premiumPerks = require('../../utils/premiumPerks');

module.exports = {
  name: 'giveaway',
  description: 'Create and manage giveaways (Premium users get bonus entries!)',
  usage: '//giveaway <start/end/reroll> [duration] [winners] [prize]',
  aliases: ['gstart', 'gend'],
  category: 'fun',
  cooldown: 10,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['start', 'end', 'reroll', 'list'].includes(action)) {
      const hasPremium = premiumPerks.hasFeature(
        message.guild.id,
        'premium_badge'
      );
      const tierBadge = premiumPerks.getTierBadge(message.guild.id);

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('🎉 Giveaway System')
        .setDescription(
          '**Host amazing giveaways in your server!**\n\n' +
            '**Commands:**\n' +
            '`//giveaway start <duration> <winners> <prize>` - Start a giveaway\n' +
            '`//giveaway end <messageId>` - End a giveaway early\n' +
            '`//giveaway reroll <messageId>` - Reroll winners\n' +
            '`//giveaway list` - List active giveaways\n\n' +
            '**Duration Examples:**\n' +
            '• `10m` - 10 minutes\n' +
            '• `1h` - 1 hour\n' +
            '• `1d` - 1 day\n' +
            '• `7d` - 7 days\n\n' +
            '**Example:**\n' +
            '`//giveaway start 1d 1 Nitro Classic`\n\n' +
            `${tierBadge} **Premium Perks:**\n` +
            `${hasPremium ? '✅' : '❌'} Premium: 2x entries\n` +
            `${hasPremium ? '✅' : '❌'} VIP: 3x entries`
        )
        .setFooter({
          text: hasPremium
            ? 'Premium Feature Active 💎'
            : 'Upgrade to Premium for bonus entries!',
        });

      return message.reply({ embeds: [embed] });
    }

    // Check permissions for start/end/reroll
    if (['start', 'end', 'reroll'].includes(action)) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply(
          '❌ You need the **Manage Server** permission to manage giveaways!'
        );
      }
    }

    if (action === 'start') {
      const duration = args[1];
      const winners = parseInt(args[2]);
      const prize = args.slice(3).join(' ');

      if (!duration || !winners || !prize) {
        return message.reply(
          '❌ Usage: `//giveaway start <duration> <winners> <prize>`\n' +
            'Example: `//giveaway start 1d 1 Discord Nitro`'
        );
      }

      // Parse duration
      const durationRegex = /^(\d+)([smhd])$/;
      const match = duration.match(durationRegex);

      if (!match) {
        return message.reply(
          '❌ Invalid duration! Use format like: `10m`, `1h`, `1d`, `7d`'
        );
      }

      const amount = parseInt(match[1]);
      const unit = match[2];
      const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
      const durationMs = amount * multipliers[unit];

      if (durationMs < 60000) {
        return message.reply('❌ Giveaway must be at least 1 minute long!');
      }

      if (winners < 1 || winners > 20) {
        return message.reply('❌ Winners must be between 1 and 20!');
      }

      // Create giveaway embed
      const endTime = Date.now() + durationMs;
      const tierBadge = premiumPerks.getTierBadge(message.guild.id);

      const giveawayEmbed = new EmbedBuilder()
        .setColor('#ff69b4')
        .setTitle('🎉 GIVEAWAY 🎉')
        .setDescription(
          `**Prize:** ${prize}\n\n` +
            `**Winners:** ${winners}\n` +
            `**Ends:** <t:${Math.floor(endTime / 1000)}:R>\n` +
            `**Hosted by:** ${message.author}\n\n` +
            `React with 🎉 to enter!\n\n` +
            `${tierBadge} **Premium Bonus:**\n` +
            `💎 Premium users get 2x entries\n` +
            `👑 VIP users get 3x entries`
        )
        .setFooter(branding.footers.default)
      .setTimestamp();

    await giveawayMsg.edit({ embeds: [embed] });

    // Announce winners
    await channel.send(
      `🎉 Congratulations ${winners.map(w => `<@${w.id}>`).join(', ')}! You won **${giveaway.prize}**!`
    );

    // Mark as ended
    if (!isReroll) {
      const giveaways = db.get('giveaways', giveaway.guildId) || {};
      if (giveaways[giveaway.messageId]) {
        giveaways[giveaway.messageId].ended = true;
        db.set('giveaways', giveaway.guildId, giveaways);
      }
    }
  } catch (error) {
    const logger = require('../../utils/logger');
const branding = require('../../utils/branding');
    logger.error('Giveaway end error:', error);
  }
}

// Export for use in scheduled task
module.exports.endGiveaway = endGiveaway;
