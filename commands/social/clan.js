const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'clan',
  description: 'Create and manage clans/teams',
  usage: '<create/join/leave/list/info/invite/kick> [name/@user]',
  aliases: ['team', 'guild'],
  category: 'social',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (action === 'create') {
      const name = args.slice(1).join(' ');

      if (!name) {
        return message.reply(
          '❌ Please provide a clan name!\nUsage: `clan create <name>`\nExample: `clan create Elite Warriors`'
        );
      }

      if (name.length > 32) {
        return message.reply('❌ Clan name must be 32 characters or less!');
      }

      // Check if user is already in a clan
      const userClan = db.get('user_clans', message.author.id);
      if (userClan) {
        return message.reply(
          `❌ You're already in clan **${userClan.name}**! Leave it first with \`clan leave\``
        );
      }

      const clans = db.get('clans', message.guild.id) || { clans: {} };

      // Check if clan name exists
      if (Object.values(clans.clans).some(c => c.name.toLowerCase() === name.toLowerCase())) {
        return message.reply('❌ A clan with that name already exists!');
      }

      const clanId = `${message.guild.id}-${Date.now()}`;
      clans.clans[clanId] = {
        id: clanId,
        name,
        leader: message.author.id,
        members: [message.author.id],
        createdAt: Date.now(),
        level: 1,
        xp: 0,
      };

      db.set('clans', message.guild.id, clans);
      db.set('user_clans', message.author.id, { clanId, name });

      return message.reply(
        `✅ Clan **${name}** created!\nYou are the clan leader. Use \`clan invite @user\` to invite members.`
      );
    }

    if (action === 'list') {
      const clans = db.get('clans', message.guild.id) || { clans: {} };
      const clanList = Object.values(clans.clans);

      if (!clanList.length) {
        return message.reply('❌ No clans in this server yet!');
      }

      const list = clanList
        .sort((a, b) => b.members.length - a.members.length)
        .map(
          (c, i) =>
            `**${i + 1}. ${c.name}** (Level ${c.level})\n` +
            `👥 ${c.members.length} members | 👑 <@${c.leader}>`
        )
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('🛡️ Server Clans')
        .setDescription(list)
        .setFooter({ text: `Total: ${clanList.length} clans` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'info') {
      const userClan = db.get('user_clans', message.author.id);

      if (!userClan) {
        return message.reply(
          '❌ You are not in a clan! Use `clan list` to see available clans.'
        );
      }

      const clans = db.get('clans', message.guild.id) || { clans: {} };
      const clan = clans.clans[userClan.clanId];

      if (!clan) {
        return message.reply('❌ Clan not found!');
      }

      const memberList = clan.members.map(id => `<@${id}>`).join(', ');

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`🛡️ ${clan.name}`)
        .addFields(
          { name: '👑 Leader', value: `<@${clan.leader}>`, inline: true },
          { name: '📊 Level', value: clan.level.toString(), inline: true },
          { name: '⭐ XP', value: clan.xp.toString(), inline: true },
          { name: '👥 Members', value: memberList, inline: false },
          {
            name: '📅 Created',
            value: `<t:${Math.floor(clan.createdAt / 1000)}:R>`,
            inline: true,
          }
        )
        .setFooter({ text: `Clan ID: ${clan.id}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'invite') {
      const target = message.mentions.users.first();

      if (!target) {
        return message.reply(
          '❌ Please mention a user!\nUsage: `clan invite @user`'
        );
      }

      if (target.bot) {
        return message.reply('❌ You cannot invite bots!');
      }

      const userClan = db.get('user_clans', message.author.id);

      if (!userClan) {
        return message.reply('❌ You are not in a clan!');
      }

      const clans = db.get('clans', message.guild.id) || { clans: {} };
      const clan = clans.clans[userClan.clanId];

      if (clan.leader !== message.author.id) {
        return message.reply('❌ Only the clan leader can invite members!');
      }

      const targetClan = db.get('user_clans', target.id);
      if (targetClan) {
        return message.reply(`❌ ${target.username} is already in a clan!`);
      }

      if (clan.members.length >= 20) {
        return message.reply('❌ Clan is full! (Max 20 members)');
      }

      clan.members.push(target.id);
      db.set('clans', message.guild.id, clans);
      db.set('user_clans', target.id, { clanId: clan.id, name: clan.name });

      return message.reply(
        `✅ ${target} has been added to **${clan.name}**!`
      );
    }

    if (action === 'leave') {
      const userClan = db.get('user_clans', message.author.id);

      if (!userClan) {
        return message.reply('❌ You are not in a clan!');
      }

      const clans = db.get('clans', message.guild.id) || { clans: {} };
      const clan = clans.clans[userClan.clanId];

      if (clan.leader === message.author.id) {
        return message.reply(
          '❌ You are the clan leader! Transfer leadership or disband the clan first.'
        );
      }

      const index = clan.members.indexOf(message.author.id);
      if (index > -1) {
        clan.members.splice(index, 1);
      }

      db.set('clans', message.guild.id, clans);
      db.delete('user_clans', message.author.id);

      return message.reply(`✅ You left **${clan.name}**!`);
    }

    if (action === 'kick') {
      const target = message.mentions.users.first();

      if (!target) {
        return message.reply(
          '❌ Please mention a user!\nUsage: `clan kick @user`'
        );
      }

      const userClan = db.get('user_clans', message.author.id);

      if (!userClan) {
        return message.reply('❌ You are not in a clan!');
      }

      const clans = db.get('clans', message.guild.id) || { clans: {} };
      const clan = clans.clans[userClan.clanId];

      if (clan.leader !== message.author.id) {
        return message.reply('❌ Only the clan leader can kick members!');
      }

      if (target.id === clan.leader) {
        return message.reply('❌ You cannot kick yourself!');
      }

      const index = clan.members.indexOf(target.id);
      if (index === -1) {
        return message.reply('❌ That user is not in your clan!');
      }

      clan.members.splice(index, 1);
      db.set('clans', message.guild.id, clans);
      db.delete('user_clans', target.id);

      return message.reply(`✅ Kicked ${target.username} from **${clan.name}**!`);
    }

    return message.reply(
      '❌ Invalid action!\nUsage: `clan <create/join/leave/list/info/invite/kick>`\n\n' +
        '**Examples:**\n' +
        '`clan create Elite Warriors` - Create a clan\n' +
        '`clan list` - View all clans\n' +
        '`clan info` - View your clan info\n' +
        '`clan invite @user` - Invite to clan (Leader only)\n' +
        '`clan kick @user` - Kick from clan (Leader only)\n' +
        '`clan leave` - Leave your clan'
    );
  },
};
