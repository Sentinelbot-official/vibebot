const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');
const ms = require('ms');

module.exports = {
  name: 'gstart',
  aliases: ['gcreate', 'giveaway'],
  description: 'Start a giveaway',
  usage: '<duration> <winners> <prize>',
  category: 'giveaway',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need Manage Server permission to start giveaways!'
      );
    }

    if (args.length < 3) {
      return message.reply(
        '❌ Usage: `gstart <duration> <winners> <prize>`\nExample: `gstart 1h 1 Nitro`'
      );
    }

    // Parse duration
    const duration = ms(args[0]);
    if (!duration || duration < 1000) {
      return message.reply('❌ Invalid duration! Use format like: 1m, 1h, 1d');
    }

    // Parse winners
    const winners = parseInt(args[1]);
    if (isNaN(winners) || winners < 1 || winners > 20) {
      return message.reply('❌ Winners must be between 1 and 20!');
    }

    // Get prize
    const prize = args.slice(2).join(' ');
    if (prize.length > 256) {
      return message.reply(
        '❌ Prize description is too long! (max 256 characters)'
      );
    }

    const endTime = Date.now() + duration;
    const endTimestamp = Math.floor(endTime / 1000);

    // Create giveaway embed
    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('🎉 GIVEAWAY 🎉')
      .setDescription(
        `**Prize:** ${prize}\n\n` +
          `**Winners:** ${winners}\n` +
          `**Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:F>)\n` +
          `**Hosted by:** ${message.author}\n\n` +
          'React with 🎉 to enter!'
      )
      .setFooter(branding.footers.default);

    await giveawayMsg.edit({ embeds: [embed] });

    // Announce winners
    await channel.send(
      `🎉 Congratulations ${winners.map(w => w.toString()).join(', ')}! You won **${giveaway.prize}**!`
    );

    giveaway.ended = true;
    giveaway.winners = winners.map(w => w.id);
    db.set('giveaways', guildId, giveaways);
  } catch (error) {
    console.error('Error ending giveaway:', error);
  }
}
