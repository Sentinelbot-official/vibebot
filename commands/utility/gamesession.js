const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

module.exports = {
  name: 'gamesession',
  aliases: ['gaming', 'playnow', 'lfg'],
  description: 'Start or join a gaming session',
  usage: '<start/join/end/list> [game] [@users]',
  category: 'utility',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action || !['start', 'join', 'end', 'list'].includes(action)) {
      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎮 Gaming Sessions')
        .setDescription(
          '**Organize gaming sessions with your friends!**\n\n' +
            '**Commands:**\n' +
            '`//gamesession start <game>` - Start a gaming session\n' +
            '`//gamesession join <session_id>` - Join a session\n' +
            '`//gamesession end` - End your current session\n' +
            '`//gamesession list` - View active sessions\n\n' +
            '**Examples:**\n' +
            '`//gamesession start Valorant`\n' +
            '`//gamesession start League of Legends @friend1 @friend2`'
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    const sessions = db.get('game_sessions', message.guild.id) || {};

    if (action === 'start') {
      const game = args
        .slice(1)
        .filter(arg => !arg.startsWith('<@'))
        .join(' ');

      if (!game) {
        return message.reply(
          '❌ Please specify a game!\nExample: `//gamesession start Valorant`'
        );
      }

      // Check if user already has an active session
      const existingSession = Object.values(sessions).find(
        s => s.host === message.author.id && s.active
      );

      if (existingSession) {
        return message.reply(
          `❌ You already have an active session for **${existingSession.game}**!\n` +
            `Use \`//gamesession end\` to close it first.`
        );
      }

      const sessionId = Date.now().toString();
      const invitedUsers = message.mentions.users.map(u => u.id);

      sessions[sessionId] = {
        id: sessionId,
        host: message.author.id,
        hostTag: message.author.tag,
        game,
        players: [message.author.id],
        invited: invitedUsers,
        startedAt: Date.now(),
        active: true,
        voiceChannel: message.member.voice.channel?.id || null,
      };

      db.set('game_sessions', message.guild.id, sessions);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle(`🎮 Gaming Session Started!`)
        .setDescription(
          `**Game:** ${game}\n` +
            `**Host:** ${message.author}\n` +
            `**Session ID:** \`${sessionId}\`\n` +
            `**Players:** ${sessions[sessionId].players.length}/∞\n` +
            (sessions[sessionId].voiceChannel
              ? `**Voice:** <#${sessions[sessionId].voiceChannel}>\n`
              : '') +
            `\n**Join:** \`//gamesession join ${sessionId}\``
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      // Notify invited users
      if (invitedUsers.length > 0) {
        const inviteText = invitedUsers.map(id => `<@${id}>`).join(', ');
        await message.channel.send(
          `${inviteText} You've been invited to join **${game}**! Use \`//gamesession join ${sessionId}\``
        );
      }

      return;
    }

    if (action === 'join') {
      const sessionId = args[1];

      if (!sessionId) {
        return message.reply(
          '❌ Please provide a session ID!\nExample: `//gamesession join 1234567890`'
        );
      }

      const session = sessions[sessionId];

      if (!session || !session.active) {
        return message.reply('❌ Session not found or has ended!');
      }

      if (session.players.includes(message.author.id)) {
        return message.reply('❌ You are already in this session!');
      }

      session.players.push(message.author.id);
      db.set('game_sessions', message.guild.id, sessions);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.success)
        .setTitle(`✅ Joined Gaming Session!`)
        .setDescription(
          `**Game:** ${session.game}\n` +
            `**Host:** <@${session.host}>\n` +
            `**Players:** ${session.players.length}/∞\n` +
            (session.voiceChannel
              ? `**Voice:** <#${session.voiceChannel}>`
              : '')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      // Notify host
      const host = await message.client.users.fetch(session.host);
      if (host) {
        try {
          await host.send(
            `🎮 **${message.author.tag}** joined your **${session.game}** session!`
          );
        } catch {}
      }

      return;
    }

    if (action === 'end') {
      const userSession = Object.values(sessions).find(
        s => s.host === message.author.id && s.active
      );

      if (!userSession) {
        return message.reply("❌ You don't have an active gaming session!");
      }

      userSession.active = false;
      userSession.endedAt = Date.now();
      db.set('game_sessions', message.guild.id, sessions);

      const duration = Math.floor((Date.now() - userSession.startedAt) / 1000);
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);

      const embed = new EmbedBuilder()
        .setColor(branding.colors.warning)
        .setTitle('🏁 Gaming Session Ended')
        .setDescription(
          `**Game:** ${userSession.game}\n` +
            `**Duration:** ${hours}h ${minutes}m\n` +
            `**Total Players:** ${userSession.players.length}\n` +
            `**Started:** <t:${Math.floor(userSession.startedAt / 1000)}:R>`
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'list') {
      const activeSessions = Object.values(sessions).filter(s => s.active);

      if (activeSessions.length === 0) {
        return message.reply('📭 No active gaming sessions right now!');
      }

      const embed = new EmbedBuilder()
        .setColor(branding.colors.primary)
        .setTitle('🎮 Active Gaming Sessions')
        .setDescription(
          activeSessions
            .map(session => {
              const playerList = session.players
                .slice(0, 5)
                .map(id => `<@${id}>`)
                .join(', ');
              const moreText =
                session.players.length > 5
                  ? ` +${session.players.length - 5} more`
                  : '';

              return (
                `**${session.game}**\n` +
                `Host: <@${session.host}>\n` +
                `Players (${session.players.length}): ${playerList}${moreText}\n` +
                (session.voiceChannel
                  ? `Voice: <#${session.voiceChannel}>\n`
                  : '') +
                `Started: <t:${Math.floor(session.startedAt / 1000)}:R>\n` +
                `Join: \`//gamesession join ${session.id}\``
              );
            })
            .join('\n\n')
        )
        .setFooter(branding.footers.default)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }
  },
};
