const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'guild',
  aliases: ['clan', 'guildeconomy'],
  description: 'Guild/clan shared economy system',
  usage: '<create/join/leave/deposit/withdraw/info>',
  category: 'economy',
  cooldown: 10,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (
      !action ||
      ![
        'create',
        'join',
        'leave',
        'deposit',
        'withdraw',
        'info',
        'list',
      ].includes(action)
    ) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('⚔️ Guild Economy')
        .setDescription(
          '**Create or join guilds with shared treasuries!**\n\n' +
            '**Commands:**\n' +
            '`//guild create <name>` - Create guild (10,000 coins)\n' +
            '`//guild list` - View all guilds\n' +
            '`//guild join <guild_id>` - Join a guild\n' +
            '`//guild leave` - Leave your guild\n' +
            '`//guild deposit <amount>` - Add to treasury\n' +
            '`//guild withdraw <amount>` - Withdraw (leaders only)\n' +
            '`//guild info` - View guild stats'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'create') {
      const guildName = args.slice(1).join(' ');

      if (!guildName) {
        return message.reply('❌ Please provide a guild name!');
      }

      const userGuild = db.get('user_guilds', message.author.id);

      if (userGuild) {
        return message.reply('❌ You are already in a guild!');
      }

      const userData = db.get('users', message.author.id) || { wallet: 0 };

      if (userData.wallet < 10000) {
        return message.reply('❌ You need **10,000** coins to create a guild!');
      }

      userData.wallet -= 10000;
      db.set('users', message.author.id, userData);

      const guildId = Date.now().toString();
      const guilds = db.get('guilds', message.guild.id) || {};

      guilds[guildId] = {
        id: guildId,
        name: guildName,
        leader: message.author.id,
        members: [message.author.id],
        treasury: 0,
        createdAt: Date.now(),
      };

      db.set('guilds', message.guild.id, guilds);
      db.set('user_guilds', message.author.id, guildId);

      return message.reply(
        `✅ Guild **${guildName}** created!\nGuild ID: \`${guildId}\``
      );
    }

    if (action === 'list') {
      const guilds = db.get('guilds', message.guild.id) || {};
      const guildList = Object.values(guilds);

      if (guildList.length === 0) {
        return message.reply('📭 No guilds exist yet!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle('⚔️ Server Guilds')
        .setDescription(
          guildList
            .slice(0, 10)
            .map(
              (g, i) =>
                `**${i + 1}. ${g.name}**\n` +
                `👑 Leader: <@${g.leader}>\n` +
                `👥 Members: ${g.members.length}\n` +
                `💰 Treasury: ${branding.formatNumber(g.treasury)}\n` +
                `🆔 ID: \`${g.id}\``
            )
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'join') {
      const guildId = args[1];

      if (!guildId) {
        return message.reply('❌ Please provide a guild ID!');
      }

      const userGuild = db.get('user_guilds', message.author.id);

      if (userGuild) {
        return message.reply('❌ You are already in a guild!');
      }

      const guilds = db.get('guilds', message.guild.id) || {};
      const guild = guilds[guildId];

      if (!guild) {
        return message.reply('❌ Guild not found!');
      }

      guild.members.push(message.author.id);
      db.set('guilds', message.guild.id, guilds);
      db.set('user_guilds', message.author.id, guildId);

      return message.reply(`✅ Joined **${guild.name}**!`);
    }

    if (action === 'leave') {
      const userGuildId = db.get('user_guilds', message.author.id);

      if (!userGuildId) {
        return message.reply('❌ You are not in a guild!');
      }

      const guilds = db.get('guilds', message.guild.id) || {};
      const guild = guilds[userGuildId];

      if (guild.leader === message.author.id) {
        return message.reply(
          '❌ Guild leaders cannot leave! Transfer leadership or disband the guild first.'
        );
      }

      guild.members = guild.members.filter(id => id !== message.author.id);
      db.set('guilds', message.guild.id, guilds);
      db.delete('user_guilds', message.author.id);

      return message.reply(`✅ Left **${guild.name}**!`);
    }

    if (action === 'deposit') {
      const amount = parseInt(args[1]);

      if (isNaN(amount) || amount < 1) {
        return message.reply('❌ Please provide a valid amount!');
      }

      const userGuildId = db.get('user_guilds', message.author.id);

      if (!userGuildId) {
        return message.reply('❌ You are not in a guild!');
      }

      const userData = db.get('users', message.author.id) || { wallet: 0 };

      if (userData.wallet < amount) {
        return message.reply("❌ You don't have enough coins!");
      }

      userData.wallet -= amount;
      db.set('users', message.author.id, userData);

      const guilds = db.get('guilds', message.guild.id) || {};
      const guild = guilds[userGuildId];

      guild.treasury += amount;
      db.set('guilds', message.guild.id, guilds);

      return message.reply(
        `✅ Deposited **${branding.formatNumber(amount)}** coins to **${guild.name}** treasury!`
      );
    }

    if (action === 'withdraw') {
      const amount = parseInt(args[1]);

      if (isNaN(amount) || amount < 1) {
        return message.reply('❌ Please provide a valid amount!');
      }

      const userGuildId = db.get('user_guilds', message.author.id);

      if (!userGuildId) {
        return message.reply('❌ You are not in a guild!');
      }

      const guilds = db.get('guilds', message.guild.id) || {};
      const guild = guilds[userGuildId];

      if (guild.leader !== message.author.id) {
        return message.reply('❌ Only the guild leader can withdraw funds!');
      }

      if (guild.treasury < amount) {
        return message.reply("❌ Guild doesn't have enough in treasury!");
      }

      guild.treasury -= amount;
      db.set('guilds', message.guild.id, guilds);

      const userData = db.get('users', message.author.id) || { wallet: 0 };
      userData.wallet += amount;
      db.set('users', message.author.id, userData);

      return message.reply(
        `✅ Withdrew **${branding.formatNumber(amount)}** coins from guild treasury!`
      );
    }

    if (action === 'info') {
      const userGuildId = db.get('user_guilds', message.author.id);

      if (!userGuildId) {
        return message.reply('❌ You are not in a guild!');
      }

      const guilds = db.get('guilds', message.guild.id) || {};
      const guild = guilds[userGuildId];

      const embed = new EmbedBuilder()
        .setColor(branding.colors.economy)
        .setTitle(`⚔️ ${guild.name}`)
        .setDescription(
          `**Guild Information**\n\n` +
            `👑 **Leader:** <@${guild.leader}>\n` +
            `👥 **Members:** ${guild.members.length}\n` +
            `💰 **Treasury:** ${branding.formatNumber(guild.treasury)} coins\n` +
            `📅 **Created:** <t:${Math.floor(guild.createdAt / 1000)}:R>`
        )
        .addFields({
          name: '👥 Members',
          value:
            guild.members.length > 0
              ? guild.members.map(id => `<@${id}>`).join(', ')
              : 'No members',
          inline: false,
        })
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
