# Security Policy

## 🔒 Reporting a Vulnerability

The security of Vibe Bot is a top priority. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Please DO NOT open a public issue for security vulnerabilities.**

Instead, please report security issues via email to:

📧 **vibetbot0@proton.me**

### What to Include

Please include the following information in your report:

- **Description** - A clear description of the vulnerability
- **Impact** - What could an attacker do with this vulnerability?
- **Steps to Reproduce** - Detailed steps to reproduce the issue
- **Proof of Concept** - Code or screenshots demonstrating the vulnerability (if applicable)
- **Suggested Fix** - If you have ideas on how to fix it (optional)
- **Your Contact Info** - So we can follow up with you

### What to Expect

1. **Acknowledgment** - We will acknowledge receipt of your report within 48 hours
2. **Assessment** - We will assess the vulnerability and determine its severity
3. **Updates** - We will keep you informed of our progress
4. **Fix** - We will work on a fix and release it as soon as possible
5. **Credit** - With your permission, we will credit you in the release notes

### Response Timeline

- **Critical vulnerabilities** - Fixed within 24-48 hours
- **High severity** - Fixed within 1 week
- **Medium severity** - Fixed within 2 weeks
- **Low severity** - Fixed in the next release cycle

## 🛡️ Supported Versions

We provide security updates for the following versions:

| Version | Supported |
| ------- | --------- |
| 2.x.x   | ✅ Yes    |
| 1.x.x   | ❌ No     |
| < 1.0   | ❌ No     |

## 🔐 Security Best Practices

### For Bot Administrators

- **Keep your bot token secret** - Never share or commit your `.env` file
- **Use strong passwords** - For any accounts related to the bot
- **Keep dependencies updated** - Run `npm audit` regularly
- **Limit bot permissions** - Only grant necessary permissions
- **Monitor bot activity** - Check logs for suspicious behavior
- **Enable 2FA** - On your Discord and GitHub accounts

### For Contributors

- **Never commit secrets** - Check for tokens, passwords, or API keys
- **Validate user input** - Always sanitize and validate user-provided data
- **Use parameterized queries** - Prevent SQL injection
- **Follow least privilege** - Request only necessary permissions
- **Review dependencies** - Check for known vulnerabilities before adding new packages
- **Test security features** - Ensure permission checks work correctly

## 🚨 Known Security Considerations

### Bot Token Security

The bot token is stored in the `.env` file and should NEVER be committed to version control. The `.env` file is in `.gitignore` to prevent accidental commits.

### Permission System

All moderation commands include:

- Permission checks
- Role hierarchy validation
- Owner protection
- Self-action protection
- Bot protection

### Rate Limiting

The bot implements cooldown systems to prevent:

- Command spam
- API abuse
- Resource exhaustion

### Database Security

- SQLite database with file permissions
- Input sanitization to prevent injection
- Regular automated backups

## 📋 Security Checklist for PRs

Before submitting a pull request, ensure:

- [ ] No secrets or tokens are committed
- [ ] User input is properly validated and sanitized
- [ ] Permission checks are in place for sensitive operations
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date and have no known vulnerabilities
- [ ] Code follows security best practices

## 🔍 Vulnerability Disclosure Policy

We follow a **responsible disclosure** policy:

1. **Private Reporting** - Report vulnerabilities privately first
2. **Coordinated Disclosure** - We will work with you on disclosure timing
3. **Public Disclosure** - After a fix is released, we may publish details
4. **Credit** - We will credit researchers who report responsibly

## 📞 Contact

For security concerns, contact:

- **Email:** vibetbot0@proton.me
- **Subject Line:** `[SECURITY] Brief description`

For non-security issues, please use:

- **GitHub Issues:** https://github.com/Sentinelbot-official/vibebot/issues
- **Discord:** (Support server link coming soon)

## 🏆 Hall of Fame

We appreciate security researchers who help keep Vibe Bot secure. Responsible reporters will be credited here (with permission):

<!-- Security researchers will be listed here -->

_No vulnerabilities reported yet_

---

**Thank you for helping keep Vibe Bot and its users safe!** 🛡️

Last Updated: December 31, 2025
