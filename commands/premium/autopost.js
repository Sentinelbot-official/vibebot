const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const premiumPerks = require('../../utils/premiumPerks');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'autopost',
  description: 'Schedule automatic posts (Premium only)',
  usage: '//autopost <add/remove/list> [channel] [interval] [message]',
  aliases: ['schedule', 'autoannounce'],
  category: 'premium',
  cooldown: 10,
  async execute(message, args) {
    const guildId = message.guild.id;

    // Check premium
    if (!premiumPerks.hasFeature(guildId, 'auto_posting')) {
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('❌ VIP Required')
        .setDescription(
          'This feature requires **VIP**!\n\n' +
            '**VIP Benefits:**\n' +
            '• Auto-posting system\n' +
            '• Custom commands\n' +
            '• AI chatbot\n' +
            '• All Premium features\n' +
            '• And more!\n\n' +
            'Use `//premium` to learn more!'
        )
        .setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return message.reply(
        '❌ You need the **Manage Server** permission to manage auto-posts!'
      );
    }

    const action = args[0]?.toLowerCase();

    if (!action || !['add', 'remove', 'list'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📢 Auto-Post System')
        .setDescription(
          '**Schedule automatic posts in your server!**\n\n' +
            '**Commands:**\n' +
            '`//autopost add <#channel> <interval> <message>` - Add auto-post\n' +
            '`//autopost remove <id>` - Remove auto-post\n' +
            '`//autopost list` - List all auto-posts\n\n' +
            '**Intervals:**\n' +
            '• `1h` - Every hour\n' +
            '• `6h` - Every 6 hours\n' +
            '• `12h` - Every 12 hours\n' +
            '• `24h` - Every 24 hours\n' +
            '• `7d` - Every 7 days\n\n' +
            '**Example:**\n' +
            '`//autopost add #announcements 24h Check out our rules!`'
        )
        .setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    const autoPosts = db.get('auto_posts', guildId) || [];

    if (action === 'list') {
      if (autoPosts.length === 0) {
        return message.reply('📭 No auto-posts configured!');
      }

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📢 Auto-Posts')
        .setDescription(
          autoPosts
            .map(
              (post, index) =>
                `**${index + 1}.** <#${post.channelId}>\n` +
                `**Interval:** ${post.interval}\n` +
                `**Message:** ${post.message.substring(0, 50)}${post.message.length > 50 ? '...' : ''}\n` +
                `**Next Post:** <t:${Math.floor(post.nextPost / 1000)}:R>\n`
            )
            .join('\n')
        )
        .setFooter(branding.footers.default);

      return message.reply({ embeds: [embed] });
    }

    if (action === 'remove') {
      const postId = args[1];

      if (!postId) {
        return message.reply(
          '❌ Please specify an auto-post ID!\nUse `//autopost list` to see IDs.'
        );
      }

      const index = parseInt(postId) - 1;

      if (index < 0 || index >= autoPosts.length) {
        return message.reply('❌ Invalid auto-post ID!');
      }

      const removed = autoPosts.splice(index, 1)[0];
      db.set('auto_posts', guildId, autoPosts);

      return message.reply(
        `✅ Auto-post removed from <#${removed.channelId}>!`
      );
    }
  },
};
