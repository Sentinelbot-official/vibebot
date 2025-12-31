module.exports = {
  name: 'commandname',
  description: 'Command description',
  usage: '[args]',
  category: 'general', // general, moderation, fun, etc.
  async execute(message, args) {
    // Command logic here
    message.reply('Command executed!');
  },
};
