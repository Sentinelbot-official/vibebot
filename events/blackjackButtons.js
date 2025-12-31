const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');

const activeGames = new Map();

function cardValue(card) {
  if (card.value === 'A') return 11;
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  return parseInt(card.value);
}

function handValue(hand) {
  let value = hand.reduce((sum, card) => sum + cardValue(card), 0);
  let aces = hand.filter(card => card.value === 'A').length;

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

function displayCard(card) {
  return `${card.value}${card.suit}`;
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    if (customId.startsWith('bj_')) {
      const [, action, userId] = customId.split('_');

      if (userId !== interaction.user.id) {
        return interaction.reply({
          content: '❌ This is not your game!',
          ephemeral: true,
        });
      }

      // Get game from the command file's Map (we need to share this)
      const gameState = require('../commands/fun/blackjack').activeGames?.get(
        userId
      );

      if (!gameState) {
        return interaction.reply({
          content: '❌ Game not found or expired!',
          ephemeral: true,
        });
      }

      await interaction.deferUpdate();

      if (action === 'hit') {
        gameState.playerHand.push(gameState.deck.pop());
        const playerValue = handValue(gameState.playerHand);

        if (playerValue > 21) {
          // Bust
          const economy = db.get('economy', userId) || { coins: 0, bank: 0 };
          economy.coins -= gameState.bet;
          db.set('economy', userId, economy);

          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🃏 Blackjack - BUST!')
            .setDescription('You busted! Dealer wins.')
            .addFields(
              {
                name: 'Your Hand',
                value: `${gameState.playerHand.map(displayCard).join(' ')} (${playerValue})`,
                inline: false,
              },
              {
                name: 'Dealer Hand',
                value: `${gameState.dealerHand.map(displayCard).join(' ')} (${handValue(gameState.dealerHand)})`,
                inline: false,
              },
              {
                name: 'Lost',
                value: `${gameState.bet.toLocaleString()} coins`,
                inline: true,
              },
              {
                name: 'New Balance',
                value: `${economy.coins.toLocaleString()} coins`,
                inline: true,
              }
            );

          require('../commands/fun/blackjack').activeGames?.delete(userId);
          return interaction.editReply({ embeds: [embed], components: [] });
        }

        // Update embed
        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('🃏 Blackjack')
          .addFields(
            {
              name: 'Your Hand',
              value: `${gameState.playerHand.map(displayCard).join(' ')} (${playerValue})`,
              inline: false,
            },
            {
              name: 'Dealer Hand',
              value: `${displayCard(gameState.dealerHand[0])} 🂠`,
              inline: false,
            },
            {
              name: 'Bet',
              value: `${gameState.bet.toLocaleString()} coins`,
              inline: true,
            }
          );

        await interaction.editReply({ embeds: [embed] });
      }

      if (action === 'stand') {
        // Dealer's turn
        while (handValue(gameState.dealerHand) < 17) {
          gameState.dealerHand.push(gameState.deck.pop());
        }

        const playerValue = handValue(gameState.playerHand);
        const dealerValue = handValue(gameState.dealerHand);

        const economy = db.get('economy', userId) || { coins: 0, bank: 0 };
        let result;
        let color;

        if (dealerValue > 21 || playerValue > dealerValue) {
          result = 'You win!';
          color = 0x00ff00;
          economy.coins += gameState.bet;
        } else if (playerValue < dealerValue) {
          result = 'Dealer wins!';
          color = 0xff0000;
          economy.coins -= gameState.bet;
        } else {
          result = 'Push! (Tie)';
          color = 0xffff00;
        }

        db.set('economy', userId, economy);

        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`🃏 Blackjack - ${result}`)
          .addFields(
            {
              name: 'Your Hand',
              value: `${gameState.playerHand.map(displayCard).join(' ')} (${playerValue})`,
              inline: false,
            },
            {
              name: 'Dealer Hand',
              value: `${gameState.dealerHand.map(displayCard).join(' ')} (${dealerValue})`,
              inline: false,
            },
            {
              name: 'Result',
              value: result.includes('win')
                ? `+${gameState.bet.toLocaleString()} coins`
                : result.includes('Dealer')
                  ? `-${gameState.bet.toLocaleString()} coins`
                  : 'No change',
              inline: true,
            },
            {
              name: 'New Balance',
              value: `${economy.coins.toLocaleString()} coins`,
              inline: true,
            }
          );

        require('../commands/fun/blackjack').activeGames?.delete(userId);
        await interaction.editReply({ embeds: [embed], components: [] });
      }
    }
  },
};
