const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'story',
  aliases: ['storybuilder', 'collaborate'],
  description: 'Collaborative story building',
  usage: '<start/add/view/end>',
  category: 'fun',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['start', 'add', 'view', 'end'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('📖 Story Builder')
        .setDescription(
          '**Build stories together!**\n\n' +
            '**Commands:**\n' +
            '`//story start <title>` - Start new story\n' +
            '`//story add <text>` - Add to story\n' +
            '`//story view` - View current story\n' +
            '`//story end` - Finish story\n\n' +
            '**Rules:**\n' +
            '• Max 200 characters per addition\n' +
            '• Keep it appropriate\n' +
            '• Be creative!\n' +
            '• Have fun!'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const story = db.get('active_story', message.guild.id);

    if (action === 'start') {
      if (story) {
        return message.reply('❌ A story is already in progress!');
      }

      const title = args.slice(1).join(' ');

      if (!title) {
        return message.reply('❌ Please provide a story title!');
      }

      db.set('active_story', message.guild.id, {
        title,
        parts: [],
        startedBy: message.author.id,
        startedAt: Date.now(),
      });

      return message.reply(
        `✅ Started story: **${title}**\nAdd to it with \`//story add <text>\``
      );
    }

    if (action === 'add') {
      if (!story) {
        return message.reply(
          '❌ No story in progress! Start one with `//story start`'
        );
      }

      const text = args.slice(1).join(' ');

      if (!text) {
        return message.reply('❌ Please provide text to add!');
      }

      if (text.length > 200) {
        return message.reply('❌ Max 200 characters per addition!');
      }

      story.parts.push({
        author: message.author.id,
        text,
        timestamp: Date.now(),
      });

      db.set('active_story', message.guild.id, story);

      return message.reply(
        `✅ Added to story! (${story.parts.length} parts total)`
      );
    }

    if (action === 'view') {
      if (!story) {
        return message.reply('❌ No story in progress!');
      }

      const storyText = story.parts.map(p => p.text).join(' ');

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle(`📖 ${story.title}`)
        .setDescription(storyText || '_Story just started..._')
        .addFields({
          name: '📊 Stats',
          value:
            `**Parts:** ${story.parts.length}\n` +
            `**Started by:** <@${story.startedBy}>\n` +
            `**Started:** <t:${Math.floor(story.startedAt / 1000)}:R>`,
          inline: false,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'end') {
      if (!story) {
        return message.reply('❌ No story in progress!');
      }

      if (story.startedBy !== message.author.id) {
        return message.reply('❌ Only the story starter can end it!');
      }

      const storyText = story.parts.map(p => p.text).join(' ');

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle(`📖 ${story.title} - COMPLETE`)
        .setDescription(storyText)
        .addFields({
          name: '📊 Final Stats',
          value:
            `**Parts:** ${story.parts.length}\n` +
            `**Contributors:** ${new Set(story.parts.map(p => p.author)).size}\n` +
            `**Duration:** <t:${Math.floor(story.startedAt / 1000)}:R>`,
          inline: false,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      db.delete('active_story', message.guild.id);

      return message.reply({ embeds: [embed] });
    }
  },
};
