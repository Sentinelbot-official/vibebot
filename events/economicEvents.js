const { EmbedBuilder } = require('discord.js');
const db = require('../utils/database');
const branding = require('../utils/branding');

module.exports = {
  name: 'economicEvents',
  once: false,

  async execute(client) {
    // Trigger economic events every 6 hours
    setInterval(
      async () => {
        for (const guild of client.guilds.cache.values()) {
          try {
            // Random chance for event (20%)
            if (Math.random() > 0.2) continue;

            const event = selectRandomEvent();
            await triggerEvent(guild, event);
          } catch (error) {
            console.error(`Error triggering economic event for ${guild.name}:`, error);
          }
        }
      },
      6 * 60 * 60 * 1000
    ); // 6 hours
  },
};

function selectRandomEvent() {
  const events = [
    {
      id: 'market_crash',
      name: '📉 Market Crash',
      description: 'The market has crashed! All investments lose 20% value.',
      effect: 'negative',
      impact: 0.8,
    },
    {
      id: 'bull_market',
      name: '📈 Bull Market',
      description: 'The market is booming! All investments gain 30% value.',
      effect: 'positive',
      impact: 1.3,
    },
    {
      id: 'treasure_found',
      name: '💎 Treasure Discovery',
      description: 'A treasure was found! Everyone gets 1000 coins!',
      effect: 'bonus',
      amount: 1000,
    },
    {
      id: 'tax_day',
      name: '💸 Tax Day',
      description: 'Tax collectors are here! Everyone loses 5% of their wallet.',
      effect: 'tax',
      rate: 0.05,
    },
    {
      id: 'lottery_win',
      name: '🎰 Lottery Jackpot',
      description: 'Someone won the lottery! Random user gets 50,000 coins!',
      effect: 'lottery',
      amount: 50000,
    },
    {
      id: 'inflation',
      name: '📊 Inflation',
      description: 'Inflation hits! All prices increase by 10%.',
      effect: 'inflation',
      rate: 1.1,
    },
    {
      id: 'deflation',
      name: '📉 Deflation',
      description: 'Deflation occurs! All prices decrease by 10%.',
      effect: 'deflation',
      rate: 0.9,
    },
    {
      id: 'gold_rush',
      name: '⛏️ Gold Rush',
      description: 'Gold rush! Work command pays double for 24 hours!',
      effect: 'boost',
      command: 'work',
      multiplier: 2,
      duration: 24 * 60 * 60 * 1000,
    },
  ];

  return events[Math.floor(Math.random() * events.length)];
}

async function triggerEvent(guild, event) {
  // Find announcement channel
  const channels = guild.channels.cache.filter(
    c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages')
  );

  if (channels.size === 0) return;

  const channel = channels.first();

  const embed = new EmbedBuilder()
    .setColor(
      event.effect === 'positive'
        ? branding.colors.success
        : event.effect === 'negative'
          ? branding.colors.error
          : branding.colors.warning
    )
    .setTitle(`🌍 Economic Event: ${event.name}`)
    .setDescription(event.description)
    .setFooter(branding.footers.default)
    .setTimestamp();

  await channel.send({ embeds: [embed] });

  // Apply event effects
  switch (event.effect) {
    case 'positive':
    case 'negative':
      applyInvestmentMultiplier(guild.id, event.impact);
      break;

    case 'bonus':
      applyBonusToAll(guild.id, event.amount);
      break;

    case 'tax':
      applyTaxToAll(guild.id, event.rate);
      break;

    case 'lottery':
      applyLotteryWin(guild, event.amount);
      break;

    case 'boost':
      applyCommandBoost(guild.id, event.command, event.multiplier, event.duration);
      break;
  }
}

function applyInvestmentMultiplier(guildId, multiplier) {
  // This would affect investment values
  // Implementation depends on how investments are stored
}

function applyBonusToAll(guildId, amount) {
  const users = db.getAllKeys('users');

  for (const userId of users) {
    const userData = db.get('users', userId) || { wallet: 0 };
    userData.wallet += amount;
    db.set('users', userId, userData);
  }
}

function applyTaxToAll(guildId, rate) {
  const users = db.getAllKeys('users');

  for (const userId of users) {
    const userData = db.get('users', userId) || { wallet: 0 };
    const tax = Math.floor(userData.wallet * rate);
    userData.wallet -= tax;
    db.set('users', userId, userData);
  }
}

async function applyLotteryWin(guild, amount) {
  const members = guild.members.cache.filter(m => !m.user.bot);

  if (members.size === 0) return;

  const winner = members.random();
  const userData = db.get('users', winner.id) || { wallet: 0 };
  userData.wallet += amount;
  db.set('users', winner.id, userData);

  // Announce winner
  const channels = guild.channels.cache.filter(
    c => c.isTextBased() && c.permissionsFor(guild.members.me).has('SendMessages')
  );

  if (channels.size > 0) {
    await channels.first().send(
      `🎉 Congratulations ${winner}! You won the lottery and received **${branding.formatNumber(amount)}** coins!`
    );
  }
}

function applyCommandBoost(guildId, command, multiplier, duration) {
  const boosts = db.get('command_boosts', guildId) || {};

  boosts[command] = {
    multiplier,
    expiresAt: Date.now() + duration,
  };

  db.set('command_boosts', guildId, boosts);
}
