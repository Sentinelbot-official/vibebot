const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'heist',
  description: 'Plan a heist for a chance to win big (or lose it all)',
  usage: '<amount>',
  aliases: ['rob', 'steal'],
  category: 'economy',
  cooldown: 300, // 5 minutes
  async execute(message, args) {
    if (args.length === 0) {
      return message.reply('❌ Usage: `heist <amount>`');
    }

    const userData = db.get('economy', message.author.id) || {
      wallet: 0,
      bank: 0,
    };

    let amount;
    if (args[0].toLowerCase() === 'all') {
      amount = userData.wallet;
    } else {
      amount = parseInt(args[0]);
    }

    if (isNaN(amount) || amount < 1) {
      return message.reply('❌ Please provide a valid amount!');
    }

    if (amount > userData.wallet) {
      return message.reply(
        `❌ You don't have enough coins! You have **${userData.wallet}** coins in your wallet.`
      );
    }

    if (amount < 100) {
      return message.reply('❌ Minimum heist amount is **100** coins!');
    }

    // Heist scenarios
    const scenarios = [
      {
        success: true,
        multiplier: 2,
        message: '🎉 **HEIST SUCCESSFUL!** You cracked the vault and got away clean!',
      },
      {
        success: true,
        multiplier: 1.5,
        message: '✅ **SUCCESS!** You managed to grab some loot before escaping!',
      },
      {
        success: true,
        multiplier: 3,
        message: '💎 **JACKPOT!** You found the secret vault and struck gold!',
      },
      {
        success: false,
        multiplier: 0,
        message: '🚨 **BUSTED!** The cops caught you red-handed!',
      },
      {
        success: false,
        multiplier: 0,
        message: '❌ **FAILED!** The alarm went off and you had to flee empty-handed!',
      },
      {
        success: false,
        multiplier: 0,
        message: '💥 **CAUGHT!** Security was too tight, you lost everything!',
      },
      {
        success: true,
        multiplier: 1.2,
        message: '🏃 **CLOSE CALL!** You barely escaped with some cash!',
      },
      {
        success: false,
        multiplier: 0.5,
        message: '⚠️ **PARTIAL LOSS!** You dropped half the money while escaping!',
      },
    ];

    // 40% success rate
    const roll = Math.random();
    let scenario;

    if (roll < 0.4) {
      // Success
      const successScenarios = scenarios.filter(s => s.success);
      scenario = successScenarios[Math.floor(Math.random() * successScenarios.length)];
    } else {
      // Failure
      const failScenarios = scenarios.filter(s => !s.success);
      scenario = failScenarios[Math.floor(Math.random() * failScenarios.length)];
    }

    let winnings;
    if (scenario.success) {
      winnings = Math.floor(amount * scenario.multiplier) - amount;
    } else {
      winnings = -Math.floor(amount * (1 - scenario.multiplier));
    }

    // Update balance
    userData.wallet += winnings;
    db.set('economy', message.author.id, userData);

    const embed = new EmbedBuilder()
      .setColor(scenario.success ? 0x00ff00 : 0xff0000)
      .setTitle('🏦 Heist Results')
      .setDescription(
        `${scenario.message}\n\n` +
          `**Invested:** ${amount} coins\n` +
          `**${winnings >= 0 ? 'Won' : 'Lost'}:** ${Math.abs(winnings)} coins\n\n` +
          `**New Balance:** ${userData.wallet} coins`
      )
      .setFooter({ text: `${message.author.tag}'s heist` })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  },
};
