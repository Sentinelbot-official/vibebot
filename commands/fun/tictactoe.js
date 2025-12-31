const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType,
} = require('discord.js');

module.exports = {
  name: 'tictactoe',
  description: 'Play tic-tac-toe with another user',
  usage: '<@user>',
  aliases: ['ttt', 'xo'],
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
    const board = Array(9).fill(null);
    let currentPlayer = message.author.id;
    const players = {
      [message.author.id]: '❌',
      [opponent.id]: '⭕',
    };

    const createBoard = () => {
      const rows = [];
      for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
          const index = i * 3 + j;
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`ttt_${index}`)
              .setLabel(board[index] || '⬜')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(board[index] !== null)
          );
        }
        rows.push(row);
      }
      return rows;
    };

    const checkWin = () => {
      const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // Rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // Columns
        [0, 4, 8],
        [2, 4, 6], // Diagonals
      ];

      for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a];
        }
      }

      return board.every(cell => cell !== null) ? 'draw' : null;
    };

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('⭕ Tic-Tac-Toe ❌')
      .setDescription(
        `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n` +
          `Current turn: <@${currentPlayer}>`
      )
      .setTimestamp();

    const gameMessage = await message.reply({
      embeds: [embed],
      components: createBoard(),
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

      const index = parseInt(interaction.customId.split('_')[1]);
      board[index] = players[currentPlayer];

      const result = checkWin();

      if (result) {
        collector.stop();

        let resultText;
        if (result === 'draw') {
          embed.setDescription(
            `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n` +
              '**Game Over: Draw!** 🤝'
          );
          embed.setColor(0xffa500);
        } else {
          const winnerId =
            result === players[message.author.id]
              ? message.author.id
              : opponent.id;
          embed.setDescription(
            `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n` +
              `**Winner: <@${winnerId}>!** 🎉`
          );
          embed.setColor(0x00ff00);
        }

        // Disable all buttons
        const disabledRows = [];
        for (let i = 0; i < 3; i++) {
          const row = new ActionRowBuilder();
          for (let j = 0; j < 3; j++) {
            const idx = i * 3 + j;
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`ttt_${idx}_disabled`)
                .setLabel(board[idx] || '⬜')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );
          }
          disabledRows.push(row);
        }

        await interaction.update({
          embeds: [embed],
          components: disabledRows,
        });
      } else {
        // Switch player
        currentPlayer =
          currentPlayer === message.author.id ? opponent.id : message.author.id;

        embed.setDescription(
          `${players[message.author.id]} ${message.author.username} vs ${players[opponent.id]} ${opponent.username}\n\n` +
            `Current turn: <@${currentPlayer}>`
        );

        await interaction.update({
          embeds: [embed],
          components: createBoard(),
        });
      }
    });

    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        embed.setDescription('⏱️ Game timed out!');
        embed.setColor(0xff0000);
        gameMessage.edit({ embeds: [embed], components: [] });
      }
    });
  },
};
