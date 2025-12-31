const db = require('../../utils/database');
const ms = require('ms');

module.exports = {
  name: 'remind',
  aliases: ['reminder', 'remindme'],
  description: 'Set a reminder',
  usage: '<time> <message>',
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `remind <time> <message>`\nExample: `remind 1h Take a break!`'
      );
    }

    const time = ms(args[0]);
    if (!time || time < 1000 || time > 31536000000) {
      return message.reply(
        '❌ Invalid time! Use format like: 1m, 1h, 1d (max 1 year)'
      );
    }

    const reminderText = args.slice(1).join(' ');
    if (reminderText.length > 500) {
      return message.reply('❌ Reminder text too long! (max 500 characters)');
    }

    const remindAt = Date.now() + time;

    // Store reminder
    const reminders = db.get('reminders', message.author.id) || [];
    reminders.push({
      text: reminderText,
      remindAt,
      channelId: message.channel.id,
      guildId: message.guild?.id,
      messageUrl: message.url,
    });

    db.set('reminders', message.author.id, reminders);

    message.reply(`✅ I'll remind you in ${args[0]}: ${reminderText}`);

    // Schedule reminder
    setTimeout(async () => {
      try {
        const channel = await message.client.channels.fetch(message.channel.id);
        await channel.send(
          `⏰ ${message.author}, Reminder: **${reminderText}**\n${message.url}`
        );

        // Remove from database
        const updatedReminders = db.get('reminders', message.author.id) || [];
        const filtered = updatedReminders.filter(r => r.remindAt !== remindAt);
        db.set('reminders', message.author.id, filtered);
      } catch (error) {
        console.error('Error sending reminder:', error);
      }
    }, time);
  },
};
