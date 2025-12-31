const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../../utils/database');
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
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)
    ) {
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
          `React with 🎉 to enter!`
      )
      .setFooter({
        text: `${winners} winner${winners !== 1 ? 's' : ''} | Ends at`,
      })
      .setTimestamp(endTime);

    const giveawayMsg = await message.channel.send({ embeds: [embed] });
    await giveawayMsg.react('🎉');

    // Store giveaway data
    const giveaways = db.get('giveaways', message.guild.id) || {};
    giveaways[giveawayMsg.id] = {
      channelId: message.channel.id,
      messageId: giveawayMsg.id,
      prize,
      winners,
      endTime,
      hostId: message.author.id,
      ended: false,
    };
    db.set('giveaways', message.guild.id, giveaways);

    message.reply(`✅ Giveaway started in ${message.channel}!`).then(m => {
      setTimeout(() => m.delete().catch(() => {}), 5000);
    });
    message.delete().catch(() => {});

    // Schedule giveaway end
    setTimeout(async () => {
      await endGiveaway(message.client, message.guild.id, giveawayMsg.id);
    }, duration);
  },
};

async function endGiveaway(client, guildId, messageId) {
  const giveaways = db.get('giveaways', guildId);
  if (!giveaways || !giveaways[messageId]) return;

  const giveaway = giveaways[messageId];
  if (giveaway.ended) return;

  try {
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(giveaway.channelId);
    const giveawayMsg = await channel.messages.fetch(messageId);

    // Get reaction users
    const reaction = giveawayMsg.reactions.cache.get('🎉');
    if (!reaction) {
      const embed = EmbedBuilder.from(giveawayMsg.embeds[0])
        .setColor(0xff0000)
        .setDescription('No valid entries! Giveaway cancelled.');
      await giveawayMsg.edit({ embeds: [embed] });
      giveaway.ended = true;
      db.set('giveaways', guildId, giveaways);
      return;
    }

    const users = await reaction.users.fetch();
    const entries = users.filter(u => !u.bot);

    if (entries.size === 0) {
      const embed = EmbedBuilder.from(giveawayMsg.embeds[0])
        .setColor(0xff0000)
        .setDescription('No valid entries! Giveaway cancelled.');
      await giveawayMsg.edit({ embeds: [embed] });
      giveaway.ended = true;
      db.set('giveaways', guildId, giveaways);
      return;
    }

    // Pick winners
    const winnersCount = Math.min(giveaway.winners, entries.size);
    const winnersArray = entries.random(winnersCount);
    const winners = Array.isArray(winnersArray) ? winnersArray : [winnersArray];

    // Update embed
    const embed = EmbedBuilder.from(giveawayMsg.embeds[0])
      .setColor(0x00ff00)
      .setDescription(
        `**Prize:** ${giveaway.prize}\n\n` +
          `**Winners:** ${winners.map(w => w.toString()).join(', ')}\n` +
          `**Hosted by:** <@${giveaway.hostId}>\n\n` +
          `Giveaway ended!`
      )
      .setFooter({ text: 'Ended at' });

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
