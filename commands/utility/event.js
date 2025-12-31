const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'event',
  description: 'Create and manage server events',
  usage: '<create/list/delete/join/leave> [details]',
  aliases: ['events', 'calendar'],
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (action === 'create') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
        return message.reply('❌ You need Manage Events permission!');
      }

      if (args.length < 4) {
        return message.reply(
          '❌ Usage: `event create <date> <time> <name> | <description>`\n\n' +
            '**Example:**\n' +
            '`event create 12/31 8:00PM New Year Party | Celebrate the new year!`\n' +
            '**Date format:** MM/DD\n' +
            '**Time format:** HH:MM AM/PM'
        );
      }

      const dateStr = args[1];
      const timeStr = args[2];
      const rest = args.slice(3).join(' ');
      const [name, description] = rest.split('|').map(t => t?.trim());

      if (!name) {
        return message.reply('❌ Please provide an event name!');
      }

      // Parse date
      const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (!dateMatch) {
        return message.reply('❌ Invalid date format! Use MM/DD');
      }

      const [, month, day] = dateMatch.map(Number);
      const year = new Date().getFullYear();

      // Parse time
      const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (!timeMatch) {
        return message.reply('❌ Invalid time format! Use HH:MM AM/PM');
      }

      let [, hours, minutes, period] = timeMatch;
      hours = parseInt(hours);
      minutes = parseInt(minutes);

      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;

      const eventDate = new Date(year, month - 1, day, hours, minutes);

      if (eventDate < Date.now()) {
        eventDate.setFullYear(year + 1);
      }

      const events = db.get('events', message.guild.id) || { events: [] };

      const eventId = Date.now();
      events.events.push({
        id: eventId,
        name,
        description: description || 'No description',
        date: eventDate.getTime(),
        createdBy: message.author.id,
        attendees: [],
      });

      db.set('events', message.guild.id, events);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.info)
        .setTitle('📅 Event Created!')
        .addFields(
          { name: '📌 Name', value: name, inline: false },
          {
            name: '📝 Description',
            value: description || 'No description',
            inline: false,
          },
          {
            name: '📅 Date',
            value: `<t:${Math.floor(eventDate.getTime() / 1000)}:F>`,
            inline: true,
          },
          {
            name: '⏰ Starts In',
            value: `<t:${Math.floor(eventDate.getTime() / 1000)}:R>`,
            inline: true,
          }
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'join') {
      const eventId = parseInt(args[1]);

      if (isNaN(eventId)) {
        return message.reply(
          '❌ Please provide an event ID!\nUsage: `event join <id>`\nUse `event list` to see events.'
        );
      }

      const events = db.get('events', message.guild.id) || { events: [] };
      const event = events.events.find(e => e.id === eventId);

      if (!event) {
        return message.reply(`❌ Event with ID ${eventId} not found!`);
      }

      if (event.attendees.includes(message.author.id)) {
        return message.reply('❌ You are already attending this event!');
      }

      event.attendees.push(message.author.id);
      db.set('events', message.guild.id, events);

      return message.reply(
        `✅ You are now attending **${event.name}**!\n📅 <t:${Math.floor(event.date / 1000)}:F>`
      );
    }

    if (action === 'leave') {
      const eventId = parseInt(args[1]);

      if (isNaN(eventId)) {
        return message.reply(
          '❌ Please provide an event ID!\nUsage: `event leave <id>`'
        );
      }

      const events = db.get('events', message.guild.id) || { events: [] };
      const event = events.events.find(e => e.id === eventId);

      if (!event) {
        return message.reply(`❌ Event with ID ${eventId} not found!`);
      }

      const index = event.attendees.indexOf(message.author.id);
      if (index === -1) {
        return message.reply('❌ You are not attending this event!');
      }

      event.attendees.splice(index, 1);
      db.set('events', message.guild.id, events);

      return message.reply(`✅ You are no longer attending **${event.name}**.`);
    }

    if (action === 'delete') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageEvents)) {
        return message.reply('❌ You need Manage Events permission!');
      }

      const eventId = parseInt(args[1]);

      if (isNaN(eventId)) {
        return message.reply(
          '❌ Please provide an event ID!\nUsage: `event delete <id>`'
        );
      }

      const events = db.get('events', message.guild.id) || { events: [] };
      const index = events.events.findIndex(e => e.id === eventId);

      if (index === -1) {
        return message.reply(`❌ Event with ID ${eventId} not found!`);
      }

      const event = events.events[index];
      events.events.splice(index, 1);
      db.set('events', message.guild.id, events);

      return message.reply(`✅ Deleted event **${event.name}**!`);
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `event <create/list/join/leave/delete>`\n\n' +
        '**Examples:**\n' +
        '`event create 12/31 8:00PM Party | New Year celebration`\n' +
        '`event list` - View all events\n' +
        '`event join 123` - Join an event\n' +
        '`event leave 123` - Leave an event\n' +
        '`event delete 123` - Delete an event (Admin)'
    );
  },
};
