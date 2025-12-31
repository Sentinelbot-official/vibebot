const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const ms = require('ms');

module.exports = {
  name: 'remind',
  description: 'Set reminders (one-time or recurring)',
  usage: '<time> <message> [--repeat daily/weekly/monthly]',
  aliases: ['reminder', 'remindme'],
  category: 'utility',
  cooldown: 3,
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `remind <time> <message> [--repeat daily/weekly/monthly]`\n\n' +
          '**Examples:**\n' +
          '`remind 1h Take a break` - One-time reminder\n' +
          '`remind 10m Check the oven` - Short reminder\n' +
          '`remind 1d Daily standup --repeat daily` - Recurring daily\n' +
          '`remind 1w Team meeting --repeat weekly` - Recurring weekly'
      );
    }

    const timeStr = args[0];
    const argsText = args.slice(1).join(' ');

    // Check for --repeat flag
    let repeatType = null;
    let reminderText = argsText;

    if (argsText.includes('--repeat')) {
      const parts = argsText.split('--repeat');
      reminderText = parts[0].trim();
      const repeatArg = parts[1]?.trim().toLowerCase();

      if (['daily', 'weekly', 'monthly'].includes(repeatArg)) {
        repeatType = repeatArg;
      } else {
        return message.reply(
          '❌ Invalid repeat type! Use: daily, weekly, or monthly'
        );
      }
    }

    if (!reminderText) {
      return message.reply('❌ Please provide a reminder message!');
    }

    const duration = ms(timeStr);

    if (!duration || duration < 60000 || duration > 31536000000) {
      return message.reply(
        '❌ Invalid time! Must be between 1 minute and 1 year.\nExamples: 1m, 5m, 1h, 1d, 1w'
      );
    }

    const reminders = db.get('reminders', 'all') || { reminders: [] };

    const reminder = {
      id: Date.now(),
      userId: message.author.id,
      channelId: message.channel.id,
      guildId: message.guild?.id || null,
      message: reminderText,
      createdAt: Date.now(),
      remindAt: Date.now() + duration,
      repeat: repeatType,
      interval: duration,
    };

    reminders.reminders.push(reminder);
    db.set('reminders', 'all', reminders);

    // Set timeout for reminder
    setTimeout(() => sendReminder(reminder, message.client), duration);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('⏰ Reminder Set!')
      .setDescription(reminderText)
      .addFields(
        {
          name: '⏰ Time',
          value: `<t:${Math.floor(reminder.remindAt / 1000)}:R>`,
          inline: true,
        },
        {
          name: '🔄 Repeat',
          value: repeatType ? repeatType : 'One-time',
          inline: true,
        }
      )
      .setFooter({ text: `Reminder ID: ${reminder.id}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

async function sendReminder(reminder, client) {
  try {
    const user = await client.users.fetch(reminder.userId);
    const channel = reminder.channelId
      ? await client.channels.fetch(reminder.channelId)
      : null;

    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('⏰ Reminder!')
      .setDescription(reminder.message)
      .setFooter({
        text: `Set ${Math.floor((Date.now() - reminder.createdAt) / 60000)} minutes ago`,
      })
      .setTimestamp();

    // Try to send in channel first, fallback to DM
    if (channel) {
      try {
        await channel.send({
          content: `${user}, reminder:`,
          embeds: [embed],
        });
      } catch (err) {
        await user.send({ embeds: [embed] });
      }
    } else {
      await user.send({ embeds: [embed] });
    }

    // Handle recurring reminders
    if (reminder.repeat) {
      const reminders = db.get('reminders', 'all') || { reminders: [] };
      const index = reminders.reminders.findIndex(r => r.id === reminder.id);

      if (index > -1) {
        // Update next reminder time
        reminders.reminders[index].remindAt = Date.now() + reminder.interval;
        reminders.reminders[index].createdAt = Date.now();
        db.set('reminders', 'all', reminders);

        // Set next reminder
        setTimeout(
          () => sendReminder(reminders.reminders[index], client),
          reminder.interval
        );
      }
    } else {
      // Remove one-time reminder
      const reminders = db.get('reminders', 'all') || { reminders: [] };
      reminders.reminders = reminders.reminders.filter(
        r => r.id !== reminder.id
      );
      db.set('reminders', 'all', reminders);
    }
  } catch (error) {
    console.error('Failed to send reminder:', error);
  }
}

// Initialize reminders on bot start
module.exports.initReminders = function (client) {
  const reminders = db.get('reminders', 'all') || { reminders: [] };

  for (const reminder of reminders.reminders) {
    const timeLeft = reminder.remindAt - Date.now();

    if (timeLeft > 0) {
      setTimeout(() => sendReminder(reminder, client), timeLeft);
    } else {
      // Missed reminder, send immediately
      sendReminder(reminder, client);
    }
  }
};
