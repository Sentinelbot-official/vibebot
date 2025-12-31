const { EmbedBuilder } = require('discord.js');
const db = require('../../utils/database');

module.exports = {
  name: 'setbio',
  description: 'Set your profile bio',
  usage: '<bio text>',
  aliases: ['bio'],
  category: 'social',
  cooldown: 30,
  execute(message, args) {
    if (!args.length) {
      return message.reply(
        '❌ Please provide a bio!\nUsage: `setbio <your bio>`\nExample: `setbio I love coding and gaming!`'
      );
    }

    const bio = args.join(' ');

    if (bio.length > 200) {
      return message.reply('❌ Bio is too long! Maximum 200 characters.');
    }

    // Get or create profile
    const profileData = db.get('profiles', message.author.id) || { badges: [] };
    profileData.bio = bio;
    profileData.lastUpdated = Date.now();

    db.set('profiles', message.author.id, profileData);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('✅ Bio Updated!')
      .setDescription(`Your new bio:\n\n*${bio}*`)
      .setFooter({ text: 'View your profile with: profile' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
