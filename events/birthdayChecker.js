const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const logger = require('../utils/logger');

let lastCheckedDate = null;

module.exports = {
  name: 'clientReady',
  once: false,
  execute(client) {
    // Check birthdays every hour
    setInterval(
      () => {
        checkBirthdays(client);
      },
      60 * 60 * 1000
    ); // Every hour

    // Also check immediately on startup
    setTimeout(() => checkBirthdays(client), 5000);
  },
};

async function checkBirthdays(client) {
  try {
    const now = new Date();
    const today = `${now.getMonth() + 1}/${now.getDate()}`;

    // Only check once per day
    if (lastCheckedDate === today) return;
    lastCheckedDate = today;

    logger.info('Checking for birthdays...');

    const allBirthdays = db.getAll('birthdays');
    const todaysBirthdays = allBirthdays.filter(bd => bd.date === today);

    if (!todaysBirthdays.length) {
      logger.info('No birthdays today');
      return;
    }

    logger.info(`Found ${todaysBirthdays.length} birthday(s) today!`);

    // Announce birthdays in each guild
    for (const guild of client.guilds.cache.values()) {
      const settings = db.get('guild_settings', guild.id) || {};
      const channelId = settings.birthdayChannel;

      if (!channelId) continue;

      const channel = guild.channels.cache.get(channelId);
      if (!channel) continue;

      // Check which birthday users are in this guild
      const guildBirthdays = [];
      for (const bd of todaysBirthdays) {
        try {
          const member = await guild.members.fetch(bd.userId);
          if (member) guildBirthdays.push(member);
        } catch (err) {
          // User not in guild
        }
      }

      if (!guildBirthdays.length) continue;

      // Send birthday announcement
      for (const member of guildBirthdays) {
        const embed = new EmbedBuilder()
          .setColor(0xff69b4)
          .setTitle('🎉 Happy Birthday! 🎂')
          .setDescription(
            `Everyone wish ${member} a happy birthday! 🎊\n\n` +
              `🎈 Have an amazing day! 🎈`
          )
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .setTimestamp();

        try {
          await channel.send({
            content: `🎂 ${member} 🎂`,
            embeds: [embed],
          });

          logger.info(
            `Sent birthday announcement for ${member.user.tag} in ${guild.name}`
          );
        } catch (err) {
          logger.error(`Failed to send birthday message: ${err.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`Birthday checker error: ${error.message}`);
  }
}
