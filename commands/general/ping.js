module.exports = {
  name: 'ping',
  description: 'Replies with Pong and bot latency',
  category: 'general',
  execute(message, args) {
    const sent = message.reply('Pinging...');
    sent.then(msg => {
      const latency = msg.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(message.client.ws.ping);
      msg.edit(
        `🏓 Pong!\n📡 Latency: ${latency}ms\n💓 API Latency: ${apiLatency}ms`
      );
    });
  },
};
