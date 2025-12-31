const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const db = require('../../utils/database');

const games = new Map();

const suits = ['♠️', '♥️', '♦️', '♣️'];
const ranks = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
];

function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit, value: ranks.indexOf(rank) + 2 });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function dealCards(deck, count) {
  return deck.splice(0, count);
}

function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

function evaluateHand(hand) {
  // Simplified poker hand evaluation
  const values = hand.map(c => c.value).sort((a, b) => b - a);
  const suits = hand.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isStraight =
    values.every((v, i) => i === 0 || v === values[i - 1] - 1) ||
    (values[0] === 14 && values[4] === 2); // Ace-low straight

  // Check for pairs, three of a kind, etc.
  const counts = {};
  values.forEach(v => (counts[v] = (counts[v] || 0) + 1));
  const groups = Object.values(counts).sort((a, b) => b - a);

  if (isStraight && isFlush) return { rank: 8, name: 'Straight Flush' };
  if (groups[0] === 4) return { rank: 7, name: 'Four of a Kind' };
  if (groups[0] === 3 && groups[1] === 2)
    return { rank: 6, name: 'Full House' };
  if (isFlush) return { rank: 5, name: 'Flush' };
  if (isStraight) return { rank: 4, name: 'Straight' };
  if (groups[0] === 3) return { rank: 3, name: 'Three of a Kind' };
  if (groups[0] === 2 && groups[1] === 2) return { rank: 2, name: 'Two Pair' };
  if (groups[0] === 2) return { rank: 1, name: 'Pair' };
  return { rank: 0, name: 'High Card' };
}

module.exports = {
  name: 'poker',
  description: 'Play 5-card draw poker',
  usage: '<bet amount>',
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a bet amount!\nUsage: `poker <amount>`\nExample: `poker 100`'
      );
    }

    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    let betAmount;
    if (args[0].toLowerCase() === 'all') {
      betAmount = economy.coins;
    } else {
      betAmount = parseInt(args[0]);
    }

    if (isNaN(betAmount) || betAmount <= 0) {
      return message.reply('❌ Please provide a valid bet amount!');
    }

    if (betAmount > economy.coins) {
      return message.reply(
        `❌ You don't have enough coins! You have ${economy.coins} coins.`
      );
    }

    const deck = createDeck();
    const playerHand = dealCards(deck, 5);
    const dealerHand = dealCards(deck, 5);

    const gameId = `${message.author.id}-${Date.now()}`;
    games.set(gameId, {
      deck,
      playerHand,
      dealerHand,
      betAmount,
      userId: message.author.id,
      phase: 'draw',
    });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`poker_hold_${gameId}`)
        .setLabel('Hold (Keep All)')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`poker_draw_${gameId}`)
        .setLabel('Draw Cards')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`poker_fold_${gameId}`)
        .setLabel('Fold')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🃏 Poker - 5 Card Draw')
      .setDescription(
        `**Your Hand:**\n${playerHand.map(cardToString).join(' ')}\n\n` +
          `**Bet:** ${betAmount} coins\n\n` +
          `Choose to **Hold** (keep all cards) or **Draw** (replace cards)`
      )
      .setFooter({ text: 'Click buttons to play' })
      .setTimestamp();

    const msg = await message.reply({ embeds: [embed], components: [buttons] });

    const collector = msg.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== message.author.id) {
        return i.reply({
          content: '❌ This is not your game!',
          flags: MessageFlags.Ephemeral,
        });
      }

      const [, action, id] = i.customId.split('_');
      const game = games.get(id);

      if (!game) {
        return i.reply({
          content: '❌ Game expired!',
          flags: MessageFlags.Ephemeral,
        });
      }

      if (action === 'fold') {
        economy.coins -= betAmount;
        db.set('economy', message.author.id, economy);
        games.delete(gameId);
        collector.stop();

        const foldEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('🃏 Poker - Folded')
          .setDescription(`You folded and lost ${betAmount} coins.`)
          .addFields({
            name: '💵 Balance',
            value: `${economy.coins} coins`,
            inline: false,
          })
          .setTimestamp();

        return i.update({ embeds: [foldEmbed], components: [] });
      }

      if (action === 'hold' || action === 'draw') {
        // Dealer draws (simple AI: draw if hand rank < 2)
        const dealerEval = evaluateHand(game.dealerHand);
        if (dealerEval.rank < 2) {
          // Dealer draws 2 cards
          game.dealerHand.splice(0, 2);
          game.dealerHand.push(...dealCards(game.deck, 2));
        }

        // Evaluate hands
        const playerEval = evaluateHand(game.playerHand);
        const newDealerEval = evaluateHand(game.dealerHand);

        let result;
        let winnings = 0;

        if (playerEval.rank > newDealerEval.rank) {
          result = 'won';
          winnings = betAmount * 2;
          economy.coins += winnings;
        } else if (playerEval.rank < newDealerEval.rank) {
          result = 'lost';
          economy.coins -= betAmount;
        } else {
          result = 'tie';
        }

        db.set('economy', message.author.id, economy);
        games.delete(gameId);
        collector.stop();

        const resultEmbed = new EmbedBuilder()
          .setColor(
            result === 'won'
              ? 0x00ff00
              : result === 'lost'
                ? 0xff0000
                : 0xffff00
          )
          .setTitle(
            `🃏 Poker - ${result === 'won' ? 'You Win!' : result === 'lost' ? 'You Lose!' : 'Tie!'}`
          )
          .setDescription(
            `**Your Hand:** ${game.playerHand.map(cardToString).join(' ')}\n` +
              `**Your Result:** ${playerEval.name}\n\n` +
              `**Dealer Hand:** ${game.dealerHand.map(cardToString).join(' ')}\n` +
              `**Dealer Result:** ${newDealerEval.name}`
          )
          .addFields(
            {
              name:
                result === 'won'
                  ? '✅ Won'
                  : result === 'lost'
                    ? '❌ Lost'
                    : '🤝 Tie',
              value:
                result === 'won'
                  ? `+${winnings} coins`
                  : result === 'lost'
                    ? `-${betAmount} coins`
                    : 'No change',
              inline: true,
            },
            {
              name: '💵 Balance',
              value: `${economy.coins} coins`,
              inline: true,
            }
          )
          .setTimestamp();

        return i.update({ embeds: [resultEmbed], components: [] });
      }
    });

    collector.on('end', () => {
      games.delete(gameId);
    });
  },
};
