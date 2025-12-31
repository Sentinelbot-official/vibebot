const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const suits = ['♠️', '♥️', '♦️', '♣️'];
const values = [
  'A',
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
];

function createDeck() {
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({ suit, value });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

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

const activeGames = new Map();

module.exports = {
  name: 'blackjack',
  aliases: ['bj'],
  description: 'Play blackjack',
  usage: '<bet>',
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    if (activeGames.has(message.author.id)) {
      return message.reply('❌ You already have an active blackjack game!');
    }

    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet < 10) {
      return message.reply('❌ Please bet at least 10 coins!');
    }

    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };

    if (bet > economy.coins) {
      return message.reply(
        `❌ You don't have enough coins! You have ${economy.coins.toLocaleString()} coins.`
      );
    }

    // Start game
    const deck = createDeck();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    const gameState = {
      deck,
      playerHand,
      dealerHand,
      bet,
      stand: false,
    };

    activeGames.set(message.author.id, gameState);

    const embed = new EmbedBuilder()
      .setColor(branding.colors.info)
      .setTitle('🃏 Blackjack')
      .addFields(
        {
          name: 'Your Hand',
          value: `${playerHand.map(displayCard).join(' ')} (${handValue(playerHand)})`,
          inline: false,
        },
        {
          name: 'Dealer Hand',
          value: `${displayCard(dealerHand[0])} 🂠`,
          inline: false,
        },
        { name: 'Bet', value: `${bet.toLocaleString()} coins`, inline: true }
      );

    // Check for blackjack
    if (handValue(playerHand) === 21) {
      activeGames.delete(message.author.id);
      economy.coins += Math.floor(bet * 1.5);
      db.set('economy', message.author.id, economy);

      embed.setColor(branding.colors.success);
      embed.setDescription('🎉 BLACKJACK! You win 1.5x your bet!');
      embed.addFields({
        name: 'New Balance',
        value: `${economy.coins.toLocaleString()} coins`,
        inline: true,
      });
      return message.reply({ embeds: [embed] });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`bj_hit_${message.author.id}`)
        .setLabel('Hit')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`bj_stand_${message.author.id}`)
        .setLabel('Stand')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await message.reply({ embeds: [embed], components: [row] });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (activeGames.has(message.author.id)) {
        activeGames.delete(message.author.id);
        msg.edit({ components: [] }).catch(() => {});
      }
    }, 60000);
  },
};
