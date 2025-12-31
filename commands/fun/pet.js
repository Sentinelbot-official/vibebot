const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const db = require('../../utils/database');
const branding = require('../../utils/branding');

const petTypes = {
  dog: { emoji: '🐕', name: 'Dog', hungerRate: 0.5, happinessRate: 0.3 },
  cat: { emoji: '🐱', name: 'Cat', hungerRate: 0.4, happinessRate: 0.4 },
  bunny: { emoji: '🐰', name: 'Bunny', hungerRate: 0.6, happinessRate: 0.5 },
  bird: { emoji: '🐦', name: 'Bird', hungerRate: 0.3, happinessRate: 0.6 },
  hamster: {
    emoji: '🐹',
    name: 'Hamster',
    hungerRate: 0.5,
    happinessRate: 0.4,
  },
  dragon: { emoji: '🐉', name: 'Dragon', hungerRate: 0.7, happinessRate: 0.2 },
};

module.exports = {
  name: 'pet',
  description: 'Manage your virtual pet',
  usage: '[adopt/feed/play/status/rename] [args]',
  category: 'fun',
  cooldown: 5,
  async execute(message, args) {
    const action = args[0]?.toLowerCase();

    if (!action) {
      return showPetStatus(message);
    }

    switch (action) {
      case 'adopt':
        return adoptPet(message, args[1]);
      case 'feed':
        return feedPet(message);
      case 'play':
        return playWithPet(message);
      case 'status':
        return showPetStatus(message);
      case 'rename':
        return renamePet(message, args.slice(1).join(' '));
      default:
        return message.reply(
          '❌ Invalid action! Use: `pet [adopt/feed/play/status/rename]`'
        );
    }
  },
};

