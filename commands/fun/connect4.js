const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} = require('discord.js');

module.exports = {
  name: 'connect4',
  description: 'Play Connect 4 with another user',
  usage: '<@user>',
  aliases: ['c4', 'connectfour'],
  category: 'fun',
  cooldown: 5,
  guildOnly: true,
  async execute(message, args) {
    const opponent =
      message.mentions.users.first() ||
      (await message.client.users.fetch(args[0]).catch(() => null));

    if (!opponent) {
      return message.reply('❌ Please mention a user to play with!');
    }

    if (opponent.bot) {
      return message.reply('❌ You cannot play with bots!');
    }

    if (opponent.id === message.author.id) {
      return message.reply('❌ You cannot play with yourself!');
    }

    // Game state
    const rows = 6;
    const cols = 7;
    const board = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(null));
    let currentPlayer = message.author.id;
    const players = {
      [message.author.id]: '🔴',
      [opponent.id]: '🟡',
    };

    const createButtons = () => {
      const row = new ActionRowBuilder();
      for (let i = 0; i < cols; i++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`c4_${i}`)
            .setLabel(`${i + 1}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
      return [row];
    };

    const renderBoard = () => {
      let boardStr = '';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          boardStr += board[r][c] || '⚪';
        }
        boardStr += '\n';
      }
      return boardStr;
    };

    const dropPiece = col => {
      for (let r = rows - 1; r >= 0; r--) {
        if (!board[r][col]) {
          board[r][col] = players[currentPlayer];
          return r;
        }
      }
      return -1; // Column full
    };

    const checkWin = (row, col) => {
      const piece = board[row][col];
      const directions = [
        [0, 1], // Horizontal
        [1, 0], // Vertical
        [1, 1], // Diagonal \
        [1, -1], // Diagonal /
      ];

      for (const [dr, dc] of directions) {
        let count = 1;

        // Check positive direction
        for (let i = 1; i < 4; i++) {
          const r = row + dr * i;
          const c = col + dc * i;
          if (
            r >= 0 &&
            r < rows &&
            c >= 0 &&
            c < cols &&
            board[r][c] === piece
          ) {
            count++;
          } else {
            break;
          }
        }

        // Check negative direction
        for (let i = 1; i < 4; i++) {
          const r = row - dr * i;
          const c = col - dc * i;
          if (
            r >= 0 &&
            r < rows &&
            c >= 0 &&
            c < cols &&
            board[r][c] === piece
          ) {
            count++;
          } else {
            break;
          }
        }

        if (count >= 4) return true;
      }

      return false;
    };

    const checkDraw = () => {
      return board[0].every(cell => cell !== null);
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('🔴 Connect 4 🟡')
      .setDescription(
        `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n${renderBoard()}\nCurrent turn: <@${currentPlayer}>`
      )
      .setTimestamp();

    const gameMessage = await message.reply({
      embeds: [embed],
      components: createButtons(),
    });

    const collector = gameMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000, // 5 minutes
    });

    collector.on('collect', async interaction => {
      if (interaction.user.id !== currentPlayer) {
        return interaction.reply({
          content: "❌ It's not your turn!",
          flags: MessageFlags.Ephemeral,
        });
      }

      const col = parseInt(interaction.customId.split('_')[1]);
      const row = dropPiece(col);

      if (row === -1) {
        return interaction.reply({
          content: '❌ That column is full!',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (checkWin(row, col)) {
        collector.stop();

        embed.setDescription(
          `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n${renderBoard()}\n\n**Winner: <@${currentPlayer}>!** 🎉`
        );
        embed.setColor(0x00ff00);

        await interaction.update({
          embeds: [embed],
          components: [],
        });
      } else if (checkDraw()) {
        collector.stop();

        embed.setDescription(
          `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n${renderBoard()}\n\n**Game Over: Draw!** 🤝`
        );
        embed.setColor(0xffa500);

        await interaction.update({
          embeds: [embed],
          components: [],
        });
      } else {
        // Switch player
        currentPlayer =
          currentPlayer === message.author.id ? opponent.id : message.author.id;

        embed.setDescription(
          `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n${renderBoard()}\nCurrent turn: <@${currentPlayer}>`
        );

        await interaction.update({
          embeds: [embed],
          components: createButtons(),
        });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        embed.setDescription(`${renderBoard()}\n\n⏱️ Game timed out!`);
        embed.setColor(0xff0000);
        gameMessage.edit({ embeds: [embed], components: [] });
      }
    });
  },
};
