const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'quote',
  description: 'Get an inspirational quote',
  aliases: ['inspire', 'motivation', 'wisdom'],
  category: 'fun',
  cooldown: 3,
  execute(message) {
    const quotes = [
      {
        text: 'The only way to do great work is to love what you do.',
        author: 'Steve Jobs',
      },
      {
        text: 'Innovation distinguishes between a leader and a follower.',
        author: 'Steve Jobs',
      },
      {
        text: "Life is what happens when you're busy making other plans.",
        author: 'John Lennon',
      },
      {
        text: 'The future belongs to those who believe in the beauty of their dreams.',
        author: 'Eleanor Roosevelt',
      },
      {
        text: 'It is during our darkest moments that we must focus to see the light.',
        author: 'Aristotle',
      },
      {
        text: 'Be yourself; everyone else is already taken.',
        author: 'Oscar Wilde',
      },
      {
        text: 'The only impossible journey is the one you never begin.',
        author: 'Tony Robbins',
      },
      {
        text: "In the end, we only regret the chances we didn't take.",
        author: 'Lewis Carroll',
      },
      {
        text: 'The best time to plant a tree was 20 years ago. The second best time is now.',
        author: 'Chinese Proverb',
      },
      {
        text: "Your time is limited, don't waste it living someone else's life.",
        author: 'Steve Jobs',
      },
      {
        text: "Whether you think you can or you think you can't, you're right.",
        author: 'Henry Ford',
      },
      {
        text: 'The only person you are destined to become is the person you decide to be.',
        author: 'Ralph Waldo Emerson',
      },
      {
        text: "Believe you can and you're halfway there.",
        author: 'Theodore Roosevelt',
      },
      {
        text: "I have not failed. I've just found 10,000 ways that won't work.",
        author: 'Thomas Edison',
      },
      {
        text: 'A person who never made a mistake never tried anything new.',
        author: 'Albert Einstein',
      },
      {
        text: 'The only limit to our realization of tomorrow is our doubts of today.',
        author: 'Franklin D. Roosevelt',
      },
      {
        text: 'Do what you can, with what you have, where you are.',
        author: 'Theodore Roosevelt',
      },
      {
        text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
        author: 'Winston Churchill',
      },
      {
        text: 'Hardships often prepare ordinary people for an extraordinary destiny.',
        author: 'C.S. Lewis',
      },
      {
        text: 'The way to get started is to quit talking and begin doing.',
        author: 'Walt Disney',
      },
      {
        text: "Don't watch the clock; do what it does. Keep going.",
        author: 'Sam Levenson',
      },
      {
        text: 'The future depends on what you do today.',
        author: 'Mahatma Gandhi',
      },
      {
        text: "Everything you've ever wanted is on the other side of fear.",
        author: 'George Addair',
      },
      { text: 'Dream big and dare to fail.', author: 'Norman Vaughan' },
      {
        text: "It's not whether you get knocked down, it's whether you get up.",
        author: 'Vince Lombardi',
      },
      {
        text: 'Failure is the condiment that gives success its flavor.',
        author: 'Truman Capote',
      },
      {
        text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",
        author: 'Roy T. Bennett',
      },
      { text: 'What we think, we become.', author: 'Buddha' },
      { text: 'The only way out is through.', author: 'Robert Frost' },
      {
        text: "You miss 100% of the shots you don't take.",
        author: 'Wayne Gretzky',
      },
      {
        text: 'I am not a product of my circumstances. I am a product of my decisions.',
        author: 'Stephen Covey',
      },
      {
        text: 'Every strike brings me closer to the next home run.',
        author: 'Babe Ruth',
      },
      {
        text: 'Life is 10% what happens to me and 90% of how I react to it.',
        author: 'Charles Swindoll',
      },
      {
        text: 'The most difficult thing is the decision to act, the rest is merely tenacity.',
        author: 'Amelia Earhart',
      },
      {
        text: 'You are never too old to set another goal or to dream a new dream.',
        author: 'C.S. Lewis',
      },
      {
        text: "Try to be a rainbow in someone's cloud.",
        author: 'Maya Angelou',
      },
      {
        text: 'You do not find the happy life. You make it.',
        author: 'Camilla Eyring Kimball',
      },
      {
        text: 'Inspiration does exist, but it must find you working.',
        author: 'Pablo Picasso',
      },
      {
        text: "Don't limit your challenges. Challenge your limits.",
        author: 'Unknown',
      },
      {
        text: 'Great things never come from comfort zones.',
        author: 'Unknown',
      },
    ];

    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('✨ Inspirational Quote')
      .setDescription(`*"${quote.text}"*`)
      .setFooter({ text: `— ${quote.author}` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
