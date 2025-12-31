const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'redeem',
  description: 'Redeem gift codes for rewards',
  usage: '<code> or <create/list/delete> (admin)',
  aliases: ['giftcode', 'promo'],
  category: 'economy',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    // Admin actions
    if (action === 'create') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ You need Administrator permission!');
      }

      if (args.length < 4) {
        return message.reply(
          '❌ Usage: `redeem create <code> <coins> <uses>`\nExample: `redeem create WELCOME2024 1000 100`'
        );
      }

      const code = args[1].toUpperCase();
      const coins = parseInt(args[2]);
      const maxUses = parseInt(args[3]);

      if (isNaN(coins) || coins <= 0) {
        return message.reply('❌ Invalid coin amount!');
      }

      if (isNaN(maxUses) || maxUses <= 0) {
        return message.reply('❌ Invalid max uses!');
      }

      const codes = db.get('gift_codes', 'all') || { codes: {} };

      if (codes.codes[code]) {
        return message.reply(`❌ Code "${code}" already exists!`);
      }

      codes.codes[code] = {
        code,
        coins,
        maxUses,
        uses: 0,
        usedBy: [],
        createdBy: message.author.id,
        createdAt: Date.now(),
      };

      db.set('gift_codes', 'all', codes);

      return message.reply(
        `✅ Gift code created!\n\n` +
          `**Code:** \`${code}\`\n` +
          `**Reward:** ${coins} coins\n` +
          `**Max Uses:** ${maxUses}`
      );
    }

    if (action === 'list') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ You need Administrator permission!');
      }

      const codes = db.get('gift_codes', 'all') || { codes: {} };
      const codeList = Object.values(codes.codes);

      if (!codeList.length) {
        return message.reply('❌ No gift codes created yet!');
      }

      const list = codeList
        .map(
          c => `**${c.code}** - ${c.coins} coins | ${c.uses}/${c.maxUses} uses`
        )
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🎁 Gift Codes')
        .setDescription(list)
        .setFooter({ text: `Total: ${codeList.length} codes` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (action === 'delete') {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('❌ You need Administrator permission!');
      }

      const code = args[1]?.toUpperCase();

      if (!code) {
        return message.reply(
          '❌ Please provide a code!\nUsage: `redeem delete <code>`'
        );
      }

      const codes = db.get('gift_codes', 'all') || { codes: {} };

      if (!codes.codes[code]) {
        return message.reply(`❌ Code "${code}" not found!`);
      }

      delete codes.codes[code];
      db.set('gift_codes', 'all', codes);

      return message.reply(`✅ Deleted gift code "${code}"!`);
    }

    // Redeem code
    const code = args[0]?.toUpperCase();

    if (!code) {
      return message.reply(
        '❌ Please provide a code!\nUsage: `redeem <code>`\nExample: `redeem WELCOME2024`'
      );
    }

    const codes = db.get('gift_codes', 'all') || { codes: {} };
    const giftCode = codes.codes[code];

    if (!giftCode) {
      return message.reply(`❌ Invalid code "${code}"!`);
    }

    if (giftCode.uses >= giftCode.maxUses) {
      return message.reply(`❌ Code "${code}" has been fully redeemed!`);
    }

    if (giftCode.usedBy.includes(message.author.id)) {
      return message.reply(`❌ You've already redeemed code "${code}"!`);
    }

    // Redeem code
    giftCode.uses++;
    giftCode.usedBy.push(message.author.id);
    db.set('gift_codes', 'all', codes);

    const economy = db.get('economy', message.author.id) || {
      coins: 0,
      bank: 0,
    };
    economy.coins += giftCode.coins;
    db.set('economy', message.author.id, economy);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🎁 Code Redeemed!')
      .setDescription(
        `You've successfully redeemed code **${code}**!\n\n` +
          `**Reward:** +${giftCode.coins} coins\n` +
          `**New Balance:** ${economy.coins} coins`
      )
      .setFooter({
        text: `${giftCode.uses}/${giftCode.maxUses} uses | ${giftCode.maxUses - giftCode.uses} remaining`,
      })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
