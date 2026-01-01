const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'remind',
  aliases: ['reminder', 'remindme'],
  description: 'Set advanced reminders with repeat options',
  usage: '<time> <message> [repeat]',
  category: 'utility',
  cooldown: 5,
  async execute(message, args) {
    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('⏰ Advanced Reminders')
        .setDescription(
          '**Set reminders with repeat options!**\n\n' +
            '**Usage:**\n' +
            '`//remind <time> <message> [repeat]`\n\n' +
            '**Time Format:**\n' +
            '• `10m` - 10 minutes\n' +
            '• `2h` - 2 hours\n' +
            '• `3d` - 3 days\n' +
            '• `1w` - 1 week\n\n' +
            '**Repeat Options:**\n' +
            '• `daily` - Every day\n' +
            '• `weekly` - Every week\n' +
            '• `monthly` - Every month\n\n' +
            '**Examples:**\n' +
            '`//remind 30m Check stream`\n' +
            '`//remind 1d Daily quest daily`\n' +
            '`//remind 1w Server backup weekly`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const timeStr = args[0];
    const repeat = args[args.length - 1].toLowerCase();
    const isRepeat = ['daily', 'weekly', 'monthly'].includes(repeat);
    const reminderText = isRepeat
      ? args.slice(1, -1).join(' ')
      : args.slice(1).join(' ');

    const time = parseTime(timeStr);

    if (!time) {
      return message.reply('❌ Invalid time format! Use: 10m, 2h, 3d, 1w');
    }

    const reminderId = Date.now().toString();
    const reminders = db.get('reminders', message.author.id) || [];

    reminders.push({
      id: reminderId,
      message: reminderText,
      time: Date.now() + time,
      channelId: message.channel.id,
      repeat: isRepeat ? repeat : null,
      repeatInterval: isRepeat ? getRepeatInterval(repeat) : null,
    });

    db.set('reminders', message.author.id, reminders);

    return message.reply(
      `✅ Reminder set for <t:${Math.floor((Date.now() + time) / 1000)}:R>${isRepeat ? ` (${repeat})` : ''}!`
    );
  },
};

function parseTime(str) {
  const match = str.match(/^(\d+)([mhdw])$/);
  if (!match) return null;

  const [, num, unit] = match;
  const multipliers = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return parseInt(num) * multipliers[unit];
}

function getRepeatInterval(repeat) {
  const intervals = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
  };
  return intervals[repeat];
}
