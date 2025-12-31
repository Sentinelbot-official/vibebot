const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');

const games = new Map();

function createBoard() {
  const board = Array(4)
    .fill(null)
    .map(() => Array(4).fill(0));
  addNewTile(board);
  addNewTile(board);
  return board;
}

function addNewTile(board) {
  const empty = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === 0) empty.push([i, j]);
    }
  }
  if (empty.length > 0) {
    const [i, j] = empty[Math.floor(Math.random() * empty.length)];
    board[i][j] = Math.random() < 0.9 ? 2 : 4;
  }
}

function move(board, direction) {
  const newBoard = board.map(row => [...row]);
  let moved = false;

  if (direction === 'up' || direction === 'down') {
    for (let j = 0; j < 4; j++) {
      const column = [];
      for (let i = 0; i < 4; i++) {
        column.push(newBoard[i][j]);
      }
      const newColumn =
        direction === 'up' ? slide(column) : slide(column.reverse()).reverse();
      for (let i = 0; i < 4; i++) {
        if (newBoard[i][j] !== newColumn[i]) moved = true;
        newBoard[i][j] = newColumn[i];
      }
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const row = newBoard[i];
      const newRow =
        direction === 'left' ? slide(row) : slide(row.reverse()).reverse();
      if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
      newBoard[i] = newRow;
    }
  }

  return { board: newBoard, moved };
}

function slide(line) {
  const filtered = line.filter(x => x !== 0);
  const merged = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      i += 2;
    } else {
      merged.push(filtered[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(0);
  return merged;
}

function boardToString(board) {
  const tileEmojis = {
    0: '⬜',
    2: '2️⃣',
    4: '4️⃣',
    8: '8️⃣',
    16: '🔢',
    32: '💠',
    64: '💎',
    128: '🌟',
    256: '⭐',
    512: '✨',
    1024: '🏆',
    2048: '👑',
  };
  return board
    .map(row => row.map(cell => tileEmojis[cell] || '🎯').join(''))
    .join('\n');
}

function getScore(board) {
  return board.flat().reduce((sum, val) => sum + val, 0);
}

function isGameOver(board) {
  // Check for empty cells
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (board[i][j] === 0) return false;
    }
  }
  // Check for possible merges
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      if (j < 3 && board[i][j] === board[i][j + 1]) return false;
      if (i < 3 && board[i][j] === board[i + 1][j]) return false;
    }
  }
  return true;
}

module.exports = {
  name: '2048',
  description: 'Play 2048 game',
  usage: '',
  category: 'fun',
  cooldown: 3,
  async execute(message, args) {
    const board = createBoard();
    const gameId = `${message.author.id}-${Date.now()}`;
    games.set(gameId, { board, userId: message.author.id });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`2048_up_${gameId}`)
        .setLabel('⬆️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`2048_down_${gameId}`)
        .setLabel('⬇️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`2048_left_${gameId}`)
        .setLabel('⬅️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`2048_right_${gameId}`)
        .setLabel('➡️')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`2048_quit_${gameId}`)
        .setLabel('Quit')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(branding.colors.premium)
      .setTitle('🎮 2048 Game')
      .setDescription(boardToString(board))
      .addFields({
        name: 'Score',
        value: getScore(board).toString(),
        inline: true,
      })
      .setFooter(branding.footers.default)
      .setTimestamp();

    const msg = await message.reply({ embeds: [embed], components: [buttons] });

    const collector = msg.createMessageComponentCollector({ time: 300000 });

    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) {
        return i.reply({
          content: '❌ This is not your game!',
          flags: MessageFlags.Ephemeral,
        });
      }

      const [, direction, id] = i.customId.split('_');

      if (direction === 'quit') {
        games.delete(gameId);
        collector.stop();
        return i.update({
          content: '❌ Game ended!',
          embeds: [],
          components: [],
        });
      }

      const game = games.get(id);
      if (!game) {
        return i.reply({
          content: '❌ Game expired!',
          flags: MessageFlags.Ephemeral,
        });
      }

      const { board: newBoard, moved } = move(game.board, direction);

      if (!moved) {
        return i.reply({
          content: '❌ Invalid move!',
          flags: MessageFlags.Ephemeral,
        });
      }

      addNewTile(newBoard);
      game.board = newBoard;

      const score = getScore(newBoard);
      const hasWon = newBoard.flat().includes(2048);
      const gameOver = isGameOver(newBoard);

      const newEmbed = new EmbedBuilder()
        .setColor(hasWon ? 0x00ff00 : gameOver ? 0xff0000 : 0xffd700)
        .setTitle(
          hasWon ? '🏆 You Won!' : gameOver ? '💀 Game Over!' : '🎮 2048 Game'
        )
        .setDescription(boardToString(newBoard))
        .addFields({ name: 'Score', value: score.toString(), inline: true })
        .setFooter({
          text:
            hasWon || gameOver
              ? 'Game ended!'
              : 'Use the buttons to move tiles!',
        })
        .setTimestamp();

      if (hasWon || gameOver) {
        games.delete(gameId);
        collector.stop();
        return i.update({ embeds: [newEmbed], components: [] });
      }

      await i.update({ embeds: [newEmbed] });
    });

    collector.on('end', () => {
      games.delete(gameId);
    });
  },
};