async function adoptPet(message, type) {
  const petData = db.get('pets', message.author.id);

  if (petData) {
    return message.reply(
      '❌ You already have a pet! Use `pet status` to check on them.'
    );
  }

  if (!type || !petTypes[type.toLowerCase()]) {
    const typeList = Object.entries(petTypes)
      .map(([key, val]) => `${val.emoji} \`${key}\``)
      .join(', ');
    return message.reply(
      `❌ Please specify a pet type!\nAvailable pets: ${typeList}\n\nExample: \`pet adopt dog\``
    );
  }

  const petType = petTypes[type.toLowerCase()];
  const newPet = {
    type: type.toLowerCase(),
    name: `${petType.name}`,
    level: 1,
    xp: 0,
    hunger: 100,
    happiness: 100,
    lastFed: Date.now(),
    lastPlayed: Date.now(),
    adoptedAt: Date.now(),
  };

  db.set('pets', message.author.id, newPet);

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('🎉 Pet Adopted!')
    .setDescription(
      `Congratulations! You adopted a ${petType.emoji} **${petType.name}**!`
    )
    .addFields(
      { name: '💕 Happiness', value: '100%', inline: true },
      { name: '🍖 Hunger', value: '100%', inline: true },
      { name: '⭐ Level', value: '1', inline: true }
    )
    .setFooter({ text: 'Take good care of your pet!' })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function feedPet(message) {
  const petData = db.get('pets', message.author.id);

  if (!petData) {
    return message.reply(
      "❌ You don't have a pet! Use `pet adopt <type>` to get one."
    );
  }

  const timeSinceLastFed = Date.now() - petData.lastFed;
  const cooldown = 3600000; // 1 hour

  if (timeSinceLastFed < cooldown) {
    const timeLeft = Math.ceil((cooldown - timeSinceLastFed) / 60000);
    return message.reply(
      `❌ Your pet isn't hungry yet! Feed again in ${timeLeft} minutes.`
    );
  }

  // Update pet stats
  updatePetStats(petData);
  petData.hunger = Math.min(100, petData.hunger + 30);
  petData.lastFed = Date.now();
  petData.xp += 10;

  // Check for level up
  const levelUp = checkLevelUp(petData);

  db.set('pets', message.author.id, petData);

  const petType = petTypes[petData.type];
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(`${petType.emoji} Fed ${petData.name}!`)
    .setDescription(`You fed your ${petType.name}! They're happy! 🍖`)
    .addFields(
      {
        name: '💕 Happiness',
        value: `${Math.floor(petData.happiness)}%`,
        inline: true,
      },
      {
        name: '🍖 Hunger',
        value: `${Math.floor(petData.hunger)}%`,
        inline: true,
      },
      { name: '⭐ Level', value: petData.level.toString(), inline: true }
    );

  if (levelUp) {
    embed.setDescription(
      embed.data.description +
        `\n\n🎉 **Level Up!** Your pet is now level ${petData.level}!`
    );
  }

  return message.reply({ embeds: [embed] });
}

async function playWithPet(message) {
  const petData = db.get('pets', message.author.id);

  if (!petData) {
    return message.reply(
      "❌ You don't have a pet! Use `pet adopt <type>` to get one."
    );
  }

  const timeSinceLastPlayed = Date.now() - petData.lastPlayed;
  const cooldown = 3600000; // 1 hour

  if (timeSinceLastPlayed < cooldown) {
    const timeLeft = Math.ceil((cooldown - timeSinceLastPlayed) / 60000);
    return message.reply(
      `❌ Your pet is tired! Play again in ${timeLeft} minutes.`
    );
  }

  // Update pet stats
  updatePetStats(petData);
  petData.happiness = Math.min(100, petData.happiness + 30);
  petData.lastPlayed = Date.now();
  petData.xp += 15;

  // Check for level up
  const levelUp = checkLevelUp(petData);

  db.set('pets', message.author.id, petData);

  const petType = petTypes[petData.type];
  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle(`${petType.emoji} Played with ${petData.name}!`)
    .setDescription(`You played with your ${petType.name}! They had fun! 🎾`)
    .addFields(
      {
        name: '💕 Happiness',
        value: `${Math.floor(petData.happiness)}%`,
        inline: true,
      },
      {
        name: '🍖 Hunger',
        value: `${Math.floor(petData.hunger)}%`,
        inline: true,
      },
      { name: '⭐ Level', value: petData.level.toString(), inline: true }
    );

  if (levelUp) {
    embed.setDescription(
      embed.data.description +
        `\n\n🎉 **Level Up!** Your pet is now level ${petData.level}!`
    );
  }

  return message.reply({ embeds: [embed] });
}

async function showPetStatus(message) {
  const petData = db.get('pets', message.author.id);

  if (!petData) {
    const typeList = Object.entries(petTypes)
      .map(([key, val]) => `${val.emoji} \`${key}\``)
      .join(', ');
    return message.reply(
      `❌ You don\'t have a pet yet!\n\nAdopt one with: \`pet adopt <type>\`\nAvailable pets: ${typeList}`
    );
  }

  // Update pet stats
  updatePetStats(petData);
  db.set('pets', message.author.id, petData);

  const petType = petTypes[petData.type];
  const xpNeeded = petData.level * 100;
  const xpProgress = Math.floor((petData.xp / xpNeeded) * 100);

  // Determine pet mood
  let mood = '😊 Happy';
  if (petData.happiness < 30 || petData.hunger < 30) {
    mood = '😢 Sad';
  } else if (petData.happiness < 60 || petData.hunger < 60) {
    mood = '😐 Okay';
  }

  const adoptedDays = Math.floor(
    (Date.now() - petData.adoptedAt) / (1000 * 60 * 60 * 24)
  );

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setTitle(`${petType.emoji} ${petData.name}`)
    .setDescription(`**Type:** ${petType.name}\n**Mood:** ${mood}`)
    .addFields(
      {
        name: '💕 Happiness',
        value: `${Math.floor(petData.happiness)}%`,
        inline: true,
      },
      {
        name: '🍖 Hunger',
        value: `${Math.floor(petData.hunger)}%`,
        inline: true,
      },
      { name: '⭐ Level', value: petData.level.toString(), inline: true },
      {
        name: '✨ XP',
        value: `${petData.xp}/${xpNeeded} (${xpProgress}%)`,
        inline: false,
      },
      { name: '📅 Days Together', value: adoptedDays.toString(), inline: true }
    )
    .setFooter({ text: 'Use: pet feed | pet play | pet rename <name>' })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

async function renamePet(message, newName) {
  const petData = db.get('pets', message.author.id);

  if (!petData) {
    return message.reply(
      "❌ You don't have a pet! Use `pet adopt <type>` to get one."
    );
  }

  if (!newName || newName.length < 2 || newName.length > 20) {
    return message.reply('❌ Please provide a valid name (2-20 characters)!');
  }

  petData.name = newName;
  db.set('pets', message.author.id, petData);

  const petType = petTypes[petData.type];
  return message.reply(
    `✅ Your ${petType.emoji} ${petType.name} is now named **${newName}**!`
  );
}

function updatePetStats(petData) {
  const timeSinceLastFed = Date.now() - petData.lastFed;
  const timeSinceLastPlayed = Date.now() - petData.lastPlayed;
  const petType = petTypes[petData.type];

  // Decrease hunger over time (every hour)
  const hoursSinceLastFed = timeSinceLastFed / 3600000;
  petData.hunger = Math.max(
    0,
    petData.hunger - hoursSinceLastFed * petType.hungerRate * 10
  );

  // Decrease happiness over time (every hour)
  const hoursSinceLastPlayed = timeSinceLastPlayed / 3600000;
  petData.happiness = Math.max(
    0,
    petData.happiness - hoursSinceLastPlayed * petType.happinessRate * 10
  );
}

function checkLevelUp(petData) {
  const xpNeeded = petData.level * 100;
  if (petData.xp >= xpNeeded) {
    petData.level++;
    petData.xp -= xpNeeded;
    return true;
  }
  return false;
}
