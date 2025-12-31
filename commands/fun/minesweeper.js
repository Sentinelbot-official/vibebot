const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'minesweeper',
  description: 'Generate a minesweeper game',
  usage: '[size] [bombs]',
  aliases: ['mine', 'mines'],
  category: 'fun',
  cooldown: 10,
  async execute(message, args) {
    const size = parseInt(args[0]) || 5;
    const bombCount = parseInt(args[1]) || Math.floor(size * size * 0.2);

    if (size < 3 || size > 8) {
      return message.reply('❌ Size must be between 3 and 8!');
    }

    if (bombCount < 1 || bombCount >= size * size) {
      return message.reply(
        `❌ Bomb count must be between 1 and ${size * size - 1}!`
      );
    }

    // Create grid
    const grid = Array(size)
      .fill(0)
      .map(() => Array(size).fill(0));

    // Place bombs
    let bombsPlaced = 0;
    while (bombsPlaced < bombCount) {
      const x = Math.floor(Math.random() * size);
      const y = Math.floor(Math.random() * size);

      if (grid[y][x] !== -1) {
        grid[y][x] = -1;
        bombsPlaced++;
      }
    }

    // Calculate numbers
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] === -1) continue;

        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy;
            const nx = x + dx;

            if (
              ny >= 0 &&
              ny < size &&
              nx >= 0 &&
              nx < size &&
              grid[ny][nx] === -1
            ) {
              count++;
            }
          }
        }

        grid[y][x] = count;
      }
    }

    // Convert to Discord spoilers
    const emojis = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
    const bombEmoji = '💣';

    let gameBoard = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = grid[y][x];
        const emoji = cell === -1 ? bombEmoji : emojis[cell];
        gameBoard += `||${emoji}|| `;
      }
      gameBoard += '\n';
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('💣 Minesweeper')
      .setDescription(
        `**Size:** ${size}x${size}\n` +
          `**Bombs:** ${bombCount}\n\n` +
          `Click the spoilers to reveal!\n\n${gameBoard}`
      )
      .setFooter({ text: `Started by ${message.author.tag}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
