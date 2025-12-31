const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'birthday',
  description: 'Set or view birthdays',
  usage: '<set/remove/list/upcoming> [date]',
  aliases: ['bday', 'bd'],
  category: 'social',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || action === 'view') {
      // View own birthday or mentioned user's birthday
      const target = message.mentions.users.first() || message.author;
      const birthday = db.get('birthdays', target.id);

      if (!birthday) {
        return message.reply(
          `${target.id === message.author.id ? "You haven't" : `${target.username} hasn't`} set a birthday yet!\nUse \`birthday set MM/DD\` to set one.`
        );
      }

      const [month, day] = birthday.date.split('/');
      const date = new Date(2024, month - 1, day);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      });

      const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setAuthor({
          name: target.username,
          iconURL: target.displayAvatarURL(),
        })
        .setTitle('🎂 Birthday')
        .setDescription(`**${dateStr}**`)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'set') {
      const dateInput = args[1];

      if (!dateInput) {
        return message.reply(
          '❌ Please provide a date!\nUsage: `birthday set MM/DD`\nExample: `birthday set 03/15`'
        );
      }

      // Validate date format
      const dateRegex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])$/;
      if (!dateRegex.test(dateInput)) {
        return message.reply(
          '❌ Invalid date format! Use MM/DD\nExample: `birthday set 03/15`'
        );
      }

      const [month, day] = dateInput.split('/').map(Number);

      // Validate date
      const testDate = new Date(2024, month - 1, day);
      if (testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
        return message.reply(
          '❌ Invalid date! Please check the month and day.'
        );
      }

      db.set('birthdays', message.author.id, {
        userId: message.author.id,
        date: `${month}/${day}`,
        setAt: Date.now(),
      });

      const dateStr = testDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      });

      return message.reply(`🎂 Birthday set to **${dateStr}**!`);
    }

    if (action === 'remove') {
      const birthday = db.get('birthdays', message.author.id);

      if (!birthday) {
        return message.reply("❌ You don't have a birthday set!");
      }

      db.delete('birthdays', message.author.id);
      return message.reply('🗑️ Birthday removed!');
    }

    if (action === 'list') {
      const allBirthdays = db.getAll('birthdays');
      const guildMembers = await message.guild.members.fetch();

      // Filter to only guild members
      const guildBirthdays = allBirthdays.filter(bd =>
        guildMembers.has(bd.userId)
      );

      if (!guildBirthdays.length) {
        return message.reply('❌ No birthdays set in this server yet!');
      }

      // Sort by month/day
      guildBirthdays.sort((a, b) => {
        const [aMonth, aDay] = a.date.split('/').map(Number);
        const [bMonth, bDay] = b.date.split('/').map(Number);
        if (aMonth !== bMonth) return aMonth - bMonth;
        return aDay - bDay;
      });

      const list = guildBirthdays
        .map(bd => {
          const member = guildMembers.get(bd.userId);
          const [month, day] = bd.date.split('/');
          const date = new Date(2024, month - 1, day);
          const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
          return `${dateStr} - ${member.user.username}`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setTitle('🎂 Server Birthdays')
        .setDescription(list || 'No birthdays set!')
        .setFooter({ text: `Total: ${guildBirthdays.length} birthdays` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'upcoming') {
      const allBirthdays = db.getAll('birthdays');
      const guildMembers = await message.guild.members.fetch();

      const guildBirthdays = allBirthdays.filter(bd =>
        guildMembers.has(bd.userId)
      );

      if (!guildBirthdays.length) {
        return message.reply('❌ No birthdays set in this server yet!');
      }

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      // Calculate days until birthday
      const upcomingBirthdays = guildBirthdays
        .map(bd => {
          const [month, day] = bd.date.split('/').map(Number);
          let daysUntil;

          if (
            month > currentMonth ||
            (month === currentMonth && day >= currentDay)
          ) {
            // Birthday is this year
            const bdDate = new Date(now.getFullYear(), month - 1, day);
            daysUntil = Math.ceil((bdDate - now) / (1000 * 60 * 60 * 24));
          } else {
            // Birthday is next year
            const bdDate = new Date(now.getFullYear() + 1, month - 1, day);
            daysUntil = Math.ceil((bdDate - now) / (1000 * 60 * 60 * 24));
          }

          return { ...bd, daysUntil };
        })
        .sort((a, b) => a.daysUntil - b.daysUntil)
        .slice(0, 10); // Top 10 upcoming

      const list = upcomingBirthdays
        .map(bd => {
          const member = guildMembers.get(bd.userId);
          const [month, day] = bd.date.split('/');
          const date = new Date(2024, month - 1, day);
          const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          let daysStr;
          if (bd.daysUntil === 0) daysStr = '🎉 **TODAY!**';
          else if (bd.daysUntil === 1) daysStr = '**Tomorrow**';
          else daysStr = `in ${bd.daysUntil} days`;

          return `${dateStr} - ${member.user.username} (${daysStr})`;
        })
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xff69b4)
        .setTitle('🎂 Upcoming Birthdays')
        .setDescription(list)
        .setFooter({ text: 'Top 10 upcoming birthdays' })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'channel') {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        return message.reply('❌ You need Manage Server permission!');
      }

      const channel = message.mentions.channels.first();

      if (!channel) {
        // Show current channel
        const settings = db.get('guild_settings', message.guild.id) || {};
        const currentChannel = settings.birthdayChannel;

        if (!currentChannel) {
          return message.reply(
            '❌ No birthday channel set!\nUsage: `birthday channel #channel`'
          );
        }

        return message.reply(
          `Current birthday channel: <#${currentChannel}>\nUse \`birthday channel #channel\` to change it.`
        );
      }

      const settings = db.get('guild_settings', message.guild.id) || {};
      settings.birthdayChannel = channel.id;
      db.set('guild_settings', message.guild.id, settings);

      return message.reply(
        `✅ Birthday announcements will be sent to ${channel}!`
      );
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `birthday <set/remove/view/list/upcoming/channel>`\n\n' +
        '**Examples:**\n' +
        '`birthday set 03/15` - Set your birthday\n' +
        "`birthday view @user` - View someone's birthday\n" +
        '`birthday list` - List all birthdays\n' +
        '`birthday upcoming` - See upcoming birthdays\n' +
        '`birthday channel #channel` - Set announcement channel (Admin)'
    );
  },
};
