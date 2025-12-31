const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'fact',
  description: 'Get a random interesting fact',
  aliases: ['randomfact', 'funfact'],
  category: 'fun',
  cooldown: 3,
  execute(message) {
    const facts = [
      '🐙 Octopuses have three hearts and blue blood.',
      "🍯 Honey never spoils. Archaeologists have found 3000-year-old honey that's still edible.",
      "🌍 There are more stars in the universe than grains of sand on all Earth's beaches.",
      "🦈 Sharks existed before trees. They've been around for over 400 million years.",
      "🧠 Your brain uses 20% of your body's energy despite being only 2% of your body weight.",
      '🌙 A day on Venus is longer than its year.',
      '🐌 Snails can sleep for up to 3 years.',
      '🦒 Giraffes have the same number of neck vertebrae as humans (7).',
      "🍌 Bananas are berries, but strawberries aren't.",
      '💎 It rains diamonds on Jupiter and Saturn.',
      '🦋 Butterflies can taste with their feet.',
      '🐝 Bees can recognize human faces.',
      "🌊 The ocean produces more oxygen than all the world's rainforests combined.",
      '⚡ Lightning strikes the Earth about 100 times per second.',
      '🦴 Humans and giraffes have the same number of bones in their necks.',
      '🎵 Music can make food taste better.',
      "🌈 You can't hum while holding your nose closed.",
      "🦘 Kangaroos can't walk backwards.",
      "🐘 Elephants are the only mammals that can't jump.",
      '🌸 The smell of freshly cut grass is actually a plant distress signal.',
      '🦇 Bats are the only mammals capable of sustained flight.',
      '🐧 Penguins propose to their mates with pebbles.',
      '🌟 Neutron stars are so dense that a teaspoon would weigh 6 billion tons.',
      '🦎 Chameleons change color based on mood, not just camouflage.',
      '🐨 Koala fingerprints are almost identical to human fingerprints.',
      '🌋 There are more possible iterations of a game of chess than atoms in the universe.',
      '🦅 Eagles can see 4-5 times farther than humans.',
      "🐜 Ants never sleep and don't have lungs.",
      '🌺 The Hawaiian alphabet only has 12 letters.',
      '🦑 Squids have donut-shaped brains.',
      '🌲 Trees can communicate with each other through underground fungal networks.',
      '🦀 Crabs can regenerate lost limbs.',
      '🎭 Your nose can remember 50,000 different scents.',
      '🌙 The footprints on the moon will last for millions of years.',
      "🦊 Foxes use Earth's magnetic field to hunt prey under snow.",
      '🌊 The Pacific Ocean is shrinking while the Atlantic Ocean is growing.',
      '🦏 Rhino horns are made of keratin, the same material as human hair and nails.',
      '🌟 You are made of stardust - literally. Most elements in your body were formed in stars.',
      '🦜 Parrots can live for over 80 years.',
      '🌍 Earth is the only planet not named after a god.',
    ];

    const fact = facts[Math.floor(Math.random() * facts.length)];

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('💡 Random Fact')
      .setDescription(fact)
      .setFooter(branding.footers.default)
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
