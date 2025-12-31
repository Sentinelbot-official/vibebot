const db = require('../utils/database');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    // Check if user is AFK and remove it
    const userAfk = db.get('afk', message.author.id);
    if (userAfk) {
      db.delete('afk', message.author.id);
      const duration = Math.floor((Date.now() - userAfk.since) / 1000);
      const minutes = Math.floor(duration / 60);
      const hours = Math.floor(minutes / 60);

      let timeStr = '';
      if (hours > 0) timeStr = `${hours}h ${minutes % 60}m`;
      else if (minutes > 0) timeStr = `${minutes}m`;
      else timeStr = `${duration}s`;

      message.reply(`Welcome back! You were AFK for ${timeStr}.`).then(m => {
        setTimeout(() => m.delete().catch(() => {}), 5000);
      });
    }

    // Check if any mentioned users are AFK
    if (message.mentions.users.size > 0) {
      message.mentions.users.forEach(user => {
        if (user.bot) return;
        const afkData = db.get('afk', user.id);
        if (afkData) {
          const duration = Math.floor((Date.now() - afkData.since) / 1000);
          const minutes = Math.floor(duration / 60);
          const hours = Math.floor(minutes / 60);

          let timeStr = '';
          if (hours > 0) timeStr = `${hours}h ${minutes % 60}m ago`;
          else if (minutes > 0) timeStr = `${minutes}m ago`;
          else timeStr = `${duration}s ago`;

          message
            .reply(`💤 ${user.username} is AFK: ${afkData.reason} (${timeStr})`)
            .then(m => {
              setTimeout(() => m.delete().catch(() => {}), 10000);
            });
        }
      });
    }
  },
};
