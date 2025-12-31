const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { parseTime, formatTime, discordTimestamp } = require('../../utils/timeUtils');

module.exports = {
  name: 'giveaway',
  description: 'Create a quick giveaway',
  usage: '<duration> <winners> <prize>',
  aliases: ['gaway', 'quickgiveaway'],
  category: 'utility',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)
    ) {
      return message.reply('❌ You need Manage Messages permission!');
    }

    if (args.length < 3) {
      return message.reply(
        '❌ Usage: `giveaway <duration> <winners> <prize>`\n' +
          'Example: `giveaway 1h 2 Discord Nitro`'
      );
    }

    const duration = parseTime(args[0]);
    if (!duration) {
      return message.reply(
        '❌ Invalid duration! Use formats like: 1h, 30m, 1d, etc.'
      );
    }

    const winners = parseInt(args[1]);
    if (isNaN(winners) || winners < 1 || winners > 20) {
      return message.reply('❌ Winners must be between 1 and 20!');
    }

    const prize = args.slice(2).join(' ');
    if (prize.length > 256) {
      return message.reply('❌ Prize name is too long (max 256 characters)!');
    }

    const endTime = Date.now() + duration;

    const embed = new EmbedBuilder()
      .setColor(0xff69b4)
      .setTitle('🎉 GIVEAWAY 🎉')
      .setDescription(
        `**Prize:** ${prize}\n` +
          `**Winners:** ${winners}\n` +
          `**Ends:** ${discordTimestamp(endTime, 'R')}\n\n` +
          `React with 🎉 to enter!`
      )
      .setFooter({ text: `Hosted by ${message.author.tag}` })
      .setTimestamp(endTime);

    const giveawayMsg = await message.channel.send({ embeds: [embed] });
    await giveawayMsg.react('🎉');

    // Store giveaway data
    setTimeout(async () => {
      try {
        const fetchedMsg = await message.channel.messages.fetch(giveawayMsg.id);
        const reaction = fetchedMsg.reactions.cache.get('🎉');

        if (!reaction) {
          return message.channel.send(
            `❌ Giveaway ended but no one entered! Prize: **${prize}**`
          );
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(u => !u.bot);

        if (participants.size === 0) {
          return message.channel.send(
            `❌ Giveaway ended but no one entered! Prize: **${prize}**`
          );
        }

        const winnerCount = Math.min(winners, participants.size);
        const winnerArray = participants.random(winnerCount);
        const winnerList = Array.isArray(winnerArray)
          ? winnerArray
          : [winnerArray];

        const winnerMentions = winnerList.map(w => `<@${w.id}>`).join(', ');

        const endEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('🎉 GIVEAWAY ENDED 🎉')
          .setDescription(
            `**Prize:** ${prize}\n` +
              `**Winner(s):** ${winnerMentions}\n\n` +
              `Congratulations!`
          )
          .setFooter({ text: `Hosted by ${message.author.tag}` })
          .setTimestamp();

        await fetchedMsg.edit({ embeds: [endEmbed] });
        await message.channel.send(
          `🎉 Congratulations ${winnerMentions}! You won **${prize}**!`
        );
      } catch (error) {
        console.error('Error ending giveaway:', error);
        message.channel.send('❌ Error ending giveaway!');
      }
    }, duration);

    message.reply(`✅ Giveaway started! Ends in ${formatTime(duration, true)}`);
  },
};
