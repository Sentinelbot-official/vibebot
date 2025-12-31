# Contributing to Vibe Bot

Thank you for your interest in contributing to Vibe Bot! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [License Agreement](#license-agreement)

## 📜 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards other contributors

## 🤝 How Can I Contribute?

### Reporting Bugs

1. **Check existing issues** - Your bug may already be reported
2. **Use the bug report template** - Provide clear reproduction steps
3. **Include details** - OS, Node version, error messages, logs
4. **Be responsive** - Answer questions about your report

### Suggesting Features

1. **Check existing feature requests** - Avoid duplicates
2. **Explain the use case** - Why is this feature needed?
3. **Provide examples** - Show how it would work
4. **Be open to discussion** - Your idea may evolve

### Contributing Code

We welcome pull requests for:

- 🐛 Bug fixes
- ✨ New commands
- 📝 Documentation improvements
- ⚡ Performance optimizations
- 🎨 UI/UX enhancements
- 🔒 Security improvements

## 🚀 Getting Started

### Prerequisites

- Node.js v16.9.0 or higher
- npm or yarn
- Git
- A Discord bot token (for testing)

### Setup Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork**

```bash
git clone https://github.com/YOUR_USERNAME/vibebot.git
cd vibebot
```

3. **Add upstream remote**

```bash
git remote add upstream https://github.com/Sentinelbot-official/vibebot.git
```

4. **Install dependencies**

```bash
npm install
```

5. **Create .env file**

```bash
cp .env.example .env
# Edit .env and add your test bot token
```

6. **Start the bot**

```bash
npm start
```

## 🔄 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `perf/` - Performance improvements

### 2. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly

### 3. Test Your Changes

- Run the bot and test your feature/fix
- Test edge cases
- Ensure no existing features are broken
- Check for console errors

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add new command for X"
```

See [Commit Guidelines](#commit-guidelines) below.

### 5. Keep Your Fork Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 6. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your branch
- Fill out the PR template
- Submit!

## 📝 Coding Standards

### JavaScript Style

- Use ES6+ features (const/let, arrow functions, async/await)
- Use meaningful variable names
- Keep functions small and focused
- Avoid deeply nested code

### Command Structure

All commands should follow this structure:

```javascript
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'commandname',
  description: 'Clear description of what the command does',
  usage: '<required> [optional]',
  aliases: ['alias1', 'alias2'],
  category: 'general', // general, moderation, economy, etc.
  cooldown: 3, // seconds
  guildOnly: true, // if command only works in servers
  permissions: [PermissionFlagsBits.ManageMessages], // required permissions

  async execute(message, args) {
    try {
      // Command logic here

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setDescription('Response message');

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error in ${this.name}:`, error);
      return message.reply('An error occurred while executing this command.');
    }
  },
};
```

### Error Handling

- Always use try-catch blocks
- Log errors with context
- Provide user-friendly error messages
- Don't expose sensitive information in errors

### Database Usage

```javascript
const db = require('../utils/database');

// Get data
const userData = db.get('users', userId);

// Set data
db.set('users', userId, { coins: 100 });

// Increment
db.increment('economy', userId, 50);
```

### Embeds

- Use consistent colors (see `bot.config.json`)
- Include relevant information
- Keep descriptions concise
- Use fields for structured data

## 💬 Commit Guidelines

Use conventional commit messages:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

Examples:

```
feat: add weather command
fix: resolve purge command exceeding limit
docs: update README with new commands
refactor: optimize database queries
perf: improve command loading speed
```

## 🔍 Pull Request Process

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Changes have been tested
- [ ] No console errors or warnings
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow guidelines
- [ ] Branch is up to date with main

### PR Description

Include:

1. **What** - What does this PR do?
2. **Why** - Why is this change needed?
3. **How** - How does it work?
4. **Testing** - How was it tested?
5. **Screenshots** - If UI changes

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited!

### After Your PR is Merged

- Delete your feature branch
- Pull the latest changes from upstream
- Celebrate! 🎉

## 📄 License Agreement

By contributing to Vibe Bot, you agree that:

1. Your contributions will be licensed under the same proprietary license
2. You grant the project maintainers perpetual rights to use your contributions
3. You retain credit for your work
4. You have the right to submit the contribution

## 🎯 Good First Issues

Look for issues labeled `good first issue` - these are great starting points for new contributors!

## 💡 Need Help?

- **Discord:** Join our support server (link in README)
- **Issues:** Open an issue with the `question` label
- **Email:** vibetbot0@proton.me

## 🌟 Recognition

Contributors will be:
- Credited in commit history
- Mentioned in release notes (for significant contributions)
- Added to a contributors list (coming soon!)

---

Thank you for contributing to Vibe Bot! Your help makes this project better for everyone. 💜

**Built with ❤️ by Airis and the Community**
