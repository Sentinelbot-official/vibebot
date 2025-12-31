# 🔴 Twitch Live Status Setup

The `//live` command can check if you're currently streaming on Twitch!

## Quick Setup (Optional)

If you want the command to show **real-time stream status** (viewers, uptime, thumbnail), follow these steps:

### 1. Get Twitch API Credentials

1. Go to https://dev.twitch.tv/console/apps
2. Log in with your Twitch account
3. Click "Register Your Application"
4. Fill in:
   - **Name:** Vibe Bot (or any name)
   - **OAuth Redirect URLs:** `http://localhost`
   - **Category:** Application Integration
5. Click "Create"
6. Click "Manage" on your new application
7. Copy your **Client ID**
8. Click "New Secret" and copy your **Client Secret**

### 2. Add to .env File

Add these lines to your `.env` file:

```env
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here
```

### 3. Update Username (if needed)

If your Twitch username is different from `projectdraguk`, edit `commands/general/live.js`:

```javascript
const twitchUsername = 'your_twitch_username'; // Change this line
```

## Features

### With API Credentials:
- ✅ Shows if you're live or offline
- ✅ Displays stream title
- ✅ Shows current game/category
- ✅ Displays viewer count
- ✅ Shows stream uptime
- ✅ Includes stream thumbnail

### Without API Credentials:
- ✅ Still works! Shows your Twitch link
- ✅ Mentions the 24/7 stream
- ✅ Encourages people to check the stream

## Usage

Users can check if you're live with:
- `//live`
- `//stream`
- `//twitch`
- `//islive`

## Example Output

**When Live:**
```
🔴 LIVE NOW on Twitch!

Airis is currently live!

Building Vibe Bot with the Community!

🎮 Category: Software and Game Development
👥 Viewers: 42
⏱️ Uptime: 3h 24m

[Stream Thumbnail]

Click the title to watch!
```

**When Offline:**
```
📴 Currently Offline

Airis is not currently streaming, but we're live 24/7!

🔴 Check the stream: https://twitch.tv/projectdraguk

We might be back online any moment!
```

---

**Note:** The command works perfectly fine without API credentials - it just won't show real-time status. The Twitch link will always be displayed!
