const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const branding = require('../utils/branding');

module.exports = {
  name: 'eventReminder',
  once: false,

  async execute(client) {
    // Check every minute for events to remind
    setInterval(async () => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      for (const guild of client.guilds.cache.values()) {
        try {
          const events = db.get('scheduled_events', guild.id) || {};

          for (const event of Object.values(events)) {
            // Check if event is within 1 hour and hasn't been reminded
            if (
              !event.reminded &&
              event.date - now <= oneHour &&
              event.date > now
            ) {
              const channel = guild.channels.cache.get(event.channelId);
              if (!channel) continue;

              const embed = new EmbedBuilder()
                .setColor(branding.colors.warning)
                .setTitle('⏰ Event Reminder!')
                .setDescription(
                  `**${event.name}** is starting soon!\n\n` +
                    `📅 **Starts:** <t:${Math.floor(event.date / 1000)}:R>\n` +
                    `📝 **Description:** ${event.description}\n\n` +
                    `Get ready! 🎉`
                )
                .setFooter(branding.footers.default)
                .setTimestamp();

              await channel.send({ embeds: [embed] });

              // Mark as reminded
              event.reminded = true;
              events[event.id] = event;
              db.set('scheduled_events', guild.id, events);
            }

            // Clean up past events (older than 1 day)
            if (event.date < now - 24 * 60 * 60 * 1000) {
              delete events[event.id];
              db.set('scheduled_events', guild.id, events);
            }
          }
        } catch (error) {
          console.error(`Error checking events for ${guild.name}:`, error);
        }
      }
    }, 60 * 1000); // Check every minute
  },
};
