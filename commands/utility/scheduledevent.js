const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'scheduledevent',
  aliases: ['event', 'schedule', 'reminder'],
  description: 'Schedule server events with reminders',
  usage: '<create/list/delete> [details]',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['create', 'list', 'delete', 'edit'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📅 Scheduled Events')
        .setDescription(
          '**Organize server events with automatic reminders!**\n\n' +
            '**Commands:**\n' +
            '`//event create <name> | <date> | <time> | [description]`\n' +
            '`//event list` - View upcoming events\n' +
            '`//event delete <id>` - Cancel an event\n\n' +
            '**Date Format:** YYYY-MM-DD (e.g., 2026-01-15)\n' +
            '**Time Format:** HH:MM (24-hour, e.g., 19:30)\n\n' +
            '**Example:**\n' +
            '`//event create Movie Night | 2026-01-10 | 20:00 | Watch movies together!`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'create') {
      const eventData = args
        .slice(1)
        .join(' ')
        .split('|')
        .map(s => s.trim());

      if (eventData.length < 3) {
        return message.reply(
          '❌ Format: `//event create <name> | <date> | <time> | [description]`\n' +
            'Example: `//event create Game Night | 2026-01-10 | 20:00 | Play games!`'
        );
      }

      const [name, date, time, description = 'No description'] = eventData;

      // Parse date and time
      const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const timeMatch = time.match(/^(\d{2}):(\d{2})$/);

      if (!dateMatch || !timeMatch) {
        return message.reply(
          '❌ Invalid date/time format!\n' +
            'Date: YYYY-MM-DD (e.g., 2026-01-10)\n' +
            'Time: HH:MM (e.g., 20:00)'
        );
      }

      const eventDate = new Date(
        `${date}T${time}:00${new Date().toString().match(/GMT([+-]\d{4})/)[0]}`
      );

      if (eventDate < new Date()) {
        return message.reply('❌ Event date must be in the future!');
      }

      const eventId = Date.now().toString();
      const events = db.get('scheduled_events', message.guild.id) || {};

      events[eventId] = {
        id: eventId,
        name,
        description,
        date: eventDate.getTime(),
        channelId: message.channel.id,
        createdBy: message.author.id,
        createdAt: Date.now(),
        reminded: false,
      };

      db.set('scheduled_events', message.guild.id, events);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle('✅ Event Scheduled!')
        .setDescription(
          `**${name}**\n\n` +
            `📅 **Date:** <t:${Math.floor(eventDate.getTime() / 1000)}:F>\n` +
            `⏰ **Time:** <t:${Math.floor(eventDate.getTime() / 1000)}:t>\n` +
            `📝 **Description:** ${description}\n` +
            `🆔 **Event ID:** \`${eventId}\`\n\n` +
            `**Reminder:** 1 hour before event`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'list') {
      const events = db.get('scheduled_events', message.guild.id) || {};
      const upcomingEvents = Object.values(events)
        .filter(e => e.date > Date.now())
        .sort((a, b) => a.date - b.date);

      if (upcomingEvents.length === 0) {
        return message.reply('📭 No upcoming events scheduled!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📅 Upcoming Events')
        .setDescription(
          upcomingEvents
            .map(
              (e, i) =>
                `**${i + 1}. ${e.name}**\n` +
                `📅 <t:${Math.floor(e.date / 1000)}:F> (<t:${Math.floor(e.date / 1000)}:R>)\n` +
                `📝 ${e.description}\n` +
                `🆔 ID: \`${e.id}\``
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'delete') {
      const eventId = args[1];

      if (!eventId) {
        return message.reply('❌ Please provide an event ID!');
      }

      const events = db.get('scheduled_events', message.guild.id) || {};

      if (!events[eventId]) {
        return message.reply('❌ Event not found!');
      }

      const event = events[eventId];
      delete events[eventId];
      db.set('scheduled_events', message.guild.id, events);

      return message.reply(`✅ Event **${event.name}** has been cancelled.`);
    }
  },
};
